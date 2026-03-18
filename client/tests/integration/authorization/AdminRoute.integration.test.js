// Gallen Ong, A0252614L
// Integration tests for AdminRoute component - admin authorization
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../../src/context/auth.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";
import axios from "axios";
import AdminRoute from "../../../src/components/Routes/AdminRoute.js";
import AdminDashboard from "../../../src/pages/admin/AdminDashboard.js";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../../src/components/Header", () => () => <div>Header</div>);
jest.mock("../../../src/components/Footer", () => () => <div>Footer</div>);
jest.mock("../../../src/components/Spinner", () => () => (
  <div data-testid="spinner-loading">Spinner Loading...</div>
));

const mockAdmin = {
  name: "Admin User",
  email: "admin@example.com",
  phone: "9876543210",
  role: 1,
};
const mockRegularUser = {
  name: "Regular User",
  email: "user@example.com",
  phone: "1234567890",
  role: 0,
};
const mockAdminToken = "mock-admin-token-12345";
const mockUserToken = "mock-user-token-67890";

const renderWithProviders = (initialPath = "/dashboard/admin") => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <Routes>
              <Route path="/dashboard" element={<AdminRoute />}>
                <Route path="admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("AdminRoute - Admin Authorization Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders AdminDashboard with real Layout and AdminMenu when admin is authorized", async () => {
    // Full admin component tree with authorization
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: mockAdmin,
        token: mockAdminToken,
      })
    );
    axios.get.mockResolvedValue({ data: { ok: true } });

    renderWithProviders("/dashboard/admin");

    // Verify admin-auth API call
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
    }, { timeout: 2000 });

    // Verify AdminDashboard renders with real components and admin data
    await waitFor(
      () => {
        expect(screen.getByText("Header")).toBeInTheDocument();
        expect(screen.getByText(/Admin Name/)).toBeInTheDocument();
        expect(screen.getByText(/Admin User/)).toBeInTheDocument();
        expect(screen.getByText(/admin@example.com/)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("blocks access when regular user tries to access admin dashboard", async () => {
    // Non-admin user denied access
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: mockRegularUser,
        token: mockUserToken,
      })
    );
    axios.get.mockResolvedValue({ data: { ok: false } });

    renderWithProviders("/dashboard/admin");

    // Verify Spinner is displayed (access denied)
    await waitFor(
      () => {
        expect(screen.getByTestId("spinner-loading")).toBeInTheDocument();
        expect(screen.queryByText(/Admin User/)).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
  });

  it("loads persisted admin auth from localStorage and validates access end-to-end", async () => {
    // AuthProvider loads storage, AdminRoute validates
    const adminAuthState = {
      user: mockAdmin,
      token: mockAdminToken,
    };
    localStorage.setItem("auth", JSON.stringify(adminAuthState));
    axios.get.mockResolvedValue({ data: { ok: true } });

    renderWithProviders("/dashboard/admin");

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
    }, { timeout: 2000 });

    // Verify AdminDashboard renders with persisted admin data from storage
    await waitFor(
      () => {
        expect(screen.getByText(/Admin User/)).toBeInTheDocument();
        expect(screen.getByText(/9876543210/)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
