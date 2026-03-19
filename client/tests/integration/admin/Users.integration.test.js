// A0273312N, Jabez Tho
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Users from "../../../src/pages/admin/Users.js";
import { AuthProvider } from "../../../src/context/auth.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
  Toaster: () => <div data-testid="toaster" />,
}));

const renderPage = () =>
  render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
            <Routes>
              <Route path="/dashboard/admin/users" element={<Users />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );

describe("Users page with provider contexts integration test", () => {
  const adminAuthState = {
    user: {
      _id: "admin-1",
      name: "Admin User",
      email: "admin@test.com",
      phone: "1111111111",
      address: "Admin Street",
      role: 1,
    },
    token: "valid-admin-token",
  };

  const usersResponse = [
    {
      _id: "user-1",
      name: "Alice Doe",
      email: "alice@example.com",
      phone: "1234567890",
      role: 0,
      createdAt: "2026-01-01T12:00:00.000Z",
    },
    {
      _id: "admin-1",
      name: "Bob Admin",
      email: "bob@example.com",
      phone: "0987654321",
      role: 1,
      createdAt: "2026-01-02T12:00:00.000Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("auth", JSON.stringify(adminAuthState));
    localStorage.setItem("cart", JSON.stringify([]));

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/all-users") {
        return Promise.resolve({
          data: {
            success: true,
            users: usersResponse,
          },
        });
      }

      return Promise.resolve({});
    });
  });

  it("should render fetched users in the table with role labels", async () => {
    // Arrange
    renderPage();

    // Act
    const heading = await screen.findByRole("heading", { name: /all users/i });

    // Assert
    expect(heading).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Alice Doe")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Bob Admin")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("User")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-users");
  });

  it("should show empty-state message when API returns no users", async () => {
    // Arrange
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/all-users") {
        return Promise.resolve({
          data: {
            success: true,
            users: [],
          },
        });
      }

      return Promise.resolve({});
    });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("No users found.")).toBeInTheDocument();
    });
  });

  it("should show error toast when fetching users fails", async () => {
    // Arrange
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/all-users") {
        return Promise.reject(new Error("network error"));
      }

      return Promise.resolve({});
    });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong while fetching users"
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /all users/i })
      ).toBeInTheDocument();
    });

    logSpy.mockRestore();
  });
});
