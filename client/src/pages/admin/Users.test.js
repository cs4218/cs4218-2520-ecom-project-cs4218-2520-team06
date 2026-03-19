// Jabez Tho, A0273312N
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Users from "./Users";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [{ token: "valid-token" }, jest.fn()]),
}));

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

  it("should render Layout component", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, users: [] },
    });

    // Act: Render the Users component
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    // Assert: Verify Layout component is rendered
    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });
  });

  it("should render AdminMenu component", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, users: [] },
    });

    // Act: Render the Users component
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    // Assert: Verify AdminMenu component is rendered
    await waitFor(() => {
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });
  });

  it("should fetch and render users in table", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        users: [
          {
            _id: "user-1",
            name: "Alice",
            email: "alice@example.com",
            phone: "12345678",
            role: 0,
            createdAt: "2026-01-01T12:00:00.000Z",
          },
          {
            _id: "admin-1",
            name: "Bob",
            email: "bob@example.com",
            phone: "87654321",
            role: 1,
            createdAt: "2026-01-02T12:00:00.000Z",
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-users");
  });

  it("should show empty state when no users are returned", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, users: [] },
    });

    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("should log and toast error when fetch fails", async () => {
    const error = new Error("fetch failed");
    axios.get.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(error));
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong while fetching users"
    );
    consoleSpy.mockRestore();
  });

  it("should not fetch users when auth token is missing", async () => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockImplementationOnce(() => [{ token: "" }, jest.fn()]);

    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
