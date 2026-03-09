// Gallen Ong, A0252614L
import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import categoryModel from "../../../models/categoryModel.js";
import userModel from "../../../models/userModel.js";
import { hashPassword } from "../../../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import categoryRoutes from "../../../routes/categoryRoutes.js";

// Load environment variables
dotenv.config();

// Set Jest timeout for integration tests with database operations
jest.setTimeout(10000);

const app = express();
app.use(express.json());
app.use("/api/v1/category", categoryRoutes);
const createCategoryApiUrl = "/api/v1/category/create-category";

// MongoDB Memory Server instance for testing
let mongoServer;

describe("createCategoryController Integration Tests", () => {
  let adminToken;
  let adminUser;

  // Setup: Start in-memory MongoDB and create test admin user
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create admin user for authentication
    const hashedPassword = await hashPassword("admin123");
    adminUser = await userModel.create({
      name: "Admin User",
      email: "admin@test.com",
      password: hashedPassword,
      phone: "1234567890",
      address: { street: "123 Admin St" },
      answer: "test answer",
      role: 1, // Admin role
    });

    // Generate JWT token for admin
    adminToken = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  });

  // Cleanup: Stop in-memory MongoDB and close database connection
  afterAll(async () => {
    try {
      await categoryModel.deleteMany({});
      await userModel.deleteMany({});
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    } finally {
      await mongoose.connection.close();
      if (mongoServer) {
        await mongoServer.stop();
      }
    }
  });

  // Reset: Clear categories before each test to ensure test isolation
  beforeEach(async () => {
    try {
      await categoryModel.deleteMany({});
    } catch (error) {
      console.error("Error clearing categories in beforeEach:", error);
    }
  });

  describe("on successful creation of a category", () => {
    it("should create a new category when valid data is provided", async () => {
      // Act: Send POST request to create category
      const response = await request(app)
        .post(createCategoryApiUrl)
        .set("Authorization", adminToken)
        .send({ name: "Electronics" });

      // Assert: Verify successful creation response
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("new category created");
      expect(response.body.category).toBeDefined();
      expect(response.body.category.name).toBe("Electronics");
      expect(response.body.category.slug).toBe("electronics");

      // Verify database integration: Check category exists in database
      const savedCategory = await categoryModel.findOne({ name: "Electronics" });
      expect(savedCategory).not.toBeNull();
      expect(savedCategory.name).toBe("Electronics");
      expect(savedCategory.slug).toBe("electronics");
    });

    it("should create categories with special characters in name", async () => {
      // Act: Create category with special characters
      const response = await request(app)
        .post(createCategoryApiUrl)
        .set("Authorization", adminToken)
        .send({ name: "Home & Garden" });

      // Assert: Verify successful creation and proper slug generation
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.category.name).toBe("Home & Garden");

      // Verify database integration
      const savedCategory = await categoryModel.findOne({ name: "Home & Garden" });
      expect(savedCategory).not.toBeNull();
    });

    it("should create multiple unique categories sequentially", async () => {
      // Arrange: Create first category
      await request(app)
        .post(createCategoryApiUrl)
        .set("Authorization", adminToken)
        .send({ name: "Electronics" });

      // Act: Create second category
      const response = await request(app)
        .post(createCategoryApiUrl)
        .set("Authorization", adminToken)
        .send({ name: "Books" });

      // Assert: Verify both categories exist
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Verify database integration: Both categories should exist
      const categoryCount = await categoryModel.countDocuments();
      expect(categoryCount).toBe(2);
    });
  });

  describe("validation errors", () => {
    it("should return error when name is missing", async () => {
      // Act: Send request without name
      const response = await request(app)
        .post(createCategoryApiUrl)
        .set("Authorization", adminToken)
        .send({});

      // Assert: Verify validation error response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Name is required");

      // Verify database integration: No category should be created
      const categoryCount = await categoryModel.countDocuments();
      expect(categoryCount).toBe(0);
    });

    it("should return error when name is empty string", async () => {
      // Act: Send request with empty name
      const response = await request(app)
        .post(createCategoryApiUrl)
        .set("Authorization", adminToken)
        .send({ name: "" });

      // Assert: Verify validation error
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Name is required");
    });

    it("should return error when category already exists", async () => {
      // Arrange: Create initial category in database
      await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });

      // Act: Attempt to create duplicate category
      const response = await request(app)
        .post(createCategoryApiUrl)
        .set("Authorization", adminToken)
        .send({ name: "Electronics" });

      // Assert: Verify duplicate error response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Category Already Exists");

      // Verify database integration: Only one category should exist
      const categoryCount = await categoryModel.countDocuments({ name: "Electronics" });
      expect(categoryCount).toBe(1);
    });
  });

  describe("authentication and authorization", () => {
    it("should fail when no token is provided", async () => {
      // Act: Send request without authorization header
      const response = await request(app)
        .post(createCategoryApiUrl)
        .send({ name: "Electronics" });

      // Assert: Verify request fails (middleware blocks without token)
      expect(response.status).not.toBe(201);
    });

    it("should fail when invalid token is provided", async () => {
      // Act: Send request with invalid token
      const response = await request(app)
        .post(createCategoryApiUrl)
        .set("Authorization", "invalid-token")
        .send({ name: "Electronics" });

      // Assert: Verify unauthorized response
      expect(response.status).not.toBe(201);
    });

    it("should fail when non-admin user tries to create category", async () => {
      // Arrange: Create regular non-admin user
      const hashedPassword = await hashPassword("user123");
      const regularUser = await userModel.create({
        name: "Regular User",
        email: "user@test.com",
        password: hashedPassword,
        phone: "9876543210",
        address: { street: "456 User St" },
        answer: "test answer",
        role: 0, // Regular user role
      });

      // Generate token for regular user
      const userToken = JWT.sign({ _id: regularUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      // Act: Attempt to create category with regular user token
      const response = await request(app)
        .post(createCategoryApiUrl)
        .set("Authorization", userToken)
        .send({ name: "Electronics" });

      // Assert: Verify authorization error (isAdmin middleware should block)
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");

      // Cleanup: Remove regular user
      try {
        await userModel.findByIdAndDelete(regularUser._id);
      } catch (error) {
        console.error("Error cleaning up regular user:", error);
      }
    });
  });
});
