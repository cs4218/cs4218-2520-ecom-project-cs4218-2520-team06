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

const sendJson = async ({ path, method = "POST", body }) => {
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

describe("productFiltersController Integration Tests", () => {
  let category;
  let other_category;

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

    other_category = await categoryModel.create({
      name: "Other",
      slug: "other",
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
      {
        name: "Budget Mouse",
        slug: "budget-mouse",
        description: "Affordable mouse",
        price: 25,
        category: category._id,
        quantity: 30,
      },
      {
        name: "Pot of Flowers",
        slug: "pot-of-flowers",
        description: "A pot of flowers",
        price: 5,
        category: other_category._id,
        quantity: 10,
      },
    ]);
  });

  it("should filter by category", async () => {
    // Empty Arrange

    // Act
    const res = await sendJson({
      path: "/api/v1/product/product-filters",
      body: { checked: [category._id.toString()], radio: [] },
    });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(3);
    res.body.products.forEach(product => {
      expect(product.category).toBe(category._id.toString());
    });
  });

  it("should filter by price range", async () => {
    // Empty Arrange

    // Act
    const res = await sendJson({
      path: "/api/v1/product/product-filters",
      body: { checked: [], radio: [100, 2000] }, // price range is: 100 <= price <= 2000
    });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(2);
    const prices = res.body.products.map(p => p.price);
    expect(prices).toEqual(expect.arrayContaining([120, 1999]));
  });

  it("should filter by category and price range together", async () => {
    // Empty Arrange

    // Act
    const res = await sendJson({
      path: "/api/v1/product/product-filters",
      body: { checked: [category._id.toString()], radio: [30, 150] },
    });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Office Keyboard");
  });

  it("should return all products if no filters are applied", async () => {
    const res = await sendJson({
      path: "/api/v1/product/product-filters",
      body: { checked: [], radio: [] },
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(4);
  });
});