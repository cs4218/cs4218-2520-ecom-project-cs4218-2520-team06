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
describe("categoryController Integration Tests", () => {
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

  it("should return all categories", async () => {
    const category1 = await categoryModel.create({
      name: "Category 1",
      slug: "category-1",
    });
    const category2 = await categoryModel.create({
      name: "Category 2",
      slug: "category-2",
    });

    const res = await request(app).get("/api/v1/category/get-category");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.length).toBe(2);
    expect(res.body.category[0].name).toBe("Category 1");
    expect(res.body.category[1].name).toBe("Category 2");
  });

  it("should return an empty array if no categories exist", async () => {
    await categoryModel.deleteMany({});

    const res = await request(app).get("/api/v1/category/get-category");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.length).toBe(0);
  });

  it("should handle errors gracefully", async () => {
    // Simulate an error by disconnecting from the database
    await mongoose.connection.close();

    const res = await request(app).get("/api/v1/category/get-category");

    expect(res.statusCode).toEqual(500);
    expect(res.body.success).toBe(false);
  });
});
