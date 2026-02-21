// Gallen Ong, A0252614L
import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Products from "./Products";

// Mock axios and toast
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu</div>);
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("Products Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders products correctly", async () => {
    // Arrange: Set up mock products data and API response
    const mockProducts = [
      {
        _id: "prod-1",
        name: "Product A",
        description: "Product A description",
        price: 100,
        slug: "product-a",
      },
      {
        _id: "prod-2",
        name: "Product B",
        description: "Product B description",
        price: 200,
        slug: "product-b",
      },
    ];
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    // Act: Render the Products component
    let renderResult;
    await act(async () => {
      renderResult = render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    // Assert: Verify all products are displayed with correct links
    const { findByText, getByText } = renderResult;
    for (const product of mockProducts) {
      expect(await findByText(product.name)).toBeInTheDocument();
      expect(await findByText(product.description)).toBeInTheDocument();
      expect(getByText(product.name).closest("a")).toHaveAttribute(
        "href",
        `/dashboard/admin/product/${product.slug}`
      );
    }
  });

  it("handles API errors gracefully", async () => {
    // Arrange: Set up API to reject with an error and spy on console.log
    const error = new Error("API Error");
    axios.get.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act: Render the Products component
    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    // Assert: Verify error was logged and error toast was shown
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(error));
    expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
  });
});
