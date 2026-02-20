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

// Mock Layout component
jest.mock("../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout">
        <div data-testid="layout-title">{title}</div>
        {children}
      </div>
    );
  };
});

describe("HomePage", () => {
  beforeEach(() => {
    useCart.mockReturnValue([[], jest.fn()]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("HomePage Component", () => {
    test("renders categories fetched from API", async () => {
      const mockCategories = [
        { _id: "1", name: "Category 1" },
        { _id: "2", name: "Category 2" },
      ];

      axios.get.mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        }
        if (url === "/api/v1/product/product-count") {
          return Promise.resolve({ data: { total: 0 } });
        }
        return Promise.resolve({ data: {} });
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
    });

    test("renders products fetched from API", async () => {
      const mockProducts = [
        { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
        { _id: "p2", name: "Product 2", price: 200, description: "Desc 2" },
      ];

      axios.get.mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({ data: { success: true, category: [] } });
        }
        if (url === "/api/v1/product/product-count") {
          return Promise.resolve({ data: { total: mockProducts.length } });
        }
        if (url.startsWith("/api/v1/product/product-list/")) {
          return Promise.resolve({ data: { products: mockProducts } });
        }
        return Promise.resolve({ data: {} });
      });

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

    test("get more products on page change", async () => {
      const mockProductsPage1 = [
        { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
      ];
      const mockProductsPage2 = [
        { _id: "p2", name: "Product 2", price: 200, description: "Desc 2" },
      ];

      axios.get.mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({ data: { success: true, category: [] } });
        }
        if (url === "/api/v1/product/product-count") {
          return Promise.resolve({ data: { total: 2 } });
        }
        if (url === "/api/v1/product/product-list/1") {
          return Promise.resolve({ data: { products: mockProductsPage1 } });
        }
        if (url === "/api/v1/product/product-list/2") {
          return Promise.resolve({ data: { products: mockProductsPage2 } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <Router>
          <HomePage />
        </Router>
      );

      // Wait for first page products
      await waitFor(() => {
        mockProductsPage1.forEach((prod) => {
          expect(screen.getByText(prod.name)).toBeInTheDocument();
        });
      });

      // Simulate clicking "Next" button to load second page
      const nextButton = screen.getByText("Load more");
      act(() => {
        nextButton.click();
      });

      // Wait for second page products
      await waitFor(() => {
        mockProductsPage2.forEach((prod) => {
          expect(screen.getByText(prod.name)).toBeInTheDocument();
        });
      });
    });
  });

  describe("HomePage Interactions", () => {
    test("adds product to cart on 'ADD TO CART' button click", async () => {
      const mockProducts = [
        { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
      ];
      const mockSetCart = jest.fn();

      useCart.mockReturnValue([[], mockSetCart]);

      axios.get.mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({ data: { success: true, category: [] } });
        }
        if (url === "/api/v1/product/product-count") {
          return Promise.resolve({ data: { total: mockProducts.length } });
        }
        if (url.startsWith("/api/v1/product/product-list/")) {
          return Promise.resolve({ data: { products: mockProducts } });
        }
        return Promise.resolve({ data: {} });
      });

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

    test("navigates to product details on 'MORE DETAILS' button click", async () => {
      const mockProducts = [
        {
          _id: "p1",
          name: "Product 1",
          price: 100,
          description: "Desc 1",
          slug: "p1",
        },
      ];

      axios.get.mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({ data: { success: true, category: [] } });
        }
        if (url === "/api/v1/product/product-count") {
          return Promise.resolve({ data: { total: mockProducts.length } });
        }
        if (url.startsWith("/api/v1/product/product-list/")) {
          return Promise.resolve({ data: { products: mockProducts } });
        }
        return Promise.resolve({ data: {} });
      });

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
      test("filters products based on category selection", async () => {
        const mockCategories = [
          { _id: "1", name: "Category 1" },
          { _id: "2", name: "Category 2" },
        ];
        const mockFilteredProducts = [
          {
            _id: "p1",
            name: "Filtered Product",
            price: 150,
            description: "Filtered Desc",
          },
        ];

        axios.get.mockImplementation((url) => {
          if (url === "/api/v1/category/get-category") {
            return Promise.resolve({
              data: { success: true, category: mockCategories },
            });
          }
          if (url === "/api/v1/product/product-count") {
            return Promise.resolve({ data: { total: 0 } });
          }
          return Promise.resolve({ data: {} });
        });

        axios.post.mockImplementation((url, params) => {
          if (url === "/api/v1/product/product-filters") {
            if (params.checked.includes("1")) {
              return Promise.resolve({
                data: { products: mockFilteredProducts },
              });
            }
            return Promise.resolve({ data: { products: [] } });
          }
          return Promise.resolve({ data: {} });
        });

        render(
          <Router>
            <HomePage />
          </Router>
        );

        // Wait for categories to load
        await waitFor(() => {
          mockCategories.forEach((cat) => {
            expect(screen.getByText(cat.name)).toBeInTheDocument();
          });
        });

        // Simulate selecting a category checkbox
        const categoryCheckbox = screen.getByLabelText("Category 1");
        act(() => {
          categoryCheckbox.click();
        });

        // Wait for filtered products to load
        await waitFor(() => {
          mockFilteredProducts.forEach((prod) => {
            expect(screen.getByText(prod.name)).toBeInTheDocument();
          });
        });
      });

      test("filters products based on price range selection", async () => {
        const mockCategories = [{ _id: "1", name: "Category 1" }];
        const mockFilteredProducts = [
          {
            _id: "p2",
            name: "Price Filtered Product",
            price: 250,
            description: "Price Filtered Desc",
          },
        ];

        axios.get.mockImplementation((url) => {
          if (url === "/api/v1/category/get-category") {
            return Promise.resolve({
              data: { success: true, category: mockCategories },
            });
          }
          if (url === "/api/v1/product/product-count") {
            return Promise.resolve({ data: { total: 0 } });
          }
          return Promise.resolve({ data: {} });
        });

        axios.post.mockImplementation((url, params) => {
          if (url === "/api/v1/product/product-filters") {
            if (params.radio[0] === 100 && params.radio[1] === 9999) {
              return Promise.resolve({
                data: { products: mockFilteredProducts },
              });
            }
            return Promise.resolve({ data: { products: [] } });
          }
          return Promise.resolve({ data: {} });
        });

        render(
          <Router>
            <HomePage />
          </Router>
        );

        // Wait for categories to load
        await waitFor(() => {
          mockCategories.forEach((cat) => {
            expect(screen.getByText(cat.name)).toBeInTheDocument();
          });
        });

        // Simulate selecting a price range radio button
        const priceRadio = screen.getByLabelText("$100 or more");

        act(() => {
          priceRadio.click();
        });

        // Wait for filtered products to load
        await waitFor(() => {
          mockFilteredProducts.forEach((prod) => {
            expect(screen.getByText(prod.name)).toBeInTheDocument();
          });
        });
      });

      test("resets filters when 'RESET FILTERS' button is clicked", async () => {
        const mockCategories = [{ _id: "1", name: "Category 1" }];
        const mockAllProducts = [
          { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
        ];

        axios.get.mockImplementation((url) => {
          if (url === "/api/v1/category/get-category") {
            return Promise.resolve({
              data: { success: true, category: mockCategories },
            });
          }
          if (url === "/api/v1/product/product-count") {
            return Promise.resolve({ data: { total: mockAllProducts.length } });
          }
          if (url.startsWith("/api/v1/product/product-list/")) {
            return Promise.resolve({ data: { products: mockAllProducts } });
          }
          return Promise.resolve({ data: {} });
        });

        render(
          <Router>
            <HomePage />
          </Router>
        );

        // Wait for all products to load
        await waitFor(() => {
          mockAllProducts.forEach((prod) => {
            expect(screen.getByText(prod.name)).toBeInTheDocument();
          });
        });

        // Simulate clicking the "RESET FILTERS" button
        const resetButton = screen.getByText("RESET FILTERS");
        act(() => {
          resetButton.click();
        });

        // Wait for all products to reload
        await waitFor(() => {
          mockAllProducts.forEach((prod) => {
            expect(screen.getByText(prod.name)).toBeInTheDocument();
          });
        });
      });
    });

    test("remove category filter when checkbox is unchecked", async () => {
      const mockCategories = [
        { _id: "1", name: "Category 1" },
        { _id: "2", name: "Category 2" },
      ];
      const mockAllProducts = [
        { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
      ];

      axios.get.mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        }
        if (url === "/api/v1/product/product-count") {
          return Promise.resolve({ data: { total: mockAllProducts.length } });
        }
        if (url.startsWith("/api/v1/product/product-list/")) {
          return Promise.resolve({ data: { products: mockAllProducts } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <Router>
          <HomePage />
        </Router>
      );

      // Wait for categories to load
      await waitFor(() => {
        mockCategories.forEach((cat) => {
          expect(screen.getByText(cat.name)).toBeInTheDocument();
        });
      });

      // Simulate selecting and then unselecting a category checkbox
      const categoryCheckbox = screen.getByLabelText("Category 1");
      act(() => {
        categoryCheckbox.click();
      });
      act(() => {
        categoryCheckbox.click();
      });

      // Wait for all products to reload
      await waitFor(() => {
        mockAllProducts.forEach((prod) => {
          expect(screen.getByText(prod.name)).toBeInTheDocument();
        });
      });
    });
  });

  describe("HomePage Errors", () => {
    test("handles API errors gracefully", async () => {
      const error = new Error("API Error");
      axios.get.mockImplementation((url) => {
        return Promise.reject(error);
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      render(
        <Router>
          <HomePage />
        </Router>
      );

      // Since errors are logged to console, we can check that no products or categories are rendered
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });

    test("handles load more errors gracefully", async () => {
      const mockProducts = [
        { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
      ];

      axios.get.mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({ data: { success: true, category: [] } });
        }
        if (url === "/api/v1/product/product-count") {
          return Promise.resolve({ data: { total: 2 } });
        }
        if (url === "/api/v1/product/product-list/1") {
          return Promise.resolve({ data: { products: mockProducts } });
        }
        if (url === "/api/v1/product/product-list/2") {
          return Promise.reject(new Error("Load More Error"));
        }
        return Promise.resolve({ data: {} });
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      render(
        <Router>
          <HomePage />
        </Router>
      );

      // Wait for first page products
      await waitFor(() => {
        mockProducts.forEach((prod) => {
          expect(screen.getByText(prod.name)).toBeInTheDocument();
        });
      });

      // Simulate clicking "Next" button to load second page
      const nextButton = screen.getByText("Load more");
      act(() => {
        nextButton.click();
      });

      // Check that error was logged
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Load More Error" })
        );
      });
    });

    test("handles filter API errors gracefully", async () => {
      const mockCategories = [
        { _id: "1", name: "Category 1" },
        { _id: "2", name: "Category 2" },
      ];

      axios.get.mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        }
        if (url === "/api/v1/product/product-count") {
          return Promise.resolve({ data: { total: 0 } });
        }
        return Promise.resolve({ data: {} });
      });

      axios.post.mockImplementation((url) => {
        return Promise.reject(new Error("Filter API Error"));
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      render(
        <Router>
          <HomePage />
        </Router>
      );

      // Wait for categories to load
      await waitFor(() => {
        mockCategories.forEach((cat) => {
          expect(screen.getByText(cat.name)).toBeInTheDocument();
        });
      });

      // Simulate selecting a category checkbox
      const categoryCheckbox = screen.getByLabelText("Category 1");
      act(() => {
        categoryCheckbox.click();
      });

      // Check that error was logged
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Filter API Error" })
        );
      });
    });
  });
});
