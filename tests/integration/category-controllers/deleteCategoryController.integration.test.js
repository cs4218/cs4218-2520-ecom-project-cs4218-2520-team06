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
const deleteCategoryApiUrl = "/api/v1/category/delete-category";

// MongoDB Memory Server instance for testing
let mongoServer;

describe("deleteCategoryController Integration Tests", () => {
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

  describe("on successful category deletion", () => {
    it("should delete an existing category", async () => {
      // Arrange: Create a category to delete
      const category = await categoryModel.create({
        name: "Category to Delete",
        slug: "category-to-delete",
      });

      // Act: Send DELETE request to delete category
      const response = await request(app)
        .delete(`${deleteCategoryApiUrl}/${category._id}`)
        .set("Authorization", adminToken);

      // Assert: Verify successful deletion response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category Deleted Successfully");

      // Verify database integration: Check category no longer exists in database
      const deletedCategory = await categoryModel.findById(category._id);
      expect(deletedCategory).toBeNull();
    });

    it("should delete category by ID regardless of other data", async () => {
      // Arrange: Create multiple categories
      const category1 = await categoryModel.create({
        name: "Category 1",
        slug: "category-1",
      });
      const category2 = await categoryModel.create({
        name: "Category 2",
        slug: "category-2",
      });
      const category3 = await categoryModel.create({
        name: "Category 3",
        slug: "category-3",
      });

      // Act: Delete only category2
      const response = await request(app)
        .delete(`${deleteCategoryApiUrl}/${category2._id}`)
        .set("Authorization", adminToken);

      // Assert: Verify only category2 is deleted
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify other categories still exist
      const remaining1 = await categoryModel.findById(category1._id);
      const remaining2 = await categoryModel.findById(category2._id);
      const remaining3 = await categoryModel.findById(category3._id);

      expect(remaining1).not.toBeNull();
      expect(remaining2).toBeNull();
      expect(remaining3).not.toBeNull();

      // Cleanup
      await categoryModel.deleteMany({});
    });

    it("should handle deletion of non-existent category gracefully", async () => {
      // Arrange: Use a valid but non-existent MongoDB ID
      const fakeId = new mongoose.Types.ObjectId();

      // Act: Try to delete non-existent category
      const response = await request(app)
        .delete(`${deleteCategoryApiUrl}/${fakeId}`)
        .set("Authorization", adminToken);

      // Assert: Should return 200 with success (MongoDB doesn't error on delete of non-existent)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category Deleted Successfully");
    });
  });

  describe("authentication and authorization", () => {
    it("should fail when no token is provided", async () => {
      // Arrange: Create a category to delete
      const category = await categoryModel.create({
        name: "Test Category",
        slug: "test-category",
      });

      // Act: Send DELETE request without authorization header
      const response = await request(app)
        .delete(`${deleteCategoryApiUrl}/${category._id}`);

      // Assert: Verify unauthorized response
      expect(response.status).not.toBe(200);

      // Verify category still exists (deletion should have failed)
      const stillExists = await categoryModel.findById(category._id);
      expect(stillExists).not.toBeNull();
    });

    it("should fail when invalid token is provided", async () => {
      // Arrange: Create a category to delete
      const category = await categoryModel.create({
        name: "Test Category",
        slug: "test-category",
      });

      // Act: Send DELETE request with invalid token
      const response = await request(app)
        .delete(`${deleteCategoryApiUrl}/${category._id}`)
        .set("Authorization", "invalid-token");

      // Assert: Verify unauthorized response
      expect(response.status).not.toBe(200);

      // Verify category still exists
      const stillExists = await categoryModel.findById(category._id);
      expect(stillExists).not.toBeNull();
    });

    it("should fail when non-admin user tries to delete category", async () => {
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

      // Create a category to attempt deletion
      const category = await categoryModel.create({
        name: "Protected Category",
        slug: "protected-category",
      });

      // Act: Attempt to delete category with regular user token
      const response = await request(app)
        .delete(`${deleteCategoryApiUrl}/${category._id}`)
        .set("Authorization", userToken);

      // Assert: Verify authorization error
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");

      // Verify category still exists (deletion should have failed)
      const stillExists = await categoryModel.findById(category._id);
      expect(stillExists).not.toBeNull();

      // Cleanup
      try {
        await userModel.findByIdAndDelete(regularUser._id);
        await categoryModel.findByIdAndDelete(category._id);
      } catch (error) {
        console.error("Error cleaning up:", error);
      }
    });
  });
});
