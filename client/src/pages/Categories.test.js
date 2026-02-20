// Hans Delano, A0273456X
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe } from "node:test";
import Categories from "./Categories";
import axios from "axios";
import { BrowserRouter as Router } from "react-router-dom";

jest.mock("axios");

jest.mock("../components/Layout.js", () => ({ children, title }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
));

describe("Categories Page", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", async () => {
    const mockCategories = [
      { _id: "1", name: "Electronics", slug: "electronics" },
      { _id: "2", name: "Books", slug: "books" },
    ];

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: {
            success: true,
            category: mockCategories,
          },
        });
      }
    });

    render(
      <Router>
        <Categories />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText("All Categories")).toBeInTheDocument();
    });
  });

  it("should show all categories", async () => {
    const mockCategories = [
      { _id: "1", name: "Electronics", slug: "electronics" },
      { _id: "2", name: "Books", slug: "books" },
    ];

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: {
            success: true,
            category: mockCategories,
          },
        });
      }
    });

    render(
      <Router>
        <Categories />
      </Router>
    );

    await waitFor(() => {
      mockCategories.forEach((category) => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
      });
    });
  });
});
