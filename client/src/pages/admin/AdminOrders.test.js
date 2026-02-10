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

    expect(await findByText("Product A")).toBeInTheDocument();
    expect(await findByText("Product B")).toBeInTheDocument();
  });

  it("handles when order status changes", async () => {
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

    expect(await findByText("Product A")).toBeInTheDocument();

    const statusSelect = getByTestId("status-select");
    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: "Shipped" } });
    });

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/order-status/order-1",
        { status: "Shipped" }
      )
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  });

  it("does not fetch orders when auth token is missing", async () => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockImplementationOnce(() => [{ token: "" }, jest.fn()]);

    await act(async () => {
      render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<AdminOrders />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  it("logs error when fetching orders fails", async () => {
    const error = new Error("fetch failed");
    axios.get.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await act(async () => {
      render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<AdminOrders />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(error));
  });

  it("logs error when status update fails", async () => {
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

    expect(await findByText("Product A")).toBeInTheDocument();

    const statusSelect = getByTestId("status-select");
    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: "Shipped" } });
    });

    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(error));
  });
});
