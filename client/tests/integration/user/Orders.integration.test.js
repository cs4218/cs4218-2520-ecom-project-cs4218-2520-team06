import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import Orders from "../../../src/pages/user/Orders.js";
import { AuthProvider } from "../../../src/context/auth.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";

jest.mock("axios");

const mockOrder = {
  _id: "order1",
  status: "Processing",
  buyer: { _id: "user-1", name: "John Doe" },
  createdAt: "2024-01-01T00:00:00.000Z",
  payment: { success: true },
  products: [
    {
      _id: "prod1",
      name: "Test Product",
      description: "A test product",
      price: 99.99,
    },
  ],
};

const authState = {
  user: {
    _id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    role: 0,
  },
  token: "valid-token",
};

const renderPage = () =>
  render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter>
            <Orders />
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );

describe("Orders Page integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    console.log = jest.fn();
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("should read auth from localStorage via AuthProvider and trigger orders API call", async () => {
    localStorage.setItem("auth", JSON.stringify(authState));
    localStorage.setItem("cart", JSON.stringify([]));
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({ data: [mockOrder] });
      }
      return Promise.resolve({ data: { success: true, category: [] } });
    });

    renderPage();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });
  });

  it("should NOT call orders API when localStorage has no auth token", async () => {
    localStorage.setItem("auth", JSON.stringify({ user: null, token: "" }));
    localStorage.setItem("cart", JSON.stringify([]));

    renderPage();

    const ordersCalls = axios.get.mock.calls.filter(
      (call) => call[0] === "/api/v1/auth/orders"
    );

    await waitFor(() => {
      expect(ordersCalls).toHaveLength(0);
    });
  });

  it("should display order data through the full provider chain", async () => {
    localStorage.setItem("auth", JSON.stringify(authState));
    localStorage.setItem("cart", JSON.stringify([]));
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({ data: [mockOrder] });
      }
      return Promise.resolve({ data: { success: true, category: [] } });
    });

    renderPage();

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(await screen.findByText("Processing")).toBeInTheDocument();
    expect(await screen.findByText("Test Product")).toBeInTheDocument();
  });

  it("should handle API errors gracefully with real providers active", async () => {
    localStorage.setItem("auth", JSON.stringify(authState));
    localStorage.setItem("cart", JSON.stringify([]));
    const error = new Error("Network Error");
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/orders") {
        return Promise.reject(error);
      }
      return Promise.resolve({ data: { success: true, category: [] } });
    });

    renderPage();

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(error);
    });
  });
});
