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

// helper
const sendJson = async ({ path }) => {
  const response = await fetch(`${baseUrl}${path}`);
  return {
    status: response.status,
    body: await response.json().catch(() => null), // handle non-JSON fields (photo)
    raw: response, // used to validate content-type of returned product photos
  };
};

describe("Product Retrieval Integration Tests", () => {
  let category;
  let products;

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
      await new Promise((resolve, reject) => {
        if (!server) return resolve();
        server.close((err) => (err ? reject(err) : resolve()));
      });

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

    products = await productModel.create([
      {
        name: "Gaming Laptop",
        slug: "gaming-laptop",
        description: "High performance laptop",
        price: 2000,
        category: category._id,
        quantity: 5,
        photo: {
          data: Buffer.from("fake-image"),
          contentType: "image/png",
        },
      },
      {
        name: "Office Keyboard",
        slug: "office-keyboard",
        description: "Mechanical keyboard",
        price: 100,
        category: category._id,
        quantity: 10,
      },
    ]);
  });

  describe("Test for GET /get-product", () => {
    it("should return all products without their respective photos", async () => {
      // Empty Arrange

      // Act
      const res = await sendJson({
        path: "/api/v1/product/get-product",
      });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(2);
      for (const product of res.body.products) {
        expect(product.photo).toBeUndefined();
      }
    });
  });

  describe("Tests for GET /get-product/:slug", () => {
    it("should return a single product by slug", async () => {
      // Empty Arrange

      // Act
      const res = await sendJson({
        path: `/api/v1/product/get-product/${products[0].slug}`,
      });

      // Assert
      // Note: This test assumes slug uniqueness since the schema does not enforce it
      expect(res.status).toBe(200);
      expect(res.body.product.name).toBe("Gaming Laptop");
      expect(res.body.product.photo).toBeUndefined();
    });

    it("should return null product for invalid slug", async () => {
      // Empty Arrange

      // Act
      const res = await sendJson({
        path: `/api/v1/product/get-product/invalid-slug`,
      });
    
      // Assert
      expect(res.status).toBe(200);
      expect(res.body.product).toBeNull();
    });
  });

  describe("Tests for GET /product-photo/:pid", () => {
    it("should return product photo as binary", async () => {
      // Empty Arrange

      // Act
      const res = await sendJson({
        path: `/api/v1/product/product-photo/${products[0]._id}`,
      });

      // Assert
      expect(res.status).toBe(200);
      expect(res.raw.headers.get("content-type")).toBe("image/png");
    });

    it("should return 404 if product has no photo", async () => {
      // Empty Arrange
      
      // Act
      const res = await sendJson({
        path: `/api/v1/product/product-photo/${products[1]._id}`,
      });
      
      // Assert
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});