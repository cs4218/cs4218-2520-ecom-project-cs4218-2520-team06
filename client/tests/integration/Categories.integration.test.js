// Hans Delano, A0273456X
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, act, waitFor } from "@testing-library/react";
import { afterEach, describe } from "node:test";
import Categories from "../../src/pages/Categories";
import { BrowserRouter as Router } from "react-router-dom";
import { setupAxiosMock } from "./utils";
import { AuthProvider } from "../../src/context/auth";
import { SearchProvider } from "../../src/context/search";
import { CartProvider } from "../../src/context/cart";

jest.mock("axios");
jest.mock("../../../models/userModel.js");
jest.mock("../../../models/orderModel.js");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockCategories = [
  { _id: "1", name: "Category 1", slug: "category-1" },
  { _id: "2", name: "Category 2", slug: "category-2" },
];

const renderCategoriesPage = async () => {
  await act(async () => {
    render(
      <Router>
        <AuthProvider>
          <SearchProvider>
            <CartProvider>
              <Categories />
            </CartProvider>
          </SearchProvider>
        </AuthProvider>
      </Router>
    );
  });
};

describe("Categories Page", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", async () => {
    setupAxiosMock({ categories: mockCategories });

    await renderCategoriesPage();

    expect(screen.getByText("All Categories")).toBeInTheDocument();
  });

  it("should show all categories", async () => {
    setupAxiosMock({ categories: mockCategories });

    await renderCategoriesPage();

    await waitFor(() => {
      mockCategories.forEach((category) => {
        expect(
          screen.getByTestId(`category-btn-${category.slug}`)
        ).toBeInTheDocument();
      });
    });
  });
});
