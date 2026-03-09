// Gallen Ong, A0252614L
import mongoose from "mongoose";
import orderModel from "../../models/orderModel.js";

describe("Order Model Unit Tests", () => {
  describe("Schema Validation", () => {
    it("should create a valid order with all fields", () => {
      const validOrder = new orderModel({
        products: [new mongoose.Types.ObjectId()],
        payment: { method: "card", transactionId: "123" },
        buyer: new mongoose.Types.ObjectId(),
        status: "Processing",
      });

      const error = validOrder.validateSync();
      expect(error).toBeUndefined();
    });

    it("should create a valid order with minimal fields", () => {
      const validOrder = new orderModel({
        products: [],
        payment: {},
      });

      const error = validOrder.validateSync();
      expect(error).toBeUndefined();
    });

    it("should allow empty products array", () => {
      const order = new orderModel({
        products: [],
        payment: {},
        buyer: new mongoose.Types.ObjectId(),
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.products).toHaveLength(0);
    });

    it("should allow multiple products", () => {
      const productIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
      ];

      const order = new orderModel({
        products: productIds,
        payment: {},
        buyer: new mongoose.Types.ObjectId(),
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.products).toHaveLength(3);
    });
  });

  describe("Schema Properties", () => {
    it("should set default status to 'Not Process'", () => {
      const order = new orderModel({
        products: [new mongoose.Types.ObjectId()],
        payment: {},
        buyer: new mongoose.Types.ObjectId(),
      });

      expect(order.status).toBe("Not Process");
    });

    it("should accept valid status values from enum", () => {
      const validStatuses = ["Not Process", "Processing", "Shipped", "deliverd", "cancel"];
      
      validStatuses.forEach((status) => {
        const order = new orderModel({
          products: [new mongoose.Types.ObjectId()],
          payment: {},
          buyer: new mongoose.Types.ObjectId(),
          status: status,
        });

        const error = order.validateSync();
        expect(error).toBeUndefined();
        expect(order.status).toBe(status);
      });
    });

    it("should reject invalid status values", () => {
      const order = new orderModel({
        products: [new mongoose.Types.ObjectId()],
        payment: {},
        buyer: new mongoose.Types.ObjectId(),
        status: "Invalid Status",
      });

      const error = order.validateSync();
      expect(error.errors.status).toBeDefined();
      expect(error.errors.status.kind).toBe("enum");
    });

    it("should accept payment as an object", () => {
      const paymentData = {
        method: "credit_card",
        transactionId: "txn_123456",
        amount: 150.00,
        currency: "USD",
      };

      const order = new orderModel({
        products: [new mongoose.Types.ObjectId()],
        payment: paymentData,
        buyer: new mongoose.Types.ObjectId(),
      });

      expect(order.payment).toEqual(paymentData);
    });

    it("should accept buyer as ObjectId reference", () => {
      const buyerId = new mongoose.Types.ObjectId();
      const order = new orderModel({
        products: [new mongoose.Types.ObjectId()],
        payment: {},
        buyer: buyerId,
      });

      expect(order.buyer).toEqual(buyerId);
    });
  });

  describe("Schema Structure", () => {
    it("should have all required fields in the schema", () => {
      const schemaFields = Object.keys(orderModel.schema.paths);
      
      expect(schemaFields).toContain("products");
      expect(schemaFields).toContain("payment");
      expect(schemaFields).toContain("buyer");
      expect(schemaFields).toContain("status");
    });

    it("should have timestamps enabled", () => {
      const schemaOptions = orderModel.schema.options;
      expect(schemaOptions.timestamps).toBe(true);
      
      const schemaFields = Object.keys(orderModel.schema.paths);
      expect(schemaFields).toContain("createdAt");
      expect(schemaFields).toContain("updatedAt");
    });

    it("should use 'orders' as the collection name", () => {
      expect(orderModel.collection.name).toBe("orders");
    });
  });

  describe("Field Types", () => {
    it("should have correct field types", () => {
      const schema = orderModel.schema.paths;

      expect(schema.products.instance).toBe("Array");
      expect(schema.status.instance).toBe("String");
    });

    it("should have ObjectId type for buyer with reference", () => {
      const buyerPath = orderModel.schema.paths.buyer;
      expect(buyerPath.instance).toBe("ObjectId");
      expect(buyerPath.options.ref).toBe("users");
    });

    it("should have products array referencing Products model", () => {
      const productsPath = orderModel.schema.paths.products;
      expect(productsPath.instance).toBe("Array");
      expect(productsPath.caster.instance).toBe("ObjectId");
      expect(productsPath.caster.options.ref).toBe("Products");
    });

    it("should have status enum with all valid values", () => {
      const statusPath = orderModel.schema.paths.status;
      const enumValues = statusPath.enumValues;
      
      expect(enumValues).toContain("Not Process");
      expect(enumValues).toContain("Processing");
      expect(enumValues).toContain("Shipped");
      expect(enumValues).toContain("deliverd");
      expect(enumValues).toContain("cancel");
      expect(enumValues).toHaveLength(5);
    });
  });
});
