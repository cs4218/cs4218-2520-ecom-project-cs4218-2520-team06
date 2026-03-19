//A0273312N, Jabez Tho
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Profile from "../../../src/pages/user/Profile.js";
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
          <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
            <Routes>
              <Route path="/dashboard/user/profile" element={<Profile />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );

// With real context providers modules
describe("Profile with provider contexts integration test", () => {
  const existingUser = {
    _id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    phone: "1234567890",
    address: "123 Test Street",
    role: 0,
  };
  const updatedUser = {
    ...existingUser,
    name: "Jane Doe",
    phone: "0987654321",
    address: "456 New Street",
  };
  const authState = {
    user: existingUser,
    token: "valid-token",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up local storage with initial auth state and empty cart for context providers
    localStorage.clear();
    localStorage.setItem("auth", JSON.stringify(authState));
    localStorage.setItem("cart", JSON.stringify([]));

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: {
            success: false,
          },
        });
      }

      return Promise.resolve({});
    });
  });

  it("should submit profile updates and refresh auth-backed profile state", async () => {
    // Arrange
    axios.put.mockResolvedValueOnce({
      data: {
        updatedUser,
      },
    });

    renderPage();

    // Act
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: updatedUser.name },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: updatedUser.phone },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: updatedUser.address },
    });

    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: updatedUser.name,
        email: existingUser.email,
        password: "",
        phone: updatedUser.phone,
        address: updatedUser.address,
      });
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue(
        updatedUser.name
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(
        updatedUser.phone
      );
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue(
        updatedUser.address
      );
    });
    await waitFor(() => {
      expect(screen.getByText(updatedUser.name)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Profile Updated Successfully"
      );
    });

    expect(JSON.parse(localStorage.getItem("auth"))).toEqual({
      user: updatedUser,
      token: authState.token,
    });
  });

  it("should keep the current profile state when the API returns an error", async () => {
    // Arrange
    axios.put.mockResolvedValueOnce({
      data: {
        error: "Unable to update profile",
      },
    });

    renderPage();

    // Act
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Temporary Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unable to update profile");
    });

    expect(JSON.parse(localStorage.getItem("auth"))).toEqual(authState);
    expect(screen.getByText(existingUser.name)).toBeInTheDocument();
  });
});
