// Hans Delano, A0273456X
import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import { describe } from "node:test";
import categoryRoutes from "../../../routes/categoryRoutes.js";
import categoryModel from "../../../models/categoryModel.js";

dotenv.config();
jest.setTimeout(10000);

const app = express();
app.use(express.json());
app.use("/api/v1/category", categoryRoutes);

let mongoServer;
describe("singleCategoryController Integration Tests", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("should return queried category", async () => {
    const category1 = await categoryModel.create({
      name: "Category 1",
      slug: "category-1",
    });
    const category2 = await categoryModel.create({
      name: "Category 2",
      slug: "category-2",
    });

    const res = await request(app).get(
      "/api/v1/category/single-category/category-1"
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.name).toBe("Category 1");
  });

  it("should return null if category does not exist", async () => {
    await categoryModel.deleteMany({});

    const res = await request(app).get(
      "/api/v1/category/single-category/category-1"
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category).toBe(null);
  });

  it("should handle errors gracefully", async () => {
    // Simulate an error by disconnecting from the database
    await mongoose.connection.close();

    const res = await request(app).get(
      "/api/v1/category/single-category/category-1"
    );

    expect(res.statusCode).toEqual(500);
    expect(res.body.success).toBe(false);
  });
});
