// Gallen Ong, A0252614L
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminOrders from "./AdminOrders";

// Mock axios
jest.mock("axios");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [{ token: "valid-token" }, jest.fn()]), // Mock useAuth hook to return a valid token and a mock function for setAuth
}));

jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
));

jest.mock("antd", () => {
  const Select = ({ children, defaultValue, onChange }) => (
    <select
      data-testid="status-select"
      value={defaultValue}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
  Select.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  return { Select };
});

describe("AdminOrders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders orders correctly", async () => {
    // Arrange: Set up mock orders data and API response
    const mockOrders = [
      {
        _id: "order-1",
        status: "Processing",
        buyer: { name: "Alice" },
        createAt: "2024-01-01T00:00:00.000Z",
        payment: { success: true },
        products: [
          {
            _id: "prod-1",
            name: "Product A",
            description: "Product A description",
            price: 100,
          },
        ],
      },
      {
        _id: "order-2",
        status: "Processing",
        buyer: { name: "Bob" },
        createAt: "2024-01-02T00:00:00.000Z",
        payment: { success: false },
        products: [
          {
            _id: "prod-2",
            name: "Product B",
            description: "Product B description",
            price: 200,
          },
        ],
      },
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    // Act: Render the AdminOrders component
    let renderResult;
    await act(async () => {
      renderResult = render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<AdminOrders />} />
          </Routes>
        </MemoryRouter>
      );
    });
    const { findByText } = renderResult;

    // Assert: Verify that products from orders are displayed
    expect(await findByText("Product A")).toBeInTheDocument();
    expect(await findByText("Product B")).toBeInTheDocument();
  });

  it("handles when order status changes", async () => {
    // Arrange: Set up mock orders and API responses
    const mockOrders = [
      {
        _id: "order-1",
        status: "Processing",
        buyer: { name: "Alice" },
        createAt: "2024-01-01T00:00:00.000Z",
        payment: { success: true },
        products: [
          {
            _id: "prod-1",
            name: "Product A",
            description: "Product A description",
            price: 100,
          },
        ],
      },
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    
    // Act : Render the AdminOrders component and change order status
    let renderResult;
    await act(async () => {
      renderResult = render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<AdminOrders />} />
          </Routes>
        </MemoryRouter>
      );
    });
    const { findByText, getByTestId } = renderResult;
    
    // Assert: Verify initial order status is displayed
    expect(await findByText("Product A")).toBeInTheDocument();

    // Act: Change the order status via the select dropdown
    const statusSelect = getByTestId("status-select");
    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: "Shipped" } });
    });

    // Assert: Verify PUT request was made with correct data and orders were refetched
    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/order-status/order-1",
        { status: "Shipped" }
      )
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  });

  it("does not fetch orders when auth token is missing", async () => {
    // Arrange: Mock useAuth to return an empty token
    const { useAuth } = require("../../context/auth");
    useAuth.mockImplementationOnce(() => [{ token: "" }, jest.fn()]);

    // Act: Render the AdminOrders component without authentication
    await act(async () => {
      render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<AdminOrders />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Assert: Verify no API call was made
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("logs error when fetching orders fails", async () => {
    // Arrange: Set up API to reject with an error and spy on console.log
    const error = new Error("fetch failed");
    axios.get.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act: Render the AdminOrders component
    await act(async () => {
      render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<AdminOrders />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Assert: Verify error was logged to console
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(error));
  });

  it("logs error when status update fails", async () => {
    // Arrange: Set up mock orders, failed PUT request, and spy on console.log
    const mockOrders = [
      {
        _id: "order-1",
        status: "Processing",
        buyer: { name: "Alice" },
        createAt: "2024-01-01T00:00:00.000Z",
        payment: { success: true },
        products: [
          {
            _id: "prod-1",
            name: "Product A",
            description: "Product A description",
            price: 100,
          },
        ],
      },
    ];
    const error = new Error("update failed");
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    
    // Act: Render the AdminOrders component and attempt to change order status
    let renderResult;
    await act(async () => {
      renderResult = render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<AdminOrders />} />
          </Routes>
        </MemoryRouter>
      );
    });
    const { findByText, getByTestId } = renderResult;
    
    // Assert: Verify initial order status is displayed
    expect(await findByText("Product A")).toBeInTheDocument();

    // Act: Attempt to change order status
    const statusSelect = getByTestId("status-select");
    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: "Shipped" } });
    });

    // Assert: Verify error was logged to console
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(error));
  });
});
