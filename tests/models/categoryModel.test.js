// Gallen Ong, A0252614L
import mongoose from "mongoose";
import categoryModel from "../../models/categoryModel.js";

describe("Category Model Unit Tests", () => {
  describe("Schema Validation", () => {
    it("should create a valid category with name and slug", () => {
      const validCategory = new categoryModel({
        name: "Electronics",
        slug: "electronics",
      });

      const error = validCategory.validateSync();
      expect(error).toBeUndefined();
    });

    it("should create a valid category with only name", () => {
      const category = new categoryModel({
        name: "Electronics",
      });

      const error = category.validateSync();
      expect(error).toBeUndefined();
    });

    it("should create a valid category with only slug", () => {
      const category = new categoryModel({
        slug: "electronics",
      });

      const error = category.validateSync();
      expect(error).toBeUndefined();
    });

    it("should create a valid category with empty fields", () => {
      const category = new categoryModel({});

      const error = category.validateSync();
      expect(error).toBeUndefined();
    });
  });

  describe("Schema Properties", () => {
    it("should convert slug to lowercase", () => {
      const category = new categoryModel({
        name: "Electronics",
        slug: "ELECTRONICS",
      });

      expect(category.slug).toBe("electronics");
    });

    it("should handle mixed case slug", () => {
      const category = new categoryModel({
        name: "Home & Garden",
        slug: "Home-Garden",
      });

      expect(category.slug).toBe("home-garden");
    });

    it("should store name without modification", () => {
      const category = new categoryModel({
        name: "Electronics & Gadgets",
        slug: "electronics-gadgets",
      });

      expect(category.name).toBe("Electronics & Gadgets");
    });
  });

  describe("Schema Structure", () => {
    it("should have all fields in the schema", () => {
      const schemaFields = Object.keys(categoryModel.schema.paths);
      
      expect(schemaFields).toContain("name");
      expect(schemaFields).toContain("slug");
    });

    it("should use 'categories' as the collection name", () => {
      expect(categoryModel.collection.name).toBe("categories");
    });
  });

  describe("Field Types", () => {
    it("should have correct field types", () => {
      const schema = categoryModel.schema.paths;

      expect(schema.name.instance).toBe("String");
      expect(schema.slug.instance).toBe("String");
    });

    it("should have lowercase option enabled for slug", () => {
      const slugPath = categoryModel.schema.paths.slug;
      expect(slugPath.options.lowercase).toBe(true);
    });
  });
});
