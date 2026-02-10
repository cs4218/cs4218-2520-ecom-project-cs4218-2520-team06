import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Dashboard from "./Dashboard";

jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [
    {
      user: {
        name: "John Doe",
        email: "john.doe@example.com",
        address: "123 Main St",
      },
    },
    jest.fn(),
  ]),
}));

describe("Dashboard Component", () => {
  it("renders user information correctly", () => {
    const { getByText } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(getByText("John Doe")).toBeInTheDocument();
    expect(getByText("john.doe@example.com")).toBeInTheDocument();
    expect(getByText("123 Main St")).toBeInTheDocument();
  });

  it("renders the Layout component with correct title", () => {
    const { getByText } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(getByText("Dashboard - Ecommerce App")).toBeInTheDocument();
  });

  it("renders the UserMenu component", () => {
    const { getByText } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(getByText("Profile")).toBeInTheDocument();
  });
});
