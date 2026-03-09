// Gallen Ong, A0252614L
import mongoose from "mongoose";
import productModel from "../../models/productModel.js";

describe("Product Model Unit Tests", () => {
  describe("Schema Validation", () => {
    it("should create a valid product with all required fields", () => {
      const validProduct = new productModel({
        name: "Test Product",
        slug: "test-product",
        description: "A test product description",
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
      });

      const error = validProduct.validateSync();
      expect(error).toBeUndefined();
    });

    it("should fail validation when name is missing", () => {
      const product = new productModel({
        slug: "test-product",
        description: "A test product description",
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
      });

      const error = product.validateSync();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.name.kind).toBe("required");
    });

    it("should fail validation when slug is missing", () => {
      const product = new productModel({
        name: "Test Product",
        description: "A test product description",
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
      });

      const error = product.validateSync();
      expect(error.errors.slug).toBeDefined();
      expect(error.errors.slug.kind).toBe("required");
    });

    it("should fail validation when description is missing", () => {
      const product = new productModel({
        name: "Test Product",
        slug: "test-product",
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
      });

      const error = product.validateSync();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.description.kind).toBe("required");
    });

    it("should fail validation when price is missing", () => {
      const product = new productModel({
        name: "Test Product",
        slug: "test-product",
        description: "A test product description",
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
      });

      const error = product.validateSync();
      expect(error.errors.price).toBeDefined();
      expect(error.errors.price.kind).toBe("required");
    });

    it("should fail validation when category is missing", () => {
      const product = new productModel({
        name: "Test Product",
        slug: "test-product",
        description: "A test product description",
        price: 99.99,
        quantity: 10,
      });

      const error = product.validateSync();
      expect(error.errors.category).toBeDefined();
      expect(error.errors.category.kind).toBe("required");
    });

    it("should fail validation when quantity is missing", () => {
      const product = new productModel({
        name: "Test Product",
        slug: "test-product",
        description: "A test product description",
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
      });

      const error = product.validateSync();
      expect(error.errors.quantity).toBeDefined();
      expect(error.errors.quantity.kind).toBe("required");
    });
  });

  describe("Schema Properties", () => {
    it("should allow optional photo field", () => {
      const product = new productModel({
        name: "Test Product",
        slug: "test-product",
        description: "A test product description",
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
        photo: {
          data: Buffer.from("test"),
          contentType: "image/jpeg",
        },
      });

      const error = product.validateSync();
      expect(error).toBeUndefined();
      expect(product.photo).toBeDefined();
    });

    it("should allow optional shipping field", () => {
      const product = new productModel({
        name: "Test Product",
        slug: "test-product",
        description: "A test product description",
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
        shipping: true,
      });

      const error = product.validateSync();
      expect(error).toBeUndefined();
      expect(product.shipping).toBe(true);
    });

    it("should accept category as ObjectId reference", () => {
      const categoryId = new mongoose.Types.ObjectId();
      const product = new productModel({
        name: "Test Product",
        slug: "test-product",
        description: "A test product description",
        price: 99.99,
        category: categoryId,
        quantity: 10,
      });

      expect(product.category).toEqual(categoryId);
    });
  });

  describe("Schema Structure", () => {
    it("should have all required fields in the schema", () => {
      const schemaFields = Object.keys(productModel.schema.paths);
      
      expect(schemaFields).toContain("name");
      expect(schemaFields).toContain("slug");
      expect(schemaFields).toContain("description");
      expect(schemaFields).toContain("price");
      expect(schemaFields).toContain("category");
      expect(schemaFields).toContain("quantity");
      expect(schemaFields).toContain("shipping");
    });

    it("should have timestamps enabled", () => {
      const schemaOptions = productModel.schema.options;
      expect(schemaOptions.timestamps).toBe(true);
      
      const schemaFields = Object.keys(productModel.schema.paths);
      expect(schemaFields).toContain("createdAt");
      expect(schemaFields).toContain("updatedAt");
    });

    it("should use 'Products' as the collection name", () => {
      expect(productModel.collection.name).toBe("products");
    });
  });

  describe("Field Types", () => {
    it("should have correct field types", () => {
      const schema = productModel.schema.paths;

      expect(schema.name.instance).toBe("String");
      expect(schema.slug.instance).toBe("String");
      expect(schema.description.instance).toBe("String");
      expect(schema.price.instance).toBe("Number");
      expect(schema.quantity.instance).toBe("Number");
      expect(schema.shipping.instance).toBe("Boolean");
    });

    it("should have ObjectId type for category with reference", () => {
      const categoryPath = productModel.schema.paths.category;
      expect(categoryPath.instance).toBe("ObjectId");
      expect(categoryPath.options.ref).toBe("Category");
    });

    it("should have nested photo schema with Buffer data", () => {
      const schemaFields = Object.keys(productModel.schema.paths);
      expect(schemaFields).toContain("photo.data");
      expect(schemaFields).toContain("photo.contentType");
    });
  });
});
