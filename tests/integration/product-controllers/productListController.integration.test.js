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

describe("productListController Integration Tests", () => {
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

    const products = Array.from({ length: 13 }, (_, i) => ({
      name: `Product${i + 1}`,
      slug: `product${i + 1}`,
      description: "desc",
      price: 100 + i,
      category: category._id,
      quantity: 5,
    }));

    // This will ensure products are inserted in a deterministic order
    for (const product of products) {
        await productModel.create(product);
    }
  });

  it("should return paginated products with the default page being page 1", async () => {
    // Empty Arrange

    // Act
    const res = await sendJson({ path: "/api/v1/product/product-list/1" });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(6); // perPage = 6
    // Products are sorted in descending order based on createdAt field
    expect(res.body.products[0].name).toBe("Product13"); 
  });

  it("should return the correct products for page 2", async () => {
    // Empty Arrange

    // Act
    const res = await sendJson({ path: "/api/v1/product/product-list/2" });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(6); // perPage = 6
    // Products are sorted in descending order based on createdAt field
    expect(res.body.products[0].name).toBe("Product7");
  });

  it("should return the correct products for the last page being page 3", async () => {
    // Empty Arrange

    // Act
    const res = await sendJson({ path: "/api/v1/product/product-list/3" });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // There should not be enough products to fill the whole page
    expect(res.body.products).toHaveLength(1); // perPage = 6
    expect(res.body.products[0].name).toBe("Product1");
  });
});