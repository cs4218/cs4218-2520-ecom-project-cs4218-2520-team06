// Gallen Ong, A0252614L
import mongoose from "mongoose";
import userModel from "../../models/userModel.js";

describe("User Model Unit Tests", () => {
  describe("Schema Validation", () => {
    it("should create a valid user with all required fields", () => {
      const validUser = new userModel({
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        phone: "1234567890",
        address: { street: "123 Main St", city: "New York" },
        answer: "My pet name",
      });

      const error = validUser.validateSync();
      expect(error).toBeUndefined();
    });

    it("should fail validation when name is missing", () => {
      const user = new userModel({
        email: "john@example.com",
        password: "hashedPassword123",
        phone: "1234567890",
        address: { street: "123 Main St" },
        answer: "My pet name",
      });

      const error = user.validateSync();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.name.kind).toBe("required");
    });

    it("should fail validation when email is missing", () => {
      const user = new userModel({
        name: "John Doe",
        password: "hashedPassword123",
        phone: "1234567890",
        address: { street: "123 Main St" },
        answer: "My pet name",
      });

      const error = user.validateSync();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.email.kind).toBe("required");
    });

    it("should fail validation when password is missing", () => {
      const user = new userModel({
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        address: { street: "123 Main St" },
        answer: "My pet name",
      });

      const error = user.validateSync();
      expect(error.errors.password).toBeDefined();
      expect(error.errors.password.kind).toBe("required");
    });

    it("should fail validation when phone is missing", () => {
      const user = new userModel({
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        address: { street: "123 Main St" },
        answer: "My pet name",
      });

      const error = user.validateSync();
      expect(error.errors.phone).toBeDefined();
      expect(error.errors.phone.kind).toBe("required");
    });

    it("should fail validation when address is missing", () => {
      const user = new userModel({
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        phone: "1234567890",
        answer: "My pet name",
      });

      const error = user.validateSync();
      expect(error.errors.address).toBeDefined();
      expect(error.errors.address.kind).toBe("required");
    });

    it("should fail validation when answer is missing", () => {
      const user = new userModel({
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        phone: "1234567890",
        address: { street: "123 Main St" },
      });

      const error = user.validateSync();
      expect(error.errors.answer).toBeDefined();
      expect(error.errors.answer.kind).toBe("required");
    });
  });

  describe("Schema Properties", () => {
    it("should trim whitespace from name field", () => {
      const user = new userModel({
        name: "  John Doe  ",
        email: "john@example.com",
        password: "hashedPassword123",
        phone: "1234567890",
        address: { street: "123 Main St" },
        answer: "My pet name",
      });

      expect(user.name).toBe("John Doe");
    });

    it("should set default role to 0 when not provided", () => {
      const user = new userModel({
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        phone: "1234567890",
        address: { street: "123 Main St" },
        answer: "My pet name",
      });

      expect(user.role).toBe(0);
    });

    it("should allow custom role value", () => {
      const user = new userModel({
        name: "Admin User",
        email: "admin@example.com",
        password: "hashedPassword123",
        phone: "1234567890",
        address: { street: "123 Main St" },
        answer: "My pet name",
        role: 1,
      });

      expect(user.role).toBe(1);
    });

    it("should accept address as an object", () => {
      const addressData = {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
      };

      const user = new userModel({
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        phone: "1234567890",
        address: addressData,
        answer: "My pet name",
      });

      expect(user.address).toEqual(addressData);
    });
  });

  describe("Schema Structure", () => {
    it("should have all required fields in the schema", () => {
      const schemaFields = Object.keys(userModel.schema.paths);
      
      expect(schemaFields).toContain("name");
      expect(schemaFields).toContain("email");
      expect(schemaFields).toContain("password");
      expect(schemaFields).toContain("phone");
      expect(schemaFields).toContain("address");
      expect(schemaFields).toContain("answer");
      expect(schemaFields).toContain("role");
    });

    it("should have timestamps enabled", () => {
      const schemaOptions = userModel.schema.options;
      expect(schemaOptions.timestamps).toBe(true);
      
      const schemaFields = Object.keys(userModel.schema.paths);
      expect(schemaFields).toContain("createdAt");
      expect(schemaFields).toContain("updatedAt");
    });

    it("should use 'users' as the collection name", () => {
      expect(userModel.collection.name).toBe("users");
    });
  });

  describe("Field Types", () => {
    it("should have correct field types", () => {
      const schema = userModel.schema.paths;

      expect(schema.name.instance).toBe("String");
      expect(schema.email.instance).toBe("String");
      expect(schema.password.instance).toBe("String");
      expect(schema.phone.instance).toBe("String");
      expect(schema.answer.instance).toBe("String");
      expect(schema.role.instance).toBe("Number");
    });

    it("should have unique constraint on email field", () => {
      const emailPath = userModel.schema.paths.email;
      expect(emailPath.options.unique).toBe(true);
    });
  });
});
