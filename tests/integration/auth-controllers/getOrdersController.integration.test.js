import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import authRoutes from "../../../routes/authRoute.js";
import userModel from "../../../models/userModel.js";
import orderModel from "../../../models/orderModel.js";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import { hashPassword } from "../../../helpers/authHelper.js";

dotenv.config();

jest.setTimeout(10000);

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);

const ordersApiUrl = "/api/v1/auth/orders";

let mongoServer;
let server;
let baseUrl;

const sendJson = async ({ method, path, token, body }) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    body: await response.json(),
  };
};

describe("getOrdersController Integration Tests", () => {
  let regularUser;
  let otherUser;
  let regularUserToken;
  let category;
  let product1;
  let product2;

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
      await orderModel.deleteMany({});
      await productModel.deleteMany({});
      await categoryModel.deleteMany({});
      await userModel.deleteMany({});
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
    await orderModel.deleteMany({});
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    await userModel.deleteMany({});

    regularUser = await userModel.create({
      name: "Regular User",
      email: "user@test.com",
      password: await hashPassword("password123"),
      phone: "1234567890",
      address: "123 Street",
      answer: "blue",
      role: 0,
    });

    otherUser = await userModel.create({
      name: "Other User",
      email: "other@test.com",
      password: await hashPassword("password123"),
      phone: "0987654321",
      address: "456 Avenue",
      answer: "red",
      role: 0,
    });

    regularUserToken = JWT.sign(
      { _id: regularUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    product1 = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "A powerful laptop",
      price: 999.99,
      category: category._id,
      quantity: 10,
      shipping: true,
    });

    product2 = await productModel.create({
      name: "Mouse",
      slug: "mouse",
      description: "Wireless mouse",
      price: 29.99,
      category: category._id,
      quantity: 50,
      shipping: true,
    });
  });

  describe("on successful order retrieval", () => {
    it("should return only orders belonging to the authenticated user", async () => {
      await orderModel.create({
        products: [product1._id],
        buyer: regularUser._id,
        payment: { success: true },
        status: "Not Process",
      });

      await orderModel.create({
        products: [product2._id],
        buyer: otherUser._id,
        payment: { success: true },
        status: "Processing",
      });

      const response = await sendJson({
        method: "GET",
        path: ordersApiUrl,
        token: regularUserToken,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].buyer._id.toString()).toBe(
        regularUser._id.toString()
      );
    });

    it("should populate product data excluding photo field", async () => {
      await orderModel.create({
        products: [product1._id, product2._id],
        buyer: regularUser._id,
        payment: { success: true },
        status: "Processing",
      });

      const response = await sendJson({
        method: "GET",
        path: ordersApiUrl,
        token: regularUserToken,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);

      const products = response.body[0].products;
      expect(products).toHaveLength(2);

      const laptopProduct = products.find((p) => p.name === "Laptop");
      expect(laptopProduct).toBeDefined();
      expect(laptopProduct.description).toBe("A powerful laptop");
      expect(laptopProduct.price).toBe(999.99);
      expect(laptopProduct.photo).toBeUndefined();

      const mouseProduct = products.find((p) => p.name === "Mouse");
      expect(mouseProduct).toBeDefined();
      expect(mouseProduct.price).toBe(29.99);
      expect(mouseProduct.photo).toBeUndefined();
    });

    it("should populate buyer data with only name field", async () => {
      await orderModel.create({
        products: [product1._id],
        buyer: regularUser._id,
        payment: { success: true },
        status: "Not Process",
      });

      const response = await sendJson({
        method: "GET",
        path: ordersApiUrl,
        token: regularUserToken,
      });

      expect(response.status).toBe(200);
      const buyer = response.body[0].buyer;
      expect(buyer.name).toBe("Regular User");
      expect(buyer.email).toBeUndefined();
      expect(buyer.phone).toBeUndefined();
      expect(buyer.password).toBeUndefined();
    });

    it("should return empty array when user has no orders", async () => {
      const response = await sendJson({
        method: "GET",
        path: ordersApiUrl,
        token: regularUserToken,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("authentication handling", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await sendJson({
        method: "GET",
        path: ordersApiUrl,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 when invalid token is provided", async () => {
      const response = await sendJson({
        method: "GET",
        path: ordersApiUrl,
        token: "invalid-token",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
