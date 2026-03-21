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

describe("productCountController Integration Tests", () => {
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

    await productModel.create([
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
    ]);
  });

  it("should return the correct total count of products", async () => {
    // Empty Arrange

    // Act
    const res = await sendJson({ path: "/api/v1/product/product-count" });
    
    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(3);
  });

  it("should return 0 if no products exist", async () => {
    // Arrange
    await productModel.deleteMany({});

    // Act
    const res = await sendJson({ path: "/api/v1/product/product-count" });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(0);
  });
});