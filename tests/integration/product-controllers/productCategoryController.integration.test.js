// Kok Bo Chang, A0273542E
import mongoose from "mongoose";
import express from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import productRoutes from "../../../routes/productRoutes.js";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";

jest.setTimeout(10000);

const app = express();
app.use(express.json());
app.use("/api/v1/product", productRoutes);

let mongoServer;
let server;
let baseUrl;

const sendJson = async ({ path, method = "GET", body }) => {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  };
  const response = await fetch(`${baseUrl}${path}`, options);
  return {
    status: response.status,
    body: await response.json(),
  };
};

describe("productCategoryController Integration Tests", () => {
  let category;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    try {
      await productModel.deleteMany({});
      await categoryModel.deleteMany({});
    } finally {
      if (server) await new Promise((res, rej) => server.close(err => (err ? rej(err) : res())));
      await mongoose.connection.close();
      if (mongoServer) await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});

    category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    await productModel.create([
      {
        name: "Gaming Laptop",
        slug: "gaming-laptop",
        description: "High performance laptop",
        price: 1999,
        category: category._id,
        quantity: 7,
      },
      {
        name: "Office Keyboard",
        slug: "office-keyboard",
        description: "Mechanical keyboard",
        price: 120,
        category: category._id,
        quantity: 14,
      },
    ]);
  });

  it("should return the category and all products in that category", async () => {
    // Empty arrange

    // Act
    const res = await sendJson({
      path: `/api/v1/product/product-category/${category.slug}`,
    });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.slug).toBe(category.slug);
    expect(res.body.products).toHaveLength(2);
    res.body.products.forEach(product => {
      expect(product.category._id).toBe(category._id.toString());
    });
  });

  it("should return an empty array if the category has no products", async () => {
    // Arrange
    const emptyCategory = await categoryModel.create({
      name: "Empty",
      slug: "empty",
    });

    // Act
    const res = await sendJson({
      path: `/api/v1/product/product-category/${emptyCategory.slug}`,
    });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toEqual([]);
  });
});