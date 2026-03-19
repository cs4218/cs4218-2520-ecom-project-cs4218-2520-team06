// Jabez Tho, A0273312N
import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import authRoutes from "../../../routes/authRoute.js";
import userModel from "../../../models/userModel.js";
import { hashPassword } from "../../../helpers/authHelper.js";

dotenv.config();

jest.setTimeout(10000);

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);

const allUsersApiUrl = "/api/v1/auth/all-users";

let mongoServer;
let server;
let baseUrl;

const sendJson = async ({ method, path, token }) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  });

  return {
    status: response.status,
    body: await response.json(),
  };
};

describe("getAllUsersController Integration Tests", () => {
  let adminUser;
  let regularUser;
  let anotherRegularUser;
  let adminToken;
  let regularUserToken;

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

    anotherRegularUser = await userModel.create({
      name: "Another User",
      email: "other@test.com",
      password: await hashPassword("password123"),
      phone: "3333333333",
      address: "456 Avenue",
      answer: "red",
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
  });

  describe("on successful user retrieval", () => {
    it("should return all users to an authenticated admin", async () => {
      const response = await sendJson({
        method: "GET",
        path: allUsersApiUrl,
        token: adminToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(3);

      const returnedEmails = response.body.users.map((user) => user.email);
      expect(returnedEmails).toEqual(
        expect.arrayContaining([
          adminUser.email,
          regularUser.email,
          anotherRegularUser.email,
        ])
      );
    });

    it("should return only selected fields and omit sensitive data", async () => {
      const response = await sendJson({
        method: "GET",
        path: allUsersApiUrl,
        token: adminToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(3);

      response.body.users.forEach((user) => {
        expect(user).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String),
            phone: expect.any(String),
            address: expect.any(String),
            role: expect.any(Number),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })
        );
        expect(user.password).toBeUndefined();
        expect(user.answer).toBeUndefined();
      });
    });

    it("should return only admin user when no other users exist", async () => {
      await userModel.deleteMany({ _id: { $ne: adminUser._id } });

      const response = await sendJson({
        method: "GET",
        path: allUsersApiUrl,
        token: adminToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].email).toBe(adminUser.email);
    });
  });

  describe("authentication and authorization", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await sendJson({
        method: "GET",
        path: allUsersApiUrl,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 when token is invalid", async () => {
      const response = await sendJson({
        method: "GET",
        path: allUsersApiUrl,
        token: "invalid-token",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 when authenticated user is not an admin", async () => {
      const response = await sendJson({
        method: "GET",
        path: allUsersApiUrl,
        token: regularUserToken,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");
    });
  });
});
