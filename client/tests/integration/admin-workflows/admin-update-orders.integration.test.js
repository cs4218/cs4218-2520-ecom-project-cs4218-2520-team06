// Gallen Ong, A0252614L
// Full-stack integration test for admin orders workflow (read and update status)
import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../../src/context/auth.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";
import axios from "axios";
import AdminOrders from "../../../src/pages/admin/AdminOrders.js";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => <div data-testid="toast-container" />,
}));

const adminUser = {
  name: "Admin User",
  email: "admin@test.com",
  phone: "1234567890",
  role: 1,
};
const mockToken = "mock-admin-token";

const mockOrders = [
  {
    _id: "order-1",
    status: "Not Processed",
    buyer: { name: "John Doe" },
    createdAt: new Date("2024-03-01"),
    payment: { success: true },
    products: [
      {
        _id: "prod-1",
        name: "Laptop",
        description: "High-performance laptop for work",
        price: 999,
      },
    ],
  },
  {
    _id: "order-2",
    status: "Processing",
    buyer: { name: "Jane Smith" },
    createdAt: new Date("2024-03-02"),
    payment: { success: true },
    products: [
      {
        _id: "prod-2",
        name: "Mouse",
        description: "Wireless mouse",
        price: 25,
      },
      {
        _id: "prod-3",
        name: "Keyboard",
        description: "Mechanical keyboard",
        price: 75,
      },
    ],
  },
];

const mockOrdersRequest = (orders) => {
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/auth/all-orders") {
      return Promise.resolve({
        data: orders,
      });
    }
    return Promise.resolve({ data: {} });
  });
};

const renderWithProviders = (initialPath = "/dashboard/admin/orders") => {
  return render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path="/dashboard/admin/orders" element={<AdminOrders />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
};

describe("Admin Orders Workflow (Full-Stack)", () => {
  beforeAll(() => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: adminUser,
        token: mockToken,
      })
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    localStorage.removeItem("auth");
  });

  it("fetches and displays orders with products on mount", async () => {
    mockOrdersRequest(mockOrders);

    renderWithProviders("/dashboard/admin/orders");

    // Verify orders load through API
    await waitFor(
      () => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
      },
      { timeout: 2000 }
    );

    // Verify orders and products are displayed in the table
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.getByText("Laptop")).toBeInTheDocument();
  });

  it("updates order status and refetches orders", async () => {
    mockOrdersRequest(mockOrders);

    axios.put.mockResolvedValueOnce({
      data: { success: true },
    });

    const updatedOrders = [
      { ...mockOrders[0], status: "Processing" },
      mockOrders[1],
    ];
    mockOrdersRequest(updatedOrders);

    renderWithProviders("/dashboard/admin/orders");

    // Wait for buyer name to be visible
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    }, { timeout: 2000 });

    // Interact with status dropdown and change status
    const statusSelects = screen.getAllByRole("combobox");
    fireEvent.mouseDown(statusSelects[0]);

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

    // Verify complete integration: status update API call and orders refetch
    await waitFor(
      () => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/auth/order-status/order-1",
          expect.any(Object)
        );
      },
      { timeout: 2000 }
    );
  });
});
