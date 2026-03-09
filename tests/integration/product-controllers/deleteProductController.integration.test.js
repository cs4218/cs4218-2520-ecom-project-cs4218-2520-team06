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
const deleteProductApiUrl = "/api/v1/product/delete-product";

// MongoDB Memory Server instance for testing
let mongoServer;

describe("deleteProductController Integration Tests", () => {
  let adminToken;
  let adminUser;
  let testCategory;
  let existingProduct;

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

  // Reset: Create fresh test product before each test
  beforeEach(async () => {
    try {
      await productModel.deleteMany({});
      existingProduct = await productModel.create({
        name: "Test Product",
        slug: "test-product",
        description: "Test description",
        price: 100,
        category: testCategory._id,
        quantity: 20,
        shipping: false,
      });
    } catch (error) {
      console.error("Error creating test product in beforeEach:", error);
    }
  });

  describe("on successful product deletion", () => {
    it("should delete an existing product and return success message", async () => {
      // Act: Send DELETE request to delete product
      const response = await request(app)
        .delete(`${deleteProductApiUrl}/${existingProduct._id}`)
        .set("Authorization", adminToken);

      // Assert: Verify successful deletion response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Product Deleted successfully");

      // Verify database integration: Check product deleted from database
      const deletedProduct = await productModel.findById(existingProduct._id);
      expect(deletedProduct).toBeNull();
    });

    it("should verify product no longer exists in database after deletion", async () => {
      // Arrange: Get initial product count
      const initialCount = await productModel.countDocuments();
      expect(initialCount).toBe(1);

      // Act: Delete the product
      await request(app)
        .delete(`${deleteProductApiUrl}/${existingProduct._id}`)
        .set("Authorization", adminToken);

      // Assert: Verify product count decreased
      const finalCount = await productModel.countDocuments();
      expect(finalCount).toBe(0);
    });
  });

  describe("error handling", () => {
    it("should return success even when trying to delete non-existent product", async () => {
      // Arrange: Create a valid but non-existent MongoDB ObjectId
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act: Attempt to delete non-existent product
      const response = await request(app)
        .delete(`${deleteProductApiUrl}/${nonExistentId}`)
        .set("Authorization", adminToken);

      // Assert: Controller returns 200 even if product doesn't exist (idempotent behavior)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return error with invalid product ID format", async () => {
      // Act: Send request with invalid ID format
      const response = await request(app)
        .delete(`${deleteProductApiUrl}/invalid-id-format`)
        .set("Authorization", adminToken);

      // Assert: Verify error response
      expect(response.status).toBe(500);
    });
  });

  describe("authentication and authorization", () => {
    it("should fail when no token is provided", async () => {
      // Act: Send request without authorization header
      const response = await request(app)
        .delete(`${deleteProductApiUrl}/${existingProduct._id}`);

      // Assert: Verify unauthorized response
      expect(response.status).toBe(401);

      // Verify product not deleted
      const productStillExists = await productModel.findById(existingProduct._id);
      expect(productStillExists).not.toBeNull();
    });

    it("should fail when invalid token is provided", async () => {
      // Act: Send request with invalid token
      const response = await request(app)
        .delete(`${deleteProductApiUrl}/${existingProduct._id}`)
        .set("Authorization", "invalid-token");

      // Assert: Verify unauthorized response
      expect(response.status).toBe(401);

      // Verify product not deleted
      const productStillExists = await productModel.findById(existingProduct._id);
      expect(productStillExists).not.toBeNull();
    });

    it("should fail when non-admin user tries to delete product", async () => {
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

      // Act: Attempt to delete product with regular user token
      const response = await request(app)
        .delete(`${deleteProductApiUrl}/${existingProduct._id}`)
        .set("Authorization", userToken);

      // Assert: Verify authorization error
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");

      // Verify product not deleted
      const productStillExists = await productModel.findById(existingProduct._id);
      expect(productStillExists).not.toBeNull();

      // Cleanup
      try {
        await userModel.findByIdAndDelete(regularUser._id);
      } catch (error) {
        console.error("Error cleaning up regular user:", error);
      }
    });
  });

  describe("database integrity", () => {
    it("should not affect other products when deleting one product", async () => {
      // Arrange: Create two additional products
      const product2 = await productModel.create({
        name: "Product 2",
        slug: "product-2",
        description: "Description 2",
        price: 50,
        category: testCategory._id,
        quantity: 10,
      });

      const product3 = await productModel.create({
        name: "Product 3",
        slug: "product-3",
        description: "Description 3",
        price: 75,
        category: testCategory._id,
        quantity: 15,
      });

      // Act: Delete first product
      await request(app)
        .delete(`${deleteProductApiUrl}/${existingProduct._id}`)
        .set("Authorization", adminToken);

      // Assert: Verify other products still exist
      const product2StillExists = await productModel.findById(product2._id);
      expect(product2StillExists).not.toBeNull();
      expect(product2StillExists.name).toBe("Product 2");

      const product3StillExists = await productModel.findById(product3._id);
      expect(product3StillExists).not.toBeNull();
      expect(product3StillExists.name).toBe("Product 3");

      // Verify correct count
      const remainingCount = await productModel.countDocuments();
      expect(remainingCount).toBe(2);

      // Cleanup
      await productModel.findByIdAndDelete(product2._id);
      await productModel.findByIdAndDelete(product3._id);
    });
  });
});
