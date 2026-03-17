// Jabez Tho, A0273312N
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

const searchProductApiUrl = "/api/v1/product/search";

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

describe("searchProductController Integration Tests", () => {
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
      await new Promise((resolve, reject) => {
        if (!server) {
          resolve();
          return;
        }

        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      await mongoose.connection.close();
      if (mongoServer) {
        await mongoServer.stop();
      }
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
        description: "High performance laptop for gaming",
        price: 1999,
        category: category._id,
        quantity: 7,
        shipping: true,
        photo: {
          data: Buffer.from("fake-image-bytes"),
          contentType: "image/png",
        },
      },
      {
        name: "Office Keyboard",
        slug: "office-keyboard",
        description: "Mechanical keyboard for daily typing",
        price: 120,
        category: category._id,
        quantity: 14,
        shipping: true,
      },
      {
        name: "Wireless Mouse",
        slug: "wireless-mouse",
        description: "Portable device with silent clicks",
        price: 40,
        category: category._id,
        quantity: 30,
        shipping: true,
      },
    ]);
  });

  it("should return matching persisted products including its name and description", async () => {
    const response = await sendJson({
      path: `${searchProductApiUrl}/laptop`,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("Gaming Laptop");
    expect(response.body[0].description).toContain("gaming");
  });

  it("should search case-insensitively", async () => {
    const response = await sendJson({
      path: `${searchProductApiUrl}/MECHANICAL`,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("Office Keyboard");
  });

  it("should exclude photo field from response payload", async () => {
    const response = await sendJson({
      path: `${searchProductApiUrl}/laptop`,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].photo).toBeUndefined();
  });

  it("should return an empty array when no products match", async () => {
    const response = await sendJson({
      path: `${searchProductApiUrl}/non-existent-keyword`,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
