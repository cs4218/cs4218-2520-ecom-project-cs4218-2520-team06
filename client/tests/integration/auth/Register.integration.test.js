// Gabriel Chang, A0276978Y
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import Register from "../../../src/pages/Auth/Register.js";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { registerController } from "../../../../controllers/authController.js";
import toast from "react-hot-toast";
import userModel from "../../../../models/userModel.js";
import bcrypt from "bcrypt";
import { AuthProvider } from "../../../src/context/auth.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";
import { setupAxiosMock } from "../utils.js";
import { NON_ADMIN_USER_EMAIL } from "../../../../models/__mocks__/userModel.js";

jest.mock("../../../../models/userModel.js");
jest.mock("../../../../models/orderModel.js");

jest.mock("react-hot-toast");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("axios");

const renderPage = () =>
  render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/register"]}>
            <Routes>
              <Route path="/register" element={<Register />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );

describe("Register Integration Test", () => {
  beforeAll(() => {
    setupAxiosMock();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create a new user when email is not taken", async () => {
    const newUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "testPassword23#",
      phone: "1234567890",
      address: "123 StreetName",
      dob: "2026-01-01",
      answer: "Soccer",
    };

    const { getByText, getByPlaceholderText } = renderPage();

    fireEvent.change(getByPlaceholderText("Enter Your Name"), {
      target: { value: newUser.name },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: newUser.email },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Password"), {
      target: { value: newUser.password },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
      target: { value: newUser.phone },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Address"), {
      target: { value: newUser.address },
    });
    fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
      target: { value: newUser.answer },
    });

    fireEvent.click(getByText("REGISTER"));

    await waitFor(() => {
      expect(userModel).toHaveBeenCalled();
    });

    // Check correct user data saved
    const createdUser = userModel.mock.calls[0][0];
    expect(createdUser.name).toBe(newUser.name);
    expect(createdUser.email).toBe(newUser.email);
    expect(await bcrypt.compare(newUser.password, createdUser.password)).toBe(
      true
    );
    expect(createdUser.phone).toBe(newUser.phone);
    expect(createdUser.address).toBe(newUser.address);
    expect(createdUser.answer).toBe(newUser.answer);

    expect(userModel.mock.instances[0].save).toHaveBeenCalled();

    expect(toast.success).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("should show an error when email is already taken", async () => {
    const newUser = {
      name: "Test User",
      email: NON_ADMIN_USER_EMAIL,
      password: "testPassword23#",
      phone: "1234567890",
      address: "123 StreetName",
      dob: "2026-01-01",
      answer: "Soccer",
    };

    const { getByText, getByPlaceholderText } = renderPage();

    fireEvent.change(getByPlaceholderText("Enter Your Name"), {
      target: { value: newUser.name },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: newUser.email },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Password"), {
      target: { value: newUser.password },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
      target: { value: newUser.phone },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Address"), {
      target: { value: newUser.address },
    });
    fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
      target: { value: newUser.answer },
    });

    fireEvent.click(getByText("REGISTER"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
