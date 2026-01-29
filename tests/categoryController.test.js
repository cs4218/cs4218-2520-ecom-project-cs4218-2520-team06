import {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} from '../controllers/categoryController.js';
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

// Mocks
jest.mock("../models/categoryModel.js");
jest.mock("slugify", () => jest.fn());

// Helpers
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// Create Category Tests
describe("createCategoryController", () => {
  test("returns 401 if name is missing", async () => {
    const req = { body: {} };
    const res = makeRes();
    
    await createCategoryController(req, res);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is required" } );
    expect(categoryModel.findOne).not.toHaveBeenCalled();
    expect(categoryModel.prototype.save).not.toHaveBeenCalled();
  });
  
  test("returns 200 if category already exists", async () => {
    const req = { body: { name: "Electronics" } };
    const res = makeRes();
    categoryModel.findOne.mockResolvedValueOnce({ _id: "test", name: "Electronics" });
    
    await createCategoryController(req, res);
    
    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Already Exists",
    });
    expect(categoryModel.prototype.save).not.toHaveBeenCalled();
  });
  
  test("returns 201 when new category is successfully created", async () => {
    const req = { body: { name: "Electronics" } };
    const res = makeRes();
    categoryModel.findOne.mockResolvedValueOnce(null);
    slugify.mockReturnValueOnce("electronics");
    
    await createCategoryController(req, res);
    
    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
    expect(slugify).toHaveBeenCalledWith("Electronics");
    expect(categoryModel.prototype.save).toHaveBeenCalledTimes(1);
    
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "new category created",
      category: { name: "Electronics", slug: "electronics", }
    });
  });
  
  test("returns 500 when error is thrown", async () => {
    const req = { body: { name: "Electronics" } };
    const res = makeRes();
    const err = new Error("DB failure");
    categoryModel.findOne.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    
    await createCategoryController(req, res);
    
    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in Category",
      error: err,
    });
  });
});

// Update Category Tests
describe("updateCategoryController", () => {
  test("returns 200 when category is updated successfully", async () => {
    const req = {
      body: { name: "Electronics" },
      params: {id:  "testId" }
    };
    const res = makeRes();
    const updated = {
      id: "testId",
      name: "Electronics",
      slug: "electronics",
    }
    
    categoryModel.findByIdAndUpdate.mockResolvedValueOnce(updated);
    slugify.mockReturnValueOnce("electronics");
    
    await updateCategoryController(req, res);
    
    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "testId",
      { name: "Electronics", slug: "electronics", },
      { new: true },
    )
    expect(slugify).toHaveBeenCalledWith("Electronics");
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Updated Successfully",
      category: updated,
    });
  });
  
  test("returns 500 when error is thrown", async () => {
    const req = {
      body: { name: "Electronics" },
      params: {id:  "testId" }
    };
    const res = makeRes();
    const err = new Error("DB failure");
    categoryModel.findByIdAndUpdate.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    
    await updateCategoryController(req, res);
    
    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while updating category",
      error: err,
    });
  });
});

// Get All Categories Tests
describe("categoryController", () => {
  test("returns 200 when all categories retrieved successfully", async () => {
    let req;
    const res = makeRes();
    categoryModel.find.mockResolvedValueOnce({});
    
    await categoryController(req, res);
    
    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Categories List",
      category: {},
    });
  });
  
  test("returns 500 when error is thrown", async () => {
    let req;
    const res = makeRes();
    const err = new Error("DB failure");
    categoryModel.find.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    
    await categoryController(req, res);
    
    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting all categories",
      error: err,
    });
  });
});

// Single Category Test
describe("singleCategoryController", () => {
  test("returns 200 when the specified category is retrieved successfully", async () => {
    const req = { params: { slug: "book" } };
    const res = makeRes()
    categoryModel.findOne.mockReturnValueOnce({ name: "Book", slug: "book", })
    
    await singleCategoryController(req, res);
    
    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "book" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Get Single Category SUccessfully",
      category: { name: "Book", slug: "book", },
    });
  });
  
  test("returns 500 when error is thrown", async () => {
    const req = { params: { slug: "book" } };
    const res = makeRes();
    const err = new Error("DB failure");
    categoryModel.findOne.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    
    await singleCategoryController(req, res);
    
    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting Single Category",
      error: err,
    });
  });
});

// Delete Category Test
describe("deleteCategoryController", () => {
  test("returns 200 when category successfully deleted", async () => {
    const req = { params: { id: "test" } };
    const res = makeRes();
    
    await deleteCategoryController(req, res);
    
    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("test");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Deleted Successfully",
    });
  })
  
  test("returns 500 when error is thrown", async () => {
    const req = { params: { id: "test" } };
    const res = makeRes();
    const err = new Error("DB failure");
    categoryModel.findByIdAndDelete.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    
    await deleteCategoryController(req, res);
    
    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while deleting category",
      error: err,
    });
  })
});
