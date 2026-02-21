// Hans Delano, A0273456X
import React from "react";
import "@testing-library/jest-dom";
import HomePage from "./HomePage";
import { act, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import { useCart } from "../context/cart";
import axios from "axios";
import { describe } from "node:test";

jest.mock("axios");

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(() => mockNavigate),
}));

delete window.location;
window.location = { reload: jest.fn() };

jest.mock("../components/Layout.js", () => ({ children, title }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
));

const mockCategories = [
  { _id: "1", name: "Category 1" },
  { _id: "2", name: "Category 2" },
];

const mockProducts = [
  {
    _id: "p1",
    name: "Product 1",
    price: 100,
    description: "Desc 1",
    slug: "p1",
  },
  {
    _id: "p2",
    name: "Product 2",
    price: 200,
    description: "Desc 2",
    slug: "p2",
  },
];

const mockProductsPage1 = [mockProducts[0]];
const mockProductsPage2 = [mockProducts[1]];

const mockFilteredProducts = [
  {
    _id: "p1",
    name: "Filtered Product",
    price: 150,
    description: "Filtered Desc",
  },
];

const mockPriceFilteredProducts = [
  {
    _id: "p2",
    name: "Price Filtered Product",
    price: 250,
    description: "Price Filtered Desc",
  },
];

const setupAxiosMock = ({
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

describe("HomePage", () => {
  beforeEach(() => {
    useCart.mockReturnValue([[], jest.fn()]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("HomePage Component", () => {
    test("should render categories fetched from API", async () => {
      setupAxiosMock({ categories: mockCategories });

      render(
        <Router>
          <HomePage />
        </Router>
      );

      await waitFor(() => {
        mockCategories.forEach((cat) => {
          expect(screen.getByText(cat.name)).toBeInTheDocument();
        });
      });
    });

    test("should render products fetched from API", async () => {
      setupAxiosMock({ products: mockProducts, total: mockProducts.length });

      render(
        <Router>
          <HomePage />
        </Router>
      );

      await waitFor(() => {
        mockProducts.forEach((prod) => {
          expect(screen.getByText(prod.name)).toBeInTheDocument();
        });
      });
    });

    test("should get more products on page change", async () => {
      setupAxiosMock({
        total: 2,
        pageProducts: { 1: mockProductsPage1, 2: mockProductsPage2 },
      });

      render(
        <Router>
          <HomePage />
        </Router>
      );

      await waitFor(() => {
        mockProductsPage1.forEach((prod) => {
          expect(screen.getByText(prod.name)).toBeInTheDocument();
        });
      });

      const nextButton = screen.getByText("Load more");
      act(() => {
        nextButton.click();
      });

      await waitFor(() => {
        mockProductsPage2.forEach((prod) => {
          expect(screen.getByText(prod.name)).toBeInTheDocument();
        });
      });
    });
  });

  describe("HomePage Interactions", () => {
    test("should add product to cart on 'ADD TO CART' button click", async () => {
      const mockSetCart = jest.fn();
      useCart.mockReturnValue([[], mockSetCart]);

      setupAxiosMock({ products: mockProducts.slice(0, 1), total: 1 });

      render(
        <Router>
          <HomePage />
        </Router>
      );

      await waitFor(() => {
        const addToCartButton = screen.getByText("ADD TO CART");
        addToCartButton.click();
        expect(mockSetCart).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ _id: "p1", name: "Product 1" }),
          ])
        );
      });
    });

    test("should navigate to product details on 'MORE DETAILS' button click", async () => {
      setupAxiosMock({ products: mockProducts.slice(0, 1), total: 1 });

      render(
        <Router>
          <HomePage />
        </Router>
      );

      await waitFor(() => {
        const moreDetailsButton = screen.getByText("More Details");
        moreDetailsButton.click();
        expect(mockNavigate).toHaveBeenCalledWith("/product/p1");
      });
    });

    describe("Filter Products", () => {
      test("should filter products based on category selection", async () => {
        setupAxiosMock({
          categories: mockCategories,
          postHandler: (params) => {
            if (params.checked.includes("1")) {
              return Promise.resolve({
                data: { products: mockFilteredProducts },
              });
            }
            return Promise.resolve({ data: { products: [] } });
          },
        });

        render(
          <Router>
            <HomePage />
          </Router>
        );
        await waitFor(() => {
          mockCategories.forEach((cat) => {
            expect(screen.getByText(cat.name)).toBeInTheDocument();
          });
        });
        const categoryCheckbox = screen.getByLabelText("Category 1");
        act(() => {
          categoryCheckbox.click();
        });

        await waitFor(() => {
          mockFilteredProducts.forEach((prod) => {
            expect(screen.getByText(prod.name)).toBeInTheDocument();
          });
        });
      });

      test("should filter products based on price range selection", async () => {
        setupAxiosMock({
          categories: mockCategories.slice(0, 1),
          postHandler: (params) => {
            if (params.radio[0] === 100 && params.radio[1] === 9999) {
              return Promise.resolve({
                data: { products: mockPriceFilteredProducts },
              });
            }
            return Promise.resolve({ data: { products: [] } });
          },
        });

        render(
          <Router>
            <HomePage />
          </Router>
        );

        await waitFor(() => {
          expect(screen.getByText("Category 1")).toBeInTheDocument();
        });
        const priceRadio = screen.getByLabelText("$100 or more");
        act(() => {
          priceRadio.click();
        });

        await waitFor(() => {
          mockPriceFilteredProducts.forEach((prod) => {
            expect(screen.getByText(prod.name)).toBeInTheDocument();
          });
        });
      });

      test("should reset filters when 'RESET FILTERS' button is clicked", async () => {
        setupAxiosMock({
          categories: mockCategories.slice(0, 1),
          products: mockProductsPage1,
          total: mockProductsPage1.length,
        });

        render(
          <Router>
            <HomePage />
          </Router>
        );
        await waitFor(() => {
          mockProductsPage1.forEach((prod) => {
            expect(screen.getByText(prod.name)).toBeInTheDocument();
          });
        });
        const resetButton = screen.getByText("RESET FILTERS");
        act(() => {
          resetButton.click();
        });

        await waitFor(() => {
          mockProductsPage1.forEach((prod) => {
            expect(screen.getByText(prod.name)).toBeInTheDocument();
          });
        });
      });
    });

    test("should remove category filter when checkbox is unchecked", async () => {
      setupAxiosMock({
        categories: mockCategories,
        products: mockProductsPage1,
        total: mockProductsPage1.length,
      });

      render(
        <Router>
          <HomePage />
        </Router>
      );
      await waitFor(() => {
        mockCategories.forEach((cat) => {
          expect(screen.getByText(cat.name)).toBeInTheDocument();
        });
      });

      const categoryCheckbox = screen.getByLabelText("Category 1");
      act(() => {
        categoryCheckbox.click();
      });
      act(() => {
        categoryCheckbox.click();
      });

      await waitFor(() => {
        mockProductsPage1.forEach((prod) => {
          expect(screen.getByText(prod.name)).toBeInTheDocument();
        });
      });
    });
  });

  describe("HomePage Errors", () => {
    test("should handle API errors gracefully", async () => {
      setupAxiosMock({ rejectGet: true });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      render(
        <Router>
          <HomePage />
        </Router>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.objectContaining({ message: "API Error" })
        );
      });
    });

    test("should handle load more errors gracefully", async () => {
      setupAxiosMock({
        total: 2,
        pageProducts: { 1: mockProductsPage1 },
        rejectLoadMore: true,
      });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      render(
        <Router>
          <HomePage />
        </Router>
      );
      await waitFor(() => {
        mockProductsPage1.forEach((prod) => {
          expect(screen.getByText(prod.name)).toBeInTheDocument();
        });
      });
      const nextButton = screen.getByText("Load more");
      act(() => {
        nextButton.click();
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Load More Error" })
        );
      });
    });

    test("should handle filter API errors gracefully", async () => {
      setupAxiosMock({ categories: mockCategories, rejectPost: true });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      render(
        <Router>
          <HomePage />
        </Router>
      );
      await waitFor(() => {
        mockCategories.forEach((cat) => {
          expect(screen.getByText(cat.name)).toBeInTheDocument();
        });
      });
      const categoryCheckbox = screen.getByLabelText("Category 1");
      act(() => {
        categoryCheckbox.click();
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Filter API Error" })
        );
      });
    });
  });
});
