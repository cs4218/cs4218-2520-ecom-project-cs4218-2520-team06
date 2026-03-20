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

const sendJson = async ({ path }) => {
  const response = await fetch(`${baseUrl}${path}`);
  return {
    status: response.status,
    body: await response.json(),
  };
};

describe("relatedProductController Integration Tests", () => {
  let category;
  let other_category;

  let products;
  let unrelated_products;

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
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    if (server) await new Promise(res => server.close(res));
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
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

    products = await productModel.create([
      { 
        name: "Laptop",
        slug: "laptop",
        description: "desc",
        price: 1000,
        category: category._id,
        quantity: 5
      },
      { 
        name: "Mouse",
        slug: "mouse",
        description: "desc",
        price: 50,
        category: category._id,
        quantity: 10
      },
      { 
        name: "Keyboard",
        slug: "keyboard",
        description: "desc",
        price: 120,
        category: category._id,
        quantity: 7
      },
      { 
        name: "Monitor",
        slug: "monitor",
        description: "desc",
        price: 300,
        category: category._id,
        quantity: 4
      }
    ]);

    unrelated_products = await productModel.create([
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

  it("should return related products excluding the product itself", async () => {
    // Arrange
    const targetProduct = products[0]; // Laptop
    const unrelatedProduct = unrelated_products[0]; // Pot of Flowers, unrelated item

    // Act
    const res = await sendJson({
      path: `/api/v1/product/related-product/${targetProduct._id}/${category._id}`,
    });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(3); // limit = 3
    res.body.products.forEach(p => {
      expect(p._id).not.toBe(unrelatedProduct._id.toString()); // should not contain items of different categories

      expect(p._id).not.toBe(targetProduct._id.toString()); // should not contain item used for query
      expect(p.category._id).toBe(category._id.toString());
    });
  });

  it("should return fewer products if fewer related products exist", async () => {
    // Arrange
    // Delete all but 1 product
    const targetProduct = products[0]; // Laptop
    await productModel.deleteMany({ _id: { $ne: targetProduct._id } });

    // Act
    const res = await sendJson({
      path: `/api/v1/product/related-product/${targetProduct._id}/${category._id}`,
    });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBeLessThanOrEqual(3);
  });
});