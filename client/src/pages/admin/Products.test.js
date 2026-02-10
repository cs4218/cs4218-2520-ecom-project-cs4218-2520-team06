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

    let renderResult;
    await act(async () => {
      renderResult = render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

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
    const error = new Error("API Error");
    axios.get.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(error));
    expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
  });
});
