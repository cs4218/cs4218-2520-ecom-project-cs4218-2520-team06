// Jabez Tho, A0273312N
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Users from "./Users";

// Mock AdminMenu component
jest.mock("../../components/AdminMenu", () => {
  return function MockAdminMenu() {
    return <div data-testid="admin-menu">Admin Menu</div>;
  };
});

// Mock Layout component
jest.mock("../../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout">
        <div data-testid="layout-title">{title}</div>
        {children}
      </div>
    );
  };
});

describe("Users Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render Layout component", () => {
    // Act: Render the Users component
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    // Assert: Verify Layout component is rendered
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("should render AdminMenu component", () => {
    // Act: Render the Users component
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    // Assert: Verify AdminMenu component is rendered
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  });
});
