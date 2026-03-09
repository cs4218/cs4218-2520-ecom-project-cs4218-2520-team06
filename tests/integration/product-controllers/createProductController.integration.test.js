// Gallen Ong, A0252614L
import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import userModel from "../../../models/userModel.js";
import { hashPassword } from "../../../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import productRoutes from "../../../routes/productRoutes.js";

// Load environment variables
dotenv.config();

// Set Jest timeout for integration tests with database operations
jest.setTimeout(10000);

const app = express();
app.use(express.json());
app.use("/api/v1/product", productRoutes);
const createProductApiUrl = "/api/v1/product/create-product";

// MongoDB Memory Server instance for testing
let mongoServer;

describe("createProductController Integration Tests", () => {
  let adminToken;
  let adminUser;
  let testCategory;

  // Setup: Start in-memory MongoDB and create test admin user + category
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

    // Create a test category for products
    testCategory = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
  });

  // Cleanup: Stop in-memory MongoDB and close database connection
  afterAll(async () => {
    try {
      await productModel.deleteMany({});
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

  // Reset: Clear products before each test to ensure test isolation
  beforeEach(async () => {
    try {
      await productModel.deleteMany({});
    } catch (error) {
      console.error("Error clearing products in beforeEach:", error);
    }
  });

  describe("on successful product creation", () => {
    it("should create a new product with all required fields", async () => {
      // Act: Send POST request to create product
      const response = await request(app)
        .post(createProductApiUrl)
        .set("Authorization", adminToken)
        .field("name", "Test Product")
        .field("description", "This is a test product")
        .field("price", "99.99")
        .field("category", testCategory._id.toString())
        .field("quantity", "10")
        .field("shipping", "true");

      // Assert: Verify successful creation response
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Product Created Successfully");
      expect(response.body.products).toBeDefined();
      expect(response.body.products.name).toBe("Test Product");
      expect(response.body.products.slug).toBe("Test-Product");
      expect(response.body.products.price).toBe(99.99);

      // Verify database integration: Check product exists in database
      const savedProduct = await productModel.findOne({ name: "Test Product" });
      expect(savedProduct).not.toBeNull();
      expect(savedProduct.name).toBe("Test Product");
      expect(savedProduct.description).toBe("This is a test product");
    });

    it("should create product without photo", async () => {
      // Act: Create product without photo attachment
      const response = await request(app)
        .post(createProductApiUrl)
        .set("Authorization", adminToken)
        .field("name", "Product Without Photo")
        .field("description", "No photo product")
        .field("price", "50")
        .field("category", testCategory._id.toString())
        .field("quantity", "5")
        .field("shipping", "false");

      // Assert: Verify successful creation
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.products.name).toBe("Product Without Photo");

      // Verify in database
      const savedProduct = await productModel.findOne({ name: "Product Without Photo" });
      expect(savedProduct).not.toBeNull();
    });

    it("should generate slug from product name", async () => {
      // Act: Create product with multi-word name
      const response = await request(app)
        .post(createProductApiUrl)
        .set("Authorization", adminToken)
        .field("name", "Amazing Product Name")
        .field("description", "Test description")
        .field("price", "100")
        .field("category", testCategory._id.toString())
        .field("quantity", "15");

      // Assert: Verify slug generation
      expect(response.status).toBe(201);
      expect(response.body.products.slug).toBe("Amazing-Product-Name");
    });
  });

  describe("validation errors", () => {
    it("should return error when required field is missing (smoke test)", async () => {
      // Act: Send request without name (validation handled by controller unit tests)
      const response = await request(app)
        .post(createProductApiUrl)
        .set("Authorization", adminToken)
        .field("description", "Test description")
        .field("price", "100")
        .field("category", testCategory._id.toString())
        .field("quantity", "10");

      // Assert: Verify validation error response and no database side effects
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Name is Required");

      // Verify no product created in database
      const count = await productModel.countDocuments();
      expect(count).toBe(0);
    });
  });

  describe("authentication and authorization", () => {
    it("should fail when no token is provided", async () => {
      // Act: Send request without authorization header
      const response = await request(app)
        .post(createProductApiUrl)
        .field("name", "Test Product")
        .field("description", "Test")
        .field("price", "100")
        .field("category", testCategory._id.toString())
        .field("quantity", "10");

      // Assert: Verify unauthorized response
      expect(response.status).not.toBe(201);
    });

    it("should fail when invalid token is provided", async () => {
      // Act: Send request with invalid token
      const response = await request(app)
        .post(createProductApiUrl)
        .set("Authorization", "invalid-token")
        .field("name", "Test Product")
        .field("description", "Test")
        .field("price", "100")
        .field("category", testCategory._id.toString())
        .field("quantity", "10");

      // Assert: Verify unauthorized response
      expect(response.status).not.toBe(201);
    });

    it("should fail when non-admin user tries to create product", async () => {
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

      // Act: Attempt to create product with regular user token
      const response = await request(app)
        .post(createProductApiUrl)
        .set("Authorization", userToken)
        .field("name", "Test Product")
        .field("description", "Test")
        .field("price", "100")
        .field("category", testCategory._id.toString())
        .field("quantity", "10");

      // Assert: Verify authorization error
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");

      // Cleanup
      try {
        await userModel.findByIdAndDelete(regularUser._id);
      } catch (error) {
        console.error("Error cleaning up regular user:", error);
      }
    });
  });
});
