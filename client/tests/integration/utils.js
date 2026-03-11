import axios from "axios";

export const setupAxiosMock = ({
  categories = [],
  products = [],
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

  axios.post.mockImplementation((url, params) => {
    if (url === "/api/v1/product/product-filters") {
      if (rejectPost) return Promise.reject(new Error("Filter API Error"));
      if (postHandler) return postHandler(params);
    }
    return Promise.resolve({ data: {} });
  });
};
