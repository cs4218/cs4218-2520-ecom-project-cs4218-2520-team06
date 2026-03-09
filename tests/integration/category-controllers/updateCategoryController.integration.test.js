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
const updateCategoryApiUrl = "/api/v1/category/update-category";

// MongoDB Memory Server instance for testing
let mongoServer;

describe("updateCategoryController Integration Tests", () => {
  let adminToken;
  let adminUser;
  let testCategory;

  // Setup: Start in-memory MongoDB and create test admin user + test category
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

    // Create a test category to update
    testCategory = await categoryModel.create({
      name: "Original Category",
      slug: "original-category",
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

  describe("on successful category update", () => {
    it("should update an existing category with valid data", async () => {
      // Act: Send PUT request to update category
      const response = await request(app)
        .put(`/api/v1/category/update-category/${testCategory._id}`)
        .set("Authorization", adminToken)
        .send({ name: "Updated Category" });

      // Assert: Verify successful update response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category Updated Successfully");
      expect(response.body.category).toBeDefined();
      expect(response.body.category.name).toBe("Updated Category");
      expect(response.body.category.slug).toBe("updated-category");

      // Verify database integration: Check updated category exists in database
      const updatedCategory = await categoryModel.findById(testCategory._id);
      expect(updatedCategory).not.toBeNull();
      expect(updatedCategory.name).toBe("Updated Category");
      expect(updatedCategory.slug).toBe("updated-category");
    });

    it("should update category with special characters in name", async () => {
      // Arrange: Create another test category
      const category = await categoryModel.create({
        name: "Test Category",
        slug: "test-category",
      });

      // Act: Update with special characters
      const response = await request(app)
        .put(`${updateCategoryApiUrl}/${category._id}`)
        .set("Authorization", adminToken)
        .send({ name: "Books & Magazines" });

      // Assert: Verify successful update with special characters
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category.name).toBe("Books & Magazines");

      // Verify database integration
      const updatedCategory = await categoryModel.findById(category._id);
      expect(updatedCategory.name).toBe("Books & Magazines");
    });

    it("should update slug when name is changed", async () => {
      // Arrange: Create test category
      const category = await categoryModel.create({
        name: "OldName",
        slug: "oldname",
      });

      // Act: Update category name
      const response = await request(app)
        .put(`${updateCategoryApiUrl}/${category._id}`)
        .set("Authorization", adminToken)
        .send({ name: "NewName" });

      // Assert: Verify slug is updated along with name
      expect(response.status).toBe(200);
      expect(response.body.category.slug).toBe("newname");

      // Verify database integration
      const updatedCategory = await categoryModel.findById(category._id);
      expect(updatedCategory.slug).toBe("newname");
    });
  });

  describe("validation errors", () => {
    it("should return error when name is missing", async () => {
      // Act: Send request without name
      const response = await request(app)
        .put(`${updateCategoryApiUrl}/${testCategory._id}`)
        .set("Authorization", adminToken)
        .send({});

      // Assert: Verify validation error response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Name is required");
    });

    it("should return error when name is empty string", async () => {
      // Act: Send request with empty name
      const response = await request(app)
        .put(`${updateCategoryApiUrl}/${testCategory._id}`)
        .set("Authorization", adminToken)
        .send({ name: "" });

      // Assert: Verify validation error
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Name is required");
    });

    it("should handle update of non-existent category", async () => {
      // Arrange: Use a valid but non-existent MongoDB ID
      const fakeId = new mongoose.Types.ObjectId();

      // Act: Try to update non-existent category
      const response = await request(app)
        .put(`${updateCategoryApiUrl}/${fakeId}`)
        .set("Authorization", adminToken)
        .send({ name: "New Name" });

      // Assert: Should return 200 but with null category (MongoDB behavior)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category).toBeNull();
    });
  });

  describe("authentication and authorization", () => {
    it("should fail when no token is provided", async () => {
      // Act: Send request without authorization header
      const response = await request(app)
        .put(`${updateCategoryApiUrl}/${testCategory._id}`)
        .send({ name: "Updated" });

      // Assert: Verify unauthorized response
      expect(response.status).not.toBe(200);
    });

    it("should fail when invalid token is provided", async () => {
      // Act: Send request with invalid token
      const response = await request(app)
        .put(`${updateCategoryApiUrl}/${testCategory._id}`)
        .set("Authorization", "invalid-token")
        .send({ name: "Updated" });

      // Assert: Verify unauthorized response
      expect(response.status).not.toBe(200);
    });

    it("should fail when non-admin user tries to update category", async () => {
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

      // Act: Attempt to update category with regular user token
      const response = await request(app)
        .put(`${updateCategoryApiUrl}/${testCategory._id}`)
        .set("Authorization", userToken)
        .send({ name: "Updated" });

      // Assert: Verify authorization error
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
