// Gallen Ong, A0252614L
// Integration tests for PrivateRoute component - user authorization
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../../src/context/auth.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";
import axios from "axios";
import PrivateRoute from "../../../src/components/Routes/Private.js";
import Dashboard from "../../../src/pages/user/Dashboard.js";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../../src/components/Header", () => () => <div>Header</div>);
jest.mock("../../../src/components/Footer", () => () => <div>Footer</div>);
jest.mock("../../../src/components/Spinner", () => () => (
  <div data-testid="spinner-loading">Spinner Loading...</div>
));

const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  address: "123 Main St",
  phone: "1234567890",
  role: 0,
};
const mockToken = "mock-user-token-12345";

const renderWithProviders = (initialPath = "/dashboard/user") => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <Routes>
              <Route path="/dashboard" element={<PrivateRoute />}>
                <Route path="user" element={<Dashboard />} />
              </Route>
            </Routes>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("PrivateRoute - User Authorization Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders Dashboard with real Layout and UserMenu when user is authorized", async () => {
    // Essential integration path: Full component tree with authorization
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: mockUser,
        token: mockToken,
      })
    );
    axios.get.mockResolvedValue({ data: { ok: true } });

    renderWithProviders("/dashboard/user");

    // Verify authorization API call
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    }, { timeout: 2000 });

    // Verify Dashboard renders with real components and user data
    await waitFor(
      () => {
        expect(screen.getByText("Header")).toBeInTheDocument(); // Real Header mock
        expect(screen.getByText(/John Doe/)).toBeInTheDocument(); // User data rendered
        expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("shows Spinner when user authorization fails", async () => {
    // Essential integration path: Unauthorized user blocked from dashboard
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: mockUser,
        token: mockToken,
      })
    );
    axios.get.mockResolvedValue({ data: { ok: false } });

    renderWithProviders("/dashboard/user");

    // Verify Spinner is displayed (access denied)
    await waitFor(
      () => {
        expect(screen.getByTestId("spinner-loading")).toBeInTheDocument();
        expect(screen.queryByText(/John Doe/)).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("loads persisted auth from localStorage and validates access end-to-end", async () => {
    // Essential integration path: AuthProvider loads storage and PrivateRoute validates
    const authState = {
      user: mockUser,
      token: mockToken,
    };
    localStorage.setItem("auth", JSON.stringify(authState));
    axios.get.mockResolvedValue({ data: { ok: true } });

    renderWithProviders("/dashboard/user");

    // Verify authorization check was triggered
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    }, { timeout: 2000 });

    // Verify Dashboard renders with persisted user data from storage
    await waitFor(
      () => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
