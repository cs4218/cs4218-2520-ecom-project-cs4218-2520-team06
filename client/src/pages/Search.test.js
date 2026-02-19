import React from "react";
import { render, screen } from "@testing-library/react";
import Search from "./Search";
import { useSearch } from "../context/search";

jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

jest.mock("../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  );
});

describe("Search page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows empty state when results list is empty", () => {
    useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);

    render(<Search />);

    expect(screen.getByText("No Products Found")).toBeInTheDocument();
    expect(screen.queryByText(/Found\s+\d+/i)).not.toBeInTheDocument();
  });

  test("renders count and product card when results exist", () => {
    const product = {
      _id: "mockmock",
      name: "Test Product",
      description: "This is a testing description for the product.",
      price: 4218,
    };
    useSearch.mockReturnValue([
      { keyword: "test", results: [product] },
      jest.fn(),
    ]);

    render(<Search />);

    expect(screen.getByText("Found 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText(/\$\s*4218/)).toBeInTheDocument();
    expect(
      screen.getByText(`${product.description.substring(0, 30)}...`)
    ).toBeInTheDocument();
    expect(screen.getByAltText("Test Product")).toBeInTheDocument();
  });

  test("renders multiple products correctly", () => {
    const products = [
      {
        _id: "1",
        name: "Product One",
        description: "Description for product one.",
        price: 100,
      },
      {
        _id: "2",
        name: "Product Two",
        description: "Description for product two.",
        price: 200,
      },
    ];
    useSearch.mockReturnValue([
      { keyword: "product", results: products },
      jest.fn(),
    ]);

    render(<Search />);

    expect(screen.getByText("Found 2")).toBeInTheDocument();
    products.forEach((p) => {
      expect(screen.getByText(p.name)).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(`\\$\\s*${p.price}`))
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${p.description.substring(0, 30)}...`)
      ).toBeInTheDocument();
      expect(screen.getByAltText(p.name)).toBeInTheDocument();
    });
  });
});
