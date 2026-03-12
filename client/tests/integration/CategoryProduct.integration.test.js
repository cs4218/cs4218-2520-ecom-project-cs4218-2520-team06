// Hans Delano, A0273456X
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, act, waitFor } from "@testing-library/react";
import { afterEach, describe } from "node:test";
import { BrowserRouter as Router } from "react-router-dom";
import { setupAxiosMock } from "./utils";
import { AuthProvider } from "../../src/context/auth";
import { SearchProvider } from "../../src/context/search";
import { CartProvider, useCart } from "../../src/context/cart";
import CategoryProduct from "../../src/pages/CategoryProduct";

jest.mock("axios");
jest.mock("../../../models/userModel.js");
jest.mock("../../../models/orderModel.js");

// Helper component to expose cart state for test assertions
const CartReader = () => {
  const [cart] = useCart();
  return <div data-testid="cart-contents">{JSON.stringify(cart)}</div>;
};

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(() => mockNavigate),
  useParams: jest.fn(() => ({ slug: "test-category" })),
}));

const mockProducts = [
  { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
  { _id: "p2", name: "Product 2", price: 200, description: "Desc 2" },
];
const mockCategories = [
  { _id: "c1", name: "test-category" },
  { _id: "c2", name: "Category 2" },
];

const renderCategoryProductPage = async () => {
  await act(async () => {
    render(
      <Router>
        <AuthProvider>
          <SearchProvider>
            <CartProvider>
              <CategoryProduct />
              <CartReader />
            </CartProvider>
          </SearchProvider>
        </AuthProvider>
      </Router>
    );
  });
};

describe("CategoryProduct Page", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", async () => {
    setupAxiosMock({
      categoryProducts: { "test-category": mockProducts },
      category: mockCategories,
    });

    await renderCategoryProductPage();

    await waitFor(() => {
      mockProducts.forEach((prod) => {
        expect(screen.getByText(prod.name)).toBeInTheDocument();
      });
    });
  });

  it("should add products to cart", async () => {
    setupAxiosMock({
      categoryProducts: { "test-category": mockProducts },
      category: mockCategories,
    });

    await renderCategoryProductPage();

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
