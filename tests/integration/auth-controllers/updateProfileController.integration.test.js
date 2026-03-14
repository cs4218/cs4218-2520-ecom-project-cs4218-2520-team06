// Jabez Tho, A0273312N
import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import authRoutes from "../../../routes/authRoute.js";
import userModel from "../../../models/userModel.js";
import { hashPassword } from "../../../helpers/authHelper.js";

dotenv.config();

jest.setTimeout(10000);

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);

const updateProfileApiUrl = "/api/v1/auth/profile";

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

describe("updateProfileController Integration Tests", () => {
  let user;
  let userToken;

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

    user = await userModel.create({
      name: "Original User",
      email: "profile@test.com",
      password: await hashPassword("oldpassword123"),
      phone: "1111111111",
      address: "Old Address",
      answer: "blue",
      role: 0,
    });

    userToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  });

  describe("on successful profile update", () => {
    it("should persist the updated profile fields in the database", async () => {
      // Arrange
      const updateData = {
        name: "Updated User",
        phone: "9999999999",
        address: "New Address",
      };

      // Act
      const response = await sendJson({
        method: "PUT",
        path: updateProfileApiUrl,
        token: userToken,
        body: updateData,
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Profile Updated SUccessfully");

      const persistedUser = await userModel.findById(user._id);
      expect(persistedUser.name).toBe(updateData.name);
      expect(persistedUser.phone).toBe(updateData.phone);
      expect(persistedUser.address).toBe(updateData.address);
      expect(persistedUser.email).toBe("profile@test.com");
    });

    it("should return the updated user payload for frontend state refresh", async () => {
      // Arrange
      const updateData = {
        name: "Refreshed User",
        phone: "2222222222",
        address: "Refreshed Address",
      };

      // Act
      const response = await sendJson({
        method: "PUT",
        path: updateProfileApiUrl,
        token: userToken,
        body: updateData,
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.updatedUser).toEqual(
        expect.objectContaining({
          _id: user._id.toString(),
          name: updateData.name,
          phone: updateData.phone,
          address: updateData.address,
          email: "profile@test.com",
        })
      );
    });

    it("should hash and persist a newly submitted password", async () => {
      // Arrange
      const newPassword = "newpassword123";

      // Act
      const response = await sendJson({
        method: "PUT",
        path: updateProfileApiUrl,
        token: userToken,
        body: {
          password: newPassword,
        },
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const persistedUser = await userModel.findById(user._id);
      expect(persistedUser.password).not.toBe(user.password);
      await expect(
        bcrypt.compare(newPassword, persistedUser.password)
      ).resolves.toBe(true);
    });
  });

  describe("validation and auth handling", () => {
    it("should reject passwords shorter than 6 characters", async () => {
      // Arrange
      const shortPassword = "12345";

      // Act
      const response = await sendJson({
        method: "PUT",
        path: updateProfileApiUrl,
        token: userToken,
        body: {
          password: shortPassword,
        },
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        error: "Passsword is required and 6 character long",
      });

      const persistedUser = await userModel.findById(user._id);
      await expect(
        bcrypt.compare("oldpassword123", persistedUser.password)
      ).resolves.toBe(true);
    });

    it("should fail when no token is provided", async () => {
      // Arrange
      const updateData = {
        name: "Should Not Update",
      };

      // Act
      const response = await sendJson({
        method: "PUT",
        path: updateProfileApiUrl,
        body: updateData,
      });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      const persistedUser = await userModel.findById(user._id);
      expect(persistedUser.name).toBe("Original User");
    });
  });
});
