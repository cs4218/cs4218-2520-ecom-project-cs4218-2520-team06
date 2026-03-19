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
import CartPage from "../../src/pages/CartPage";
import { afterEach } from "node:test";

jest.mock("axios");
jest.mock("../../../models/userModel.js");
jest.mock("../../../models/orderModel.js");

// Fake localStorage implementation for testing
const localStorageFake = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageFake });

const mockCart = [
  { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
  { _id: "p2", name: "Product 2", price: 200, description: "Desc 2" },
];

const setMockCart = (cart = mockCart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
};

const renderCartPage = async () => {
  await act(async () => {
    render(
      <Router>
        <AuthProvider>
          <SearchProvider>
            <CartProvider>
              <CartPage />
            </CartProvider>
          </SearchProvider>
        </AuthProvider>
      </Router>
    );
  });
};

describe("CartPage Integration Tests", () => {
  beforeEach(() => {
    setupAxiosMock();
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("renders cart page with empty cart", async () => {
    await renderCartPage();

    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
  });

  test("should renders cart items and total price", async () => {
    setMockCart();

    await renderCartPage();

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.getByText(/\$300\.00/)).toBeInTheDocument();
  });
});
