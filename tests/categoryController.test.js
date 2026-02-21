// Gallen Ong, A0252614L
import {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} from "../controllers/categoryController.js";
import categoryModel from "../models/categoryModel.js";
import { makeRes } from "../helpers/utils.test.js";
import slugify from "slugify";

// Mocks
jest.mock("../models/categoryModel.js");
jest.mock("slugify", () => jest.fn());

// Create Category Tests
describe("createCategoryController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it("returns 401 if name is missing", async () => {
    // Arrange: Set up request with no name in body
    const req = { body: {} };
    const res = makeRes();

    // Act: Call createCategoryController
    await createCategoryController(req, res);

    // Assert: Verify 401 response and no database operations
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    expect(slugify).not.toHaveBeenCalled();
    expect(categoryModel.findOne).not.toHaveBeenCalled();
    expect(categoryModel.prototype.save).not.toHaveBeenCalled();
  });

  it("returns 200 if category already exists", async () => {
    // Arrange: Set up request and mock existing category
    const req = { body: { name: "Electronics" } };
    const res = makeRes();
    categoryModel.findOne.mockResolvedValueOnce({
      _id: "test",
      name: "Electronics",
    });

    // Act: Call createCategoryController
    await createCategoryController(req, res);

    // Assert: Verify category exists response and no save operation
    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Already Exists",
    });
    expect(categoryModel.prototype.save).not.toHaveBeenCalled();
  });

  it("returns 201 when new category is successfully created", async () => {
    // Arrange: Set up request and mock no existing category
    const req = { body: { name: "Electronics" } };
    const res = makeRes();
    categoryModel.findOne.mockResolvedValueOnce(null);
    slugify.mockReturnValueOnce("electronics");

    // Act: Call createCategoryController
    await createCategoryController(req, res);

    // Assert: Verify category was created successfully
    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
    expect(slugify).toHaveBeenCalledWith("Electronics");
    expect(categoryModel.prototype.save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "new category created",
      category: { name: "Electronics", slug: "electronics" },
    });
  });

  it("returns 500 when error is thrown", async () => {
    // Arrange: Set up request and mock database error
    const req = { body: { name: "Electronics" } };
    const res = makeRes();
    const err = new Error("DB failure");
    categoryModel.findOne.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act: Call createCategoryController
    await createCategoryController(req, res);

    // Assert: Verify error was logged and 500 response returned
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it("returns 200 when category is updated successfully", async () => {
    // Arrange: Set up request with category ID and new name
    const req = {
      body: { name: "Electronics" },
      params: { id: "testId" },
    };
    const res = makeRes();
    const updated = {
      id: "testId",
      name: "Electronics",
      slug: "electronics",
    };

    categoryModel.findByIdAndUpdate.mockResolvedValueOnce(updated);
    slugify.mockReturnValueOnce("electronics");

    // Act: Call updateCategoryController
    await updateCategoryController(req, res);

    // Assert: Verify category was updated successfully
    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "testId",
      { name: "Electronics", slug: "electronics" },
      { new: true }
    );
    expect(slugify).toHaveBeenCalledWith("Electronics");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Updated Successfully",
      category: updated,
    });
  });

  it("returns 500 when error is thrown", async () => {
    // Arrange: Set up request and mock database error
    const req = {
      body: { name: "Electronics" },
      params: { id: "testId" },
    };
    const res = makeRes();
    const err = new Error("DB failure");
    categoryModel.findByIdAndUpdate.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act: Call updateCategoryController
    await updateCategoryController(req, res);

    // Assert: Verify error was logged and 500 response returned
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 when all categories retrieved successfully", async () => {
    // Arrange: Set up response mock and mock database return
    let req;
    const res = makeRes();
    categoryModel.find.mockResolvedValueOnce({});

    // Act: Call categoryController
    await categoryController(req, res);

    // Assert: Verify all categories were retrieved successfully
    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Categories List",
      category: {},
    });
  });

  it("returns 500 when error is thrown", async () => {
    // Arrange: Set up response mock and mock database error
    let req;
    const res = makeRes();
    const err = new Error("DB failure");
    categoryModel.find.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act: Call categoryController
    await categoryController(req, res);

    // Assert: Verify error was logged and 500 response returned
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it("returns 200 when the specified category is retrieved successfully", async () => {
    // Arrange: Set up request with category slug and mock database return
    const req = { params: { slug: "book" } };
    const res = makeRes();
    categoryModel.findOne.mockResolvedValueOnce({ name: "Book", slug: "book" });

    // Act: Call singleCategoryController
    await singleCategoryController(req, res);

    // Assert: Verify specified category was retrieved successfully
    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "book" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Get Single Category SUccessfully",
      category: { name: "Book", slug: "book" },
    });
  });

  it("returns 500 when error is thrown", async () => {
    // Arrange: Set up request and mock database error
    const req = { params: { slug: "book" } };
    const res = makeRes();
    const err = new Error("DB failure");
    categoryModel.findOne.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act: Call singleCategoryController
    await singleCategoryController(req, res);

    // Assert: Verify error was logged and 500 response returned
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it("returns 200 when category successfully deleted", async () => {
    // Arrange: Set up request with category ID
    const req = { params: { id: "test" } };
    const res = makeRes();

    // Act: Call deleteCategoryController
    await deleteCategoryController(req, res);

    // Assert: Verify category was deleted successfully
    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("test");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Deleted Successfully",
    });
  });

  it("returns 500 when error is thrown", async () => {
    // Arrange: Set up request and mock database error
    const req = { params: { id: "test" } };
    const res = makeRes();
    const err = new Error("DB failure");
    categoryModel.findByIdAndDelete.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act: Call deleteCategoryController
    await deleteCategoryController(req, res);

    // Assert: Verify error was logged and 500 response returned
    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while deleting category",
      error: err,
    });
  });
});
