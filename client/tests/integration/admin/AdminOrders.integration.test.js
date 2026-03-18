// Gallen Ong, A0252614L
// Isolated integration test for AdminOrders component
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, act, waitFor, fireEvent } from "@testing-library/react";
import AdminOrders from "../../../src/pages/admin/AdminOrders";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "../../../src/context/auth";
import axios from "axios";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../../src/components/Footer", () => () => <div>Footer</div>);
jest.mock("../../../src/components/Header", () => () => <div>Header</div>);

const mockOrders = [
  {
    _id: "order1",
    status: "Not Processed",
    buyer: { name: "John Doe" },
    createdAt: new Date("2024-03-01"),
    payment: { success: true },
    products: [
      {
        _id: "prod1",
        name: "Product 1",
        description: "This is a test product",
        price: 50,
      },
    ],
  },
  {
    _id: "order2",
    status: "Processing",
    buyer: { name: "Jane Smith" },
    createdAt: new Date("2024-03-02"),
    payment: { success: true },
    products: [
      {
        _id: "prod2",
        name: "Product 2",
        description: "Another test product",
        price: 75,
      },
      {
        _id: "prod3",
        name: "Product 3",
        description: "Third test product",
        price: 100,
      },
    ],
  },
];

const mockAuthState = {
  user: { name: "Admin User", email: "admin@test.com", role: 1 },
  token: "mock_token_12345",
};

const renderAdminOrdersPage = async () => {
  await act(async () => {
    render(
      <Router>
        <AuthProvider>
          <AdminOrders />
        </AuthProvider>
      </Router>
    );
  });
};

describe("Admin Orders Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("auth", JSON.stringify(mockAuthState));
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem("auth");
  });

  it("fetches and displays orders with products on mount", async () => {
    axios.get.mockResolvedValue({ data: mockOrders });

    await renderAdminOrdersPage();

    await waitFor(
      () => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("updates order status and refetches orders", async () => {
    axios.get.mockResolvedValue({ data: mockOrders });
    axios.put.mockResolvedValue({ data: { success: true } });

    await renderAdminOrdersPage();

    await waitFor(
      () => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const statusSelects = screen.getAllByRole("combobox");
    expect(statusSelects.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.mouseDown(statusSelects[0]);
    });

    await waitFor(
      () => {
        const shippedOption = Array.from(
          document.querySelectorAll(".ant-select-item-option-content")
        ).find((node) => node.textContent === "Shipped");
        expect(shippedOption).toBeTruthy();
        fireEvent.click(shippedOption);
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/auth/order-status/order1",
          expect.any(Object)
        );
      },
      { timeout: 2000 }
    );
  });
});
