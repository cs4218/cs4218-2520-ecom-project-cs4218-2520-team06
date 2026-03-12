import axios from "axios";
import {
  forgotPasswordController,
  loginController,
  registerController,
} from "../../../controllers/authController";

export const setupAxiosMock = ({
  categories = [],
  products = [],
  categoryProducts = {},
  total = 0,
  pageProducts = null,
  rejectGet = false,
  rejectLoadMore = false,
  postHandler = null,
  rejectPost = false,
} = {}) => {
  axios.get.mockImplementation((url) => {
    if (rejectGet) return Promise.reject(new Error("API Error"));

    if (url === "/api/v1/category/get-category") {
      return Promise.resolve({ data: { success: true, category: categories } });
    }
    if (url === "/api/v1/product/product-count") {
      return Promise.resolve({ data: { total } });
    }
    if (url.startsWith("/api/v1/product/product-category/")) {
      const slug = url.split("/").pop();
      return Promise.resolve({
        data: {
          products: categoryProducts[slug],
          category: categories,
        },
      });
    }

    if (url.startsWith("/api/v1/product/product-list/")) {
      const page = url.split("/").pop();
      if (rejectLoadMore && page !== "1") {
        return Promise.reject(new Error("Load More Error"));
      }
      if (pageProducts && pageProducts[page] !== undefined) {
        return Promise.resolve({ data: { products: pageProducts[page] } });
      }
      return Promise.resolve({ data: { products } });
    }
    return Promise.resolve({ data: {} });
  });

  axios.post.mockImplementation((url, payload) => {
    if (url === "/api/v1/product/product-filters") {
      if (rejectPost) return Promise.reject(new Error("Filter API Error"));
      if (postHandler) return postHandler(payload);
    }
    if (url === "/api/v1/auth/register") {
      return createMockController(registerController)(url, payload);
    }
    if (url === "/api/v1/auth/login") {
      return createMockController(loginController)(url, payload);
    }
    if (url === "/api/v1/auth/forgot-password") {
      return createMockController(forgotPasswordController)(url, payload);
    }
    return Promise.resolve({ data: {} });
  });
};

export const createMockController = (handlerCallback) => {
  return async (url, payload) => {
    const req = { body: payload };
    let responseBody;
    let statusCode = 200;
    const res = {
      status: jest.fn().mockImplementation((code) => {
        statusCode = code;
        return res;
      }),
      send: jest.fn().mockImplementation((body) => {
        responseBody = body;
      }),
    };

    await handlerCallback(req, res);

    return { status: statusCode, data: responseBody };
  };
};
