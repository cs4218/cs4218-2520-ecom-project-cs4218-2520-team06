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
      const category = await categoryModel.create({
        name: "Category to Delete",
        slug: "category-to-delete",
      });

      const response = await request(app)
        .delete(`${deleteCategoryApiUrl}/${category._id}`)
        .set("Authorization", adminToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category Deleted Successfully");

      // Category should be removed from database
      const deletedCategory = await categoryModel.findById(category._id);
      expect(deletedCategory).toBeNull();
    });

    it("should delete category by ID regardless of other data", async () => {
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

      const response = await request(app)
        .delete(`${deleteCategoryApiUrl}/${category2._id}`)
        .set("Authorization", adminToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Only target category should be deleted
      const remaining1 = await categoryModel.findById(category1._id);
      const remaining2 = await categoryModel.findById(category2._id);
      const remaining3 = await categoryModel.findById(category3._id);

      expect(remaining1).not.toBeNull();
      expect(remaining2).toBeNull();
      expect(remaining3).not.toBeNull();

      await categoryModel.deleteMany({});
    });

    it("should handle deletion of non-existent category gracefully", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`${deleteCategoryApiUrl}/${fakeId}`)
        .set("Authorization", adminToken);

      // Deletion of non-existent document succeeds (idempotent)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category Deleted Successfully");
    });
  });

});
