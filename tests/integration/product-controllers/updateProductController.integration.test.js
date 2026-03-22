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
const updateProductApiUrl = "/api/v1/product/update-product";

// MongoDB Memory Server instance for testing
let mongoServer;

describe("updateProductController Integration Tests", () => {
  let adminToken;
  let adminUser;
  let testCategory;
  let existingProduct;

  // Setup: Start in-memory MongoDB and create test admin user + category + product
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
        name: "Original Product",
        slug: "original-product",
        description: "Original description",
        price: 100,
        category: testCategory._id,
        quantity: 20,
        shipping: false,
      });
    } catch (error) {
      console.error("Error creating test product in beforeEach:", error);
    }
  });

  describe("on successful product update", () => {
    it("should update an existing product's fields", async () => {
      // Act: Send PUT request to update product
      const response = await request(app)
        .put(`${updateProductApiUrl}/${existingProduct._id}`)
        .set("Authorization", adminToken)
        .field("name", "Updated Product")
        .field("description", "Updated description")
        .field("price", "150")
        .field("category", testCategory._id.toString())
        .field("quantity", "30");

      // Assert: Verify successful update response
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Product Updated Successfully");
      expect(response.body.products).toBeDefined();
      expect(response.body.products.name).toBe("Updated Product");
      expect(response.body.products.price).toBe(150);
      expect(response.body.products.quantity).toBe(30);

      // Verify database integration: Check product updated in database
      const updatedProduct = await productModel.findById(existingProduct._id);
      expect(updatedProduct.name).toBe("Updated Product");
      expect(updatedProduct.description).toBe("Updated description");
      expect(updatedProduct.price).toBe(150);
      expect(updatedProduct.quantity).toBe(30);
    });

    it("should regenerate slug when name is updated", async () => {
      // Act: Update product name
      const response = await request(app)
        .put(`${updateProductApiUrl}/${existingProduct._id}`)
        .set("Authorization", adminToken)
        .field("name", "Brand New Product Name")
        .field("description", "Updated description")
        .field("price", "150")
        .field("category", testCategory._id.toString())
        .field("quantity", "30");

      // Assert: Verify slug regeneration
      expect(response.status).toBe(201);
      expect(response.body.products.slug).toBe("Brand-New-Product-Name");

      // Verify in database
      const updatedProduct = await productModel.findById(existingProduct._id);
      expect(updatedProduct.slug).toBe("Brand-New-Product-Name");
    });

    it("should update product without changing photo", async () => {
      // Act: Update product fields without photo
      const response = await request(app)
        .put(`${updateProductApiUrl}/${existingProduct._id}`)
        .set("Authorization", adminToken)
        .field("name", "Updated Product")
        .field("description", "New description")
        .field("price", "200")
        .field("category", testCategory._id.toString())
        .field("quantity", "25");

      // Assert: Verify successful update
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.products.name).toBe("Updated Product");
      expect(response.body.products.price).toBe(200);

      // Verify database
      const updatedProduct = await productModel.findById(existingProduct._id);
      expect(updatedProduct.name).toBe("Updated Product");
      expect(updatedProduct.description).toBe("New description");
    });

    it("should reject partial updates due to validation requirements", async () => {
      // Act: Attempt to update only price field
      const response = await request(app)
        .put(`${updateProductApiUrl}/${existingProduct._id}`)
        .set("Authorization", adminToken)
        .field("price", "250");

      // Assert: Verify validation error (controller requires all fields)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Name is Required");

      // Verify product unchanged in database
      const unchangedProduct = await productModel.findById(existingProduct._id);
      expect(unchangedProduct.price).toBe(100);
      expect(unchangedProduct.name).toBe("Original Product");
    });
  });

  describe("error handling", () => {
    it("should return error when trying to update non-existent product", async () => {
      // Arrange: Create a valid but non-existent MongoDB ObjectId
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act: Attempt to update non-existent product
      const response = await request(app)
        .put(`${updateProductApiUrl}/${nonExistentId}`)
        .set("Authorization", adminToken)
        .field("name", "Updated Product")
        .field("description", "Updated description")
        .field("price", "150")
        .field("category", testCategory._id.toString())
        .field("quantity", "30");

      // Assert: Verify error response
      expect(response.status).not.toBe(201);
    });

    it("should return error with invalid product ID format", async () => {
      // Act: Send request with invalid ID format
      const response = await request(app)
        .put(`${updateProductApiUrl}/invalid-id-format`)
        .set("Authorization", adminToken)
        .field("name", "Updated Product")
        .field("description", "Updated description")
        .field("price", "150")
        .field("category", testCategory._id.toString())
        .field("quantity", "30");

      // Assert: Verify error response
      expect(response.status).not.toBe(201);
    });
  });

  describe("database integrity", () => {
    it("should not affect other products when updating one product", async () => {
      // Arrange: Create another product
      const anotherProduct = await productModel.create({
        name: "Another Product",
        slug: "another-product",
        description: "Another description",
        price: 50,
        category: testCategory._id,
        quantity: 5,
      });

      // Act: Update first product
      await request(app)
        .put(`${updateProductApiUrl}/${existingProduct._id}`)
        .set("Authorization", adminToken)
        .field("name", "Updated Product")
        .field("description", "Updated description")
        .field("price", "200")
        .field("category", testCategory._id.toString())
        .field("quantity", "25");

      // Assert: Verify second product unchanged
      const unchangedProduct = await productModel.findById(anotherProduct._id);
      expect(unchangedProduct.name).toBe("Another Product");
      expect(unchangedProduct.price).toBe(50);

      // Cleanup
      await productModel.findByIdAndDelete(anotherProduct._id);
    });
  });
});
