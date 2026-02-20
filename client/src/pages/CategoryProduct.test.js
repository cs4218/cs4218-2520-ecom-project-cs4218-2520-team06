// Hans Delano, A0273456X
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import { useCart } from "../context/cart";
import axios from "axios";
import { describe } from "node:test";
import CategoryProduct from "./CategoryProduct";

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
  useParams: jest.fn(() => ({ slug: "test-category" })),
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

describe("CategoryProduct", () => {
  beforeEach(() => {
    useCart.mockReturnValue([[], jest.fn()]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("CategoryProduct Component", () => {
    test("should renders products from category", async () => {
      const mockProducts = [
        { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
        { _id: "p2", name: "Product 2", price: 200, description: "Desc 2" },
      ];
      const mockCategories = [
        { _id: "c1", name: "test-category" },
        { _id: "c2", name: "Category 2" },
      ];

      axios.get.mockImplementation((url) => {
        if (url === `/api/v1/product/product-category/test-category`) {
          return Promise.resolve({
            data: { products: mockProducts, category: mockCategories },
          });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <Router>
          <CategoryProduct />
        </Router>
      );

      await waitFor(() => {
        mockProducts.forEach((prod) => {
          expect(screen.getByText(prod.name)).toBeInTheDocument();
        });
      });
    });
  });

  describe("CategoryProduct Interactions", () => {
    test("should add product to cart on 'ADD TO CART' button click", async () => {
      const mockProducts = [
        { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
      ];
      axios.get.mockImplementation((url) => {
        if (url === `/api/v1/product/product-category/test-category`) {
          return Promise.resolve({
            data: { products: mockProducts, category: [] },
          });
        }
        return Promise.resolve({ data: {} });
      });

      const mockSetCart = jest.fn();
      useCart.mockReturnValue([[], mockSetCart]);

      render(
        <Router>
          <CategoryProduct />
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

    test("should navigates to product details on 'MORE DETAILS' button click", async () => {
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
        if (url === `/api/v1/product/product-category/test-category`) {
          return Promise.resolve({
            data: { products: mockProducts, category: [] },
          });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <Router>
          <CategoryProduct />
        </Router>
      );

      await waitFor(() => {
        const moreDetailsButton = screen.getByText("More Details");
        moreDetailsButton.click();
        expect(mockNavigate).toHaveBeenCalledWith("/product/p1");
      });
    });
  });

  describe("CategoryProduct Errors", () => {
    test("should handles API errors gracefully", async () => {
      const error = new Error("API Error");
      axios.get.mockImplementation((url) => {
        return Promise.reject(error);
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      render(
        <Router>
          <CategoryProduct />
        </Router>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });

    test("should handles no category in param", async () => {
      const { useParams } = require("react-router-dom");
      useParams.mockReturnValue({ slug: null });

      render(
        <Router>
          <CategoryProduct />
        </Router>
      );

      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
