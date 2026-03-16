// Jabez Tho, A0273312N
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

describe("orderStatusController Integration Tests", () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let regularUserToken;
  let category;
  let product;
  let testOrder;

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

    adminUser = await userModel.create({
      name: "Admin User",
      email: "admin@test.com",
      password: await hashPassword("admin123"),
      phone: "1111111111",
      address: "Admin Street",
      answer: "admin",
      role: 1,
    });

    regularUser = await userModel.create({
      name: "Regular User",
      email: "user@test.com",
      password: await hashPassword("password123"),
      phone: "2222222222",
      address: "123 Street",
      answer: "blue",
      role: 0,
    });

    adminToken = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
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

    product = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "A powerful laptop",
      price: 999.99,
      category: category._id,
      quantity: 10,
      shipping: true,
    });

    testOrder = await orderModel.create({
      products: [product._id],
      buyer: regularUser._id,
      payment: { success: true },
      status: "Not Process",
    });
  });

  describe("on successful status update", () => {
    it("should update the order status and return the updated order", async () => {
      const response = await sendJson({
        method: "PUT",
        path: `/api/v1/auth/order-status/${testOrder._id}`,
        token: adminToken,
        body: { status: "Processing" },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("Processing");
      expect(response.body._id.toString()).toBe(testOrder._id.toString());
    });

    it("should persist the status change in the database", async () => {
      await sendJson({
        method: "PUT",
        path: `/api/v1/auth/order-status/${testOrder._id}`,
        token: adminToken,
        body: { status: "Shipped" },
      });

      const updatedOrder = await orderModel.findById(testOrder._id);
      expect(updatedOrder.status).toBe("Shipped");
    });

    it("should update status to Delivered", async () => {
      const response = await sendJson({
        method: "PUT",
        path: `/api/v1/auth/order-status/${testOrder._id}`,
        token: adminToken,
        body: { status: "deliverd" },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("deliverd");

      const persistedOrder = await orderModel.findById(testOrder._id);
      expect(persistedOrder.status).toBe("deliverd");
    });

    it("should update status to cancel", async () => {
      const response = await sendJson({
        method: "PUT",
        path: `/api/v1/auth/order-status/${testOrder._id}`,
        token: adminToken,
        body: { status: "cancel" },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("cancel");

      const persistedOrder = await orderModel.findById(testOrder._id);
      expect(persistedOrder.status).toBe("cancel");
    });

    it("should allow multiple sequential status updates", async () => {
      await sendJson({
        method: "PUT",
        path: `/api/v1/auth/order-status/${testOrder._id}`,
        token: adminToken,
        body: { status: "Processing" },
      });

      await sendJson({
        method: "PUT",
        path: `/api/v1/auth/order-status/${testOrder._id}`,
        token: adminToken,
        body: { status: "Shipped" },
      });

      const response = await sendJson({
        method: "PUT",
        path: `/api/v1/auth/order-status/${testOrder._id}`,
        token: adminToken,
        body: { status: "deliverd" },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("deliverd");

      const finalOrder = await orderModel.findById(testOrder._id);
      expect(finalOrder.status).toBe("deliverd");
    });
  });

  describe("authentication and authorization", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await sendJson({
        method: "PUT",
        path: `/api/v1/auth/order-status/${testOrder._id}`,
        body: { status: "Shipped" },
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 when invalid token is provided", async () => {
      const response = await sendJson({
        method: "PUT",
        path: `/api/v1/auth/order-status/${testOrder._id}`,
        token: "invalid-token",
        body: { status: "Shipped" },
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 when non-admin user tries to update status", async () => {
      const response = await sendJson({
        method: "PUT",
        path: `/api/v1/auth/order-status/${testOrder._id}`,
        token: regularUserToken,
        body: { status: "Shipped" },
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");

      const unchangedOrder = await orderModel.findById(testOrder._id);
      expect(unchangedOrder.status).toBe("Not Process");
    });
  });
});
