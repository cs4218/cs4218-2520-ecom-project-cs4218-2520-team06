import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import ForgetPassword from "../../../src/pages/Auth/ForgetPassword.js";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import toast from "react-hot-toast";
import userModel from "../../../../models/userModel.js";
import bcrypt from "bcrypt";
import { AuthProvider } from "../../../src/context/auth.js";
import { setupAxiosMock } from "../utils.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";

jest.mock("../../../../models/userModel.js");
jest.mock("../../../../models/orderModel.js");

jest.mock("react-hot-toast");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("axios");

const renderPage = async () =>
  await act(async () =>
    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter initialEntries={["/forgot-password"]}>
              <Routes>
                <Route path="/forgot-password" element={<ForgetPassword />} />
              </Routes>
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    )
  );

describe("Forget Password Integration Test", () => {
  beforeAll(() => {
    setupAxiosMock();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should allow password reset with valid email and answer", async () => {
    const validUser = {
      email: "testuser@example.com",
      password: "testPassword",
      phone: "1234567890",
      address: "123 StreetName",
      answer: "Soccer",
    };
    const newPassword = "newTestPassword";

    const hashedPassword = await bcrypt.hash(validUser.password, 10);
    userModel.findOne.mockResolvedValueOnce({
      ...validUser,
      _id: "userId123",
      password: hashedPassword,
    });

    const { getByText, getByPlaceholderText } = await renderPage();

    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: validUser.email },
    });
    fireEvent.change(getByPlaceholderText("Enter Your New Password"), {
      target: { value: newPassword },
    });
    fireEvent.change(getByPlaceholderText("What is your favorite sport?"), {
      target: { value: validUser.answer },
    });

    fireEvent.click(getByText("RESET PASSWORD"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    const updatedId = userModel.findByIdAndUpdate.mock.calls[0][0];
    const updatedData = userModel.findByIdAndUpdate.mock.calls[0][1];

    expect(updatedId).toBe("userId123");
    expect(bcrypt.compareSync(newPassword, updatedData.password)).toBe(true);

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("should show an error when email or answer is incorrect", async () => {
    const user = {
      email: "testuser@example.com",
      password: "testPassword",
      phone: "1234567890",
      address: "123 StreetName",
      answer: "Soccer",
    };
    const newPassword = "newTestPassword";

    userModel.findOne.mockResolvedValueOnce(null);

    const { getByText, getByPlaceholderText } = await renderPage();

    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: user.email },
    });
    fireEvent.change(getByPlaceholderText("Enter Your New Password"), {
      target: { value: newPassword },
    });
    fireEvent.change(getByPlaceholderText("What is your favorite sport?"), {
      target: { value: user.answer },
    });

    fireEvent.click(getByText("RESET PASSWORD"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();

    expect(mockNavigate).not.toHaveBeenCalledWith("/login");
  });
});
