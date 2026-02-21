import {
  createProductController,
  updateProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
  braintreeTokenController,
} from "../controllers/productController.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import slugify from "slugify";
import fs from "fs";
import braintree, { BraintreeGateway, Environment } from "braintree";
import { makeRes } from "../helpers/utils.test.js";

// Mocks
jest.mock("../models/categoryModel.js");
jest.mock("../models/productModel.js");
jest.mock("slugify", () => jest.fn());
jest.mock("fs", () => ({ readFileSync: jest.fn() }));
jest.mock("braintree", () => ({
  __esModule: true,
  default: {
    BraintreeGateway: function () {
      return {};
    },
    Environment: { Sandbox: {} },
  },
}));

// Gallen Ong, A0252614L
// Create Product Tests
describe("createProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  const testProduct = Object.freeze({
    name: "Phone",
    description: "test phone",
    price: 500,
    category: {
      name: "Electronics",
      slug: "electronics",
    },
    quantity: 10,
  });

  it("returns error when name is missing", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    delete req.fields.name;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Name is Required",
    });
  });

  it("returns error when description is missing", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    delete req.fields.description;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Description is Required",
    });
  });

  it("returns error when price is missing", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    delete req.fields.price;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Price is Required",
    });
  });

  it("returns error when category is missing", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    delete req.fields.category;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Category is Required",
    });
  });

  it("returns error when quantity is missing", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    delete req.fields.quantity;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Quantity is Required",
    });
  });

  it("returns error when photo is given but size is too big", async () => {
    const req = {
      fields: { ...testProduct },
      files: { photo: { size: 99999999 } },
    };
    const res = makeRes();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
  });

  it("returns 201 when product is created successfully", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    slugify.mockReturnValueOnce("phone");

    await createProductController(req, res);

    expect(slugify).toHaveBeenCalledWith(testProduct.name);
    expect(productModel.prototype.save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Created Successfully",
      products: {
        ...testProduct,
        photo: {},
        slug: "phone",
      },
    });
  });

  it("updates product photo info when valid photo is given", async () => {
    const req = {
      fields: { ...testProduct },
      files: {
        photo: {
          type: "testType",
          path: "testPath",
          link: "testLink",
          size: 100,
        },
      },
    };
    const res = makeRes();
    slugify.mockReturnValueOnce("phone");
    fs.readFileSync.mockReturnValueOnce(Buffer.from("fake-bytes"));

    await createProductController(req, res);

    const instance = productModel.mock.instances[0];
    expect(fs.readFileSync).toHaveBeenCalledWith("testPath");
    expect(instance.photo.data).toEqual(Buffer.from("fake-bytes"));
    expect(instance.photo.contentType).toBe("testType");
    expect(productModel.prototype.save).toHaveBeenCalledTimes(1);
  });

  it("does not update product photo info when no photo is given", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    slugify.mockReturnValueOnce("phone");

    await createProductController(req, res);

    const instance = productModel.mock.instances[0];
    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(instance.photo.data).toBeUndefined();
    expect(instance.photo.contentType).toBeUndefined();
    expect(productModel.prototype.save).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when error is thrown", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    const err = new Error("DB failure");
    productModel.prototype.save.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await createProductController(req, res);

    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in creating product",
      error: err,
    });
  });
});

// Gallen Ong, A0252614L
// Update Product Test
describe("updateProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  const testProduct = Object.freeze({
    name: "Phone",
    description: "test phone",
    price: 500,
    category: {
      name: "Electronics",
      slug: "electronics",
    },
    quantity: 10,
  });

  it("returns error when name is missing", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    delete req.fields.name;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Name is Required",
    });
  });

  it("returns error when description is missing", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    delete req.fields.description;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Description is Required",
    });
  });

  it("returns error when price is missing", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    delete req.fields.price;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Price is Required",
    });
  });

  it("returns error when category is missing", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    delete req.fields.category;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Category is Required",
    });
  });

  it("returns error when quantity is missing", async () => {
    const req = { fields: { ...testProduct }, files: {} };
    const res = makeRes();
    delete req.fields.quantity;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Quantity is Required",
    });
  });

  it("returns error when photo is given but size is too big", async () => {
    const req = {
      fields: { ...testProduct },
      files: { photo: { size: 99999999 } },
    };
    const res = makeRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
  });

  it("returns 201 when product is updated successfully", async () => {
    const req = {
      params: { pid: "testPid" },
      fields: { ...testProduct },
      files: {},
    };
    const res = makeRes();
    const updated = {
      ...testProduct,
      slug: "phone",
      save: jest.fn().mockResolvedValue(true),
    };
    slugify.mockReturnValueOnce("phone");
    productModel.findByIdAndUpdate.mockResolvedValueOnce(updated);

    await updateProductController(req, res);

    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "testPid",
      { ...testProduct, slug: "phone" },
      { new: true }
    );
    expect(slugify).toHaveBeenCalledWith(testProduct.name);
    expect(updated.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Updated Successfully",
      products: {
        ...updated,
        slug: "phone",
      },
    });
  });

  it("updates product photo info when valid photo is given", async () => {
    const req = {
      params: { pid: "testPid" },
      fields: { ...testProduct },
      files: {
        photo: {
          type: "testType",
          path: "testPath",
          link: "testLink",
          size: 100,
        },
      },
    };
    const res = makeRes();
    const updated = {
      ...testProduct,
      photo: {},
      slug: "phone",
      save: jest.fn().mockResolvedValue(true),
    };

    productModel.findByIdAndUpdate.mockResolvedValueOnce(updated);
    slugify.mockReturnValueOnce("phone");
    fs.readFileSync.mockReturnValueOnce(Buffer.from("fake-bytes"));

    await updateProductController(req, res);

    expect(fs.readFileSync).toHaveBeenCalledWith("testPath");
    expect(updated.photo.data).toEqual(Buffer.from("fake-bytes"));
    expect(updated.photo.contentType).toBe("testType");
    expect(updated.save).toHaveBeenCalledTimes(1);
  });

  it("does not update product photo info when no photo is given", async () => {
    const req = {
      params: { pid: "testPid" },
      fields: { ...testProduct },
      files: {},
    };
    const res = makeRes();
    const updated = {
      ...testProduct,
      photo: {},
      slug: "phone",
      save: jest.fn().mockResolvedValue(true),
    };

    productModel.findByIdAndUpdate.mockResolvedValueOnce(updated);
    slugify.mockReturnValueOnce("phone");

    await updateProductController(req, res);

    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(updated.photo.data).toBeUndefined();
    expect(updated.photo.contentType).toBeUndefined();
    expect(updated.save).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when error is thrown", async () => {
    const req = {
      params: { pid: "testPid" },
      fields: { ...testProduct },
      files: {},
    };
    const res = makeRes();
    const err = new Error("DB failure");
    productModel.findByIdAndUpdate.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await updateProductController(req, res);

    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in Update product",
      error: err,
    });
  });
});

// Gallen Ong, A0252614L
// Delete Product Test
describe("deleteProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it("returns 200 when product is successfully deleted", async () => {
    const req = { params: { pid: "testPid" } };
    const res = makeRes();
    const selectMock = jest.fn().mockResolvedValueOnce({ _id: "testPid" });
    productModel.findByIdAndDelete.mockReturnValueOnce({ select: selectMock });

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("testPid");
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Deleted successfully",
    });
  });

  it("returns 500 when error is thrown", async () => {
    const req = { params: { pid: "testPid" } };
    const res = makeRes();
    const err = new Error("DB failure");
    const selectMock = jest.fn().mockRejectedValueOnce(err);
    productModel.findByIdAndDelete.mockReturnValueOnce({ select: selectMock });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await deleteProductController(req, res);

    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while deleting product",
      error: err,
    });
  });
});

// Get Product Test
describe("getProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 when all products are fetched", async () => {
    // Arrange
    const res = makeRes();

    const dummyProducts = [
      {
        _id: "1",
        name: "Product A",
        price: 100,
        category: { _id: "c1", name: "Cat" },
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        name: "Product B",
        price: 200,
        category: { _id: "c2", name: "Cat2" },
        quantity: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    productModel.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValueOnce(dummyProducts),
    });

    // Act
    await getProductController(null, res);

    // Assert
    expect(productModel.find).toHaveBeenCalledTimes(1);
    expect(productModel.find).toHaveBeenCalledWith({});

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      countTotal: dummyProducts.length,
      message: "All Products Fetched",
      products: dummyProducts
    });
  });

  it("returns 500 when error is thrown", async () => {
    // Arrange
    const res = makeRes();
    const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

    const err = new Error("get product error");
    productModel.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValueOnce(err),
    });

    // Act
    await getProductController(null, res);

    // Assert
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(err);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in getting products",
      error: err.message,
    });
  });
});

// Get single product test
describe("getSingleProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 when a single product is fetched", async () => {
    // Arrange
    const req = { params: { slug: "testSlug" } };
    const res = makeRes();

    const product = [{
      _id: "1",
      name: "Product A",
      price: 100,
      category: { _id: "c1", name: "Cat" },
      quantity: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    productModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValueOnce(product),
    });

    // Act
    await getSingleProductController(req, res);

    // Assert
    expect(productModel.findOne).toHaveBeenCalledTimes(1);
    expect(productModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product: product
    });
  });

  it("returns 500 when error is thrown", async () => {
    // Arrange
    const req = { params: { slug: "testSlug" } };
    const res = makeRes();

    const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

    const err = new Error("get single product error");
    productModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValueOnce(err),
    });

    // Act
    await getSingleProductController(req, res);

    // Assert
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(err);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting single product",
      error: err,
    });
  });
});

// Get photo tests
describe("productPhotoController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 when the photo is successfully retrieved", async () => {
    // Arrange
    const req = { params: { pid: "testPid" } };
    const res = makeRes();

    const product = {
      photo: {
        data: Buffer.from('testBuffer'),
        contentType: "testContentType",
      }
    };

    productModel.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(product),
    });

    // Act
    await productPhotoController(req, res);

    // Assert
    expect(productModel.findById).toHaveBeenCalledTimes(1);
    expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);

    expect(res.set).toHaveBeenCalledWith("Content-Type", product.photo.contentType);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(product.photo.data);
  });

  it("returns 200 with the default mime type if the photo is missing a mime type", async () => {
    // Arrange
    const req = { params: { pid: "testPid" } };
    const res = makeRes();

    const product = {
      photo: {
        data: Buffer.from('testBuffer'),
      }
    };

    productModel.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(product),
    });

    // Act
    await productPhotoController(req, res);

    // Assert
    expect(productModel.findById).toHaveBeenCalledTimes(1);
    expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);

    expect(res.set).toHaveBeenCalledWith("Content-Type", "application/octet-stream");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(product.photo.data);
  });

  it("returns 404 when the product cannot be found", async () => {
    // Arrange
    const req = { params: { pid: "testPid" } };
    const res = makeRes();

    const product = {
      photo: {
        data: Buffer.from('testBuffer'),
        contentType: "testContentType",
      }
    };

    productModel.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(null),
    });

    // Act
    await productPhotoController(req, res);

    // Assert
    expect(productModel.findById).toHaveBeenCalledTimes(1);
    expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);

    expect(res.set).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Photo not found for this product",
    });
  });

  it("returns 404 when the product's photo does not exist", async () => {
    // Arrange
    const req = { params: { pid: "testPid" } };
    const res = makeRes();

    const product = {};

    productModel.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(product),
    });

    // Act
    await productPhotoController(req, res);

    // Assert
    expect(productModel.findById).toHaveBeenCalledTimes(1);
    expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);

    expect(res.set).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Photo not found for this product",
    });
  });

  it("returns 404 when the product's photo does not contain data", async () => {
    // Arrange
    const req = { params: { pid: "testPid" } };
    const res = makeRes();

    const product = {
      photo: {
        data: null,
        contentType: "testContentType",
      }
    };

    productModel.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(product),
    });

    // Act
    await productPhotoController(req, res);

    // Assert
    expect(productModel.findById).toHaveBeenCalledTimes(1);
    expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);

    expect(res.set).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Photo not found for this product",
    });
  });

  it("returns 500 when error is thrown", async () => {
    // Arrange
    const req = { params: { pid: "testPid" } };
    const res = makeRes();

    const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

    const err = new Error("get product photo error");
    productModel.findById.mockReturnValueOnce({
      select: jest.fn().mockRejectedValueOnce(err),
    });

    // Act
    await productPhotoController(req, res);

    // Assert
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(err);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting photo",
      error: err,
    });
  });
});

describe("productFiltersController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 when product filtering is successful with valid filter", async () => {
    // Arrange
    const req = {
      body: {
        checked: ["c1", "c2"],
        radio: ["r1", "r2"],
      }
    };
    const res = makeRes();

    const dummyProducts = [{
      _id: "1",
    }];

    productModel.find.mockReturnValueOnce(dummyProducts);

    // Act
    await productFiltersController(req, res);

    // Assert
    expect(productModel.find).toHaveBeenCalled();
    expect(productModel.find).toHaveBeenCalledWith({
      category: req.body.checked,
      price: {
        $gte: "r1",
        $lte: "r2",
      }
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: dummyProducts,
    });
  });

  it("returns 200 when product filtering is successful with empty filters", async () => {
    // Arrange
    const req = { body: { checked: [], radio: [] } };
    const res = makeRes();

    const dummyProducts = [{
      _id: "1",
    }];

    productModel.find.mockReturnValueOnce(dummyProducts);

    // Act
    await productFiltersController(req, res);
    
    // Assert
    expect(productModel.find).toHaveBeenCalled();
    expect(productModel.find).toHaveBeenCalledWith({});

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: dummyProducts,
    });
  });

  it("returns 400 when error is thrown", async () => {
    // Arrange
    const req = { body: { checked: [], radio: [] } };
    const res = makeRes();

    const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

    const err = new Error("filter product error");
    productModel.find.mockRejectedValueOnce(err);

    // Act
    await productFiltersController(req, res);
    
    // Assert
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Filtering Products",
      error: err,
    });
  });
});

describe("productCountController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 when count is successfully returned", async () => {
    // Arrange
    const res = makeRes();

    const total = 10;

    productModel.find.mockReturnValueOnce({
      estimatedDocumentCount: jest.fn().mockReturnValueOnce(total),
    });

    // Act
    await productCountController(null, res);
    
    // Assert
    expect(productModel.find).toHaveBeenCalledWith({});

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: total,
    });
  });

  it("returns 400 when error is thrown", async () => {
    // Arrange
    const res = makeRes();

    const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

    const err = new Error("count product error");
    productModel.find.mockReturnValueOnce({
      estimatedDocumentCount: jest.fn().mockRejectedValueOnce(err),
    });

    // Act
    await productCountController(null, res);
    
    // Assert
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in product count",
      error: err,
    });
  });
});

describe("productListController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 when product list is successfully returned using a specified page value", async () => {
    // Arrange
    const req = { params: { page: 2 }};
    const res = makeRes();

    const dummyProducts = [
      {
        _id: "1",
      },
      {
        _id: "2",
      }
    ];

    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnValueOnce(dummyProducts),
    });

    // Act
    await productListController(req, res);
    
    // Assert
    expect(productModel.find).toHaveBeenCalledWith({});

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: dummyProducts,
    });
  });

  it("returns 200 when product list is successfully returned without a specified page value", async () => {
    // Arrange
    const req = { params: {}};
    const res = makeRes();

    const dummyProducts = [
      {
        _id: "1",
      },
      {
        _id: "2",
      }
    ];

    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnValueOnce(dummyProducts),
    });

    // Act
    await productListController(req, res);
    
    // Assert
    expect(productModel.find).toHaveBeenCalledWith({});

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: dummyProducts,
    });
  });

  it("returns 400 when error is thrown", async () => {
    // Arrange
    const req = { params: { page: 2 }};
    const res = makeRes();

    const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

    const err = new Error("list product error");
    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValueOnce(err),
    });

    // Act
    await productListController(req, res);
    
    // Assert
    expect(productModel.find).toHaveBeenCalledWith({});

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in per page control",
      error: err,
    });
  });
});

describe("searchProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 when product search is successful", async () => {
    // Arrange
    const req = { params: { keyword: "dummyKeyword" }};
    const res = makeRes();

    const dummyProducts = [
      {
        _id: "1",
      },
      {
        _id: "2",
      }
    ];

    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(dummyProducts),
    });

    // Act
    await searchProductController(req, res);
    
    // Assert
    expect(productModel.find).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(dummyProducts);
  });

  it("returns 400 when error is thrown", async () => {
    // Arrange
    const req = { params: { keyword: "keyword" }};
    const res = makeRes();

    const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

    const err = new Error("search product error");
    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockRejectedValueOnce(err),
    });

    // Act
    await searchProductController(req, res);
    
    // Assert
    expect(productModel.find).toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error In Search Product API",
      error: err,
    });
  });
});

describe("relatedProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 when related products are successfully retrieved", async () => {
    // Arrange
    const req = { 
      params: { 
        pid: "testPid",
        cid: "testCid",
      }
    };
    const res = makeRes();

    const dummyProducts = [
      {
        _id: "1",
      },
      {
        _id: "2",
      }
    ];

    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValueOnce(dummyProducts),
    });

    // Act
    await relatedProductController(req, res);
    
    // Assert
    expect(productModel.find).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: dummyProducts,
    });
  });

  it("returns 400 when error is thrown", async () => {
    // Arrange
    const req = { 
      params: { 
        pid: "testPid",
        cid: "testCid",
      }
    };
    const res = makeRes();

    const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

    const err = new Error("search related product error");
    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValueOnce(err),
    });

    // Act
    await relatedProductController(req, res);
    
    // Assert
    expect(productModel.find).toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting related products",
      error: err,
    });
  });
});

describe("productCategoryController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 when products of the specified category are successfully retrieved", async () => {
    // Arrange
    const req = { 
      params: { 
        slug: "testSlug",
      }
    };
    const res = makeRes();

    const dummyProducts = [
      {
        _id: "1",
      },
      {
        _id: "2",
      }
    ];

    categoryModel.findOne.mockResolvedValueOnce(dummyProducts[0]);
    productModel.find.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValueOnce(dummyProducts),
    });

    // Act
    await productCategoryController(req, res);
    
    // Assert
    expect(categoryModel.findOne).toHaveBeenCalled();
    expect(productModel.find).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: dummyProducts[0],
      products: dummyProducts,
    });
  });

  it("returns 400 when error is thrown", async () => {
    // Arrange
    const req = { 
      params: { 
        slug: "testSlug",
      }
    };
    const res = makeRes();

    const dummyProducts = [
      {
        _id: "1",
      },
      {
        _id: "2",
      }
    ];

    const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

    const err = new Error("search product category error");
    categoryModel.findOne.mockResolvedValueOnce(dummyProducts[0]);
    productModel.find.mockReturnValueOnce({
      populate: jest.fn().mockRejectedValueOnce(err),
    });

    // Act
    await productCategoryController(req, res);
    
    // Assert
    expect(categoryModel.findOne).toHaveBeenCalled();
    expect(productModel.find).toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting products",
      error: err,
    });
  });
});
