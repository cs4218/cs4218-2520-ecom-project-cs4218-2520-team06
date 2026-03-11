// Hans Delano, A0273456X
import React from "react";
import "@testing-library/jest-dom";
import HomePage from "../../src/pages/HomePage";
import { act, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import { CartProvider, useCart } from "../../src/context/cart";
import { AuthProvider } from "../../src/context/auth";
import { SearchProvider } from "../../src/context/search";
import { setupAxiosMock } from "./utils";

jest.mock("axios");

// Helper component to expose cart state for test assertions
const CartReader = () => {
  const [cart] = useCart();
  return <div data-testid="cart-contents">{JSON.stringify(cart)}</div>;
};

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

delete window.location;
window.location = {
  reload: jest.fn(),
  href: "http://localhost",
  origin: "http://localhost",
};

const mockCategories = [
  { _id: "1", name: "Category 1", slug: "category-1" },
  { _id: "2", name: "Category 2", slug: "category-2" },
];

const mockProducts = [
  {
    _id: "p1",
    name: "Product 1",
    price: 99,
    description: "Desc 1",
    category: "1",
    slug: "p1",
  },
  {
    _id: "p2",
    name: "Product 2",
    price: 100,
    description: "Desc 2",
    category: "1",
    slug: "p2",
  },
  {
    _id: "p3",
    name: "Product 3",
    price: 101,
    description: "Desc 2",
    category: "2",
    slug: "p3",
  },
];

const mockProductsPage1 = [mockProducts[0]];
const mockProductsPage2 = [mockProducts[1], mockProducts[2]];

const mockFilteredProducts = [
  {
    _id: "p4",
    name: "Filtered Product",
    price: 50,
    description: "Filtered Desc",
    category: "1",
    slug: "p4",
  },
];

const mockPriceFilteredProducts = [
  {
    _id: "p5",
    name: "Price Filtered Product",
    price: 149,
    description: "Price Filtered Desc",
    category: "2",
    slug: "p5",
  },
];

const renderHomePage = async () => {
  await act(async () => {
    render(
      <Router>
        <AuthProvider>
          <SearchProvider>
            <CartProvider>
              <HomePage />
              <CartReader />
            </CartProvider>
          </SearchProvider>
        </AuthProvider>
      </Router>
    );
  });
};

describe("HomePage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders HomePage component with all other components", async () => {
    setupAxiosMock({
      categories: mockCategories,
      products: mockProducts,
      total: 2,
    });

    await renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getByText("Product 3")).toBeInTheDocument();
    });
  });

  test("handle filtering products by price", async () => {
    setupAxiosMock({
      categories: mockCategories,
      products: mockProducts,
      total: 2,
      postHandler: (params) => {
        if (
          params.radio &&
          params.radio[0] === 100 &&
          params.radio[1] === 9999
        ) {
          return Promise.resolve({
            data: { products: mockPriceFilteredProducts },
          });
        }
        return Promise.resolve({ data: { products: [] } });
      },
    });

    await renderHomePage();
    // Simluate price filter
    await act(async () => {
      screen.getByLabelText("$100 or more").click();
    });

    await waitFor(() => {
      expect(screen.getByText("Price Filtered Product")).toBeInTheDocument();
    });
  });

  test("handle filtering products by category", async () => {
    setupAxiosMock({
      categories: mockCategories,
      products: mockProducts,
      total: 2,
      postHandler: (params) => {
        if (params.checked.includes("1")) {
          return Promise.resolve({ data: { products: mockFilteredProducts } });
        }
        return Promise.resolve({ data: { products: [] } });
      },
    });

    await renderHomePage();
    // Simulate category filter
    await act(async () => {
      screen.getByLabelText("Category 1").click();
    });

    await waitFor(() => {
      expect(screen.getByText("Filtered Product")).toBeInTheDocument();
    });
  });

  test("handle load more products", async () => {
    setupAxiosMock({
      categories: mockCategories,
      products: mockProductsPage1,
      total: 3,
      pageProducts: {
        1: mockProductsPage1,
        2: mockProductsPage2,
      },
    });

    await renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
    });

    // Simulate load more
    await act(async () => {
      screen.getByText("Load more").click();
    });

    await waitFor(() => {
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getByText("Product 3")).toBeInTheDocument();
    });
  });

  test("handle add to cart", async () => {
    setupAxiosMock({
      categories: mockCategories,
      products: mockProducts,
      total: 2,
    });

    await renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
    });

    // Simulate add to cart
    await act(async () => {
      screen.getAllByText("ADD TO CART")[0].click();
    });

    await waitFor(() => {
      const cartContents = JSON.parse(
        screen.getByTestId("cart-contents").textContent
      );
      expect(cartContents).toHaveLength(1);
      expect(cartContents[0]._id).toBe("p1");
      expect(cartContents[0].name).toBe("Product 1");
    });
  });
});
