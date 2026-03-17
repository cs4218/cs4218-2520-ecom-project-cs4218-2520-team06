// Gabriel Chang, A0276978Y
import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../../src/context/auth.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";
import AdminDashboard from "../../../src/pages/admin/AdminDashboard.js";
import { setupAxiosMock } from "../utils.js";

jest.mock("../../../../models/userModel.js");
jest.mock("../../../../models/orderModel.js");
jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const renderPage = async () =>
  await act(async () =>
    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter initialEntries={["/dashboard/admin"]}>
              <Routes>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
              </Routes>
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    )
  );

describe("AdminDashboard Integration Test", () => {
  const adminUser = {
    name: "Admin User",
    email: "admin@gmail.com",
    phone: "1234567890",
  };
  const mockToken = "mock-token";

  beforeAll(() => {
    setupAxiosMock();
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: adminUser,
        token: mockToken,
      })
    );
  });

  test("renders admin information correctly", async () => {
    const { getByText } = await renderPage();

    await waitFor(() => {
      expect(getByText(`Admin Name : ${adminUser.name}`)).toBeInTheDocument();
      expect(getByText(`Admin Email : ${adminUser.email}`)).toBeInTheDocument();
      expect(
        getByText(`Admin Contact : ${adminUser.phone}`)
      ).toBeInTheDocument();
    });
  });

  test("renders admin menu", async () => {
    const { getByText } = await renderPage();

    await waitFor(() => {
      expect(getByText("Admin Panel")).toBeInTheDocument();
      expect(getByText("Create Category")).toBeInTheDocument();
      expect(getByText("Create Product")).toBeInTheDocument();
      expect(getByText("Products")).toBeInTheDocument();
      expect(getByText("Orders")).toBeInTheDocument();
      expect(getByText("Users")).toBeInTheDocument();
    });
  });
});
