// Gabriel Chang, A0276978Y
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import Login from "../../../src/pages/Auth/Login";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import toast from "react-hot-toast";
import userModel from "../../../../models/userModel.js";
import bcrypt from "bcrypt";
import { AuthProvider } from "../../../src/context/auth.js";
import * as authContext from "../../../src/context/auth.js";
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
            <MemoryRouter initialEntries={["/login"]}>
              <Routes>
                <Route path="/login" element={<Login />} />
              </Routes>
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    )
  );

describe("Login Integration Test", () => {
  const oldEnv = process.env;
  let setAuth;

  beforeAll(() => {
    setupAxiosMock();
  });

  beforeEach(() => {
    jest.spyOn(window.localStorage.__proto__, "setItem");
    jest.clearAllMocks();
    process.env = { ...oldEnv, JWT_SECRET: "testSecret" };
    setAuth = jest.fn();
    jest
      .spyOn(authContext, "useAuth")
      .mockReturnValue([{ user: null, token: "", otherInfo: "test" }, setAuth]);
  });

  afterAll(() => {
    process.env = oldEnv;
    jest.restoreAllMocks();
  });

  test("should allow a user to login with valid credentials", async () => {
    const validUser = {
      email: "testuser@example.com",
      password: "testPassword",
      phone: "1234567890",
      address: "123 StreetName",
      answer: "Soccer",
    };

    const hashedPassword = await bcrypt.hash(validUser.password, 10);
    userModel.findOne.mockResolvedValueOnce({
      ...validUser,
      password: hashedPassword,
    });

    const { getByText, getByPlaceholderText } = await renderPage();

    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: validUser.email },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Password"), {
      target: { value: validUser.password },
    });

    fireEvent.click(getByText("LOGIN"));

    const axiosRes = await axios.post.mock.results[0].value;
    const { data } = axiosRes;

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    expect(setAuth).toHaveBeenCalledWith({
      otherInfo: "test",
      user: data.user,
      token: data.token,
    });
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "auth",
      JSON.stringify({
        user: data.user,
        token: data.token,
      })
    );

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("should show an error when email does not exist", async () => {
    const user = {
      email: "testuser@example.com",
      password: "testPassword",
      phone: "1234567890",
      address: "123 StreetName",
      answer: "Soccer",
    };

    userModel.findOne.mockResolvedValueOnce(null);

    const { getByText, getByPlaceholderText } = await renderPage();

    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: user.email },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Password"), {
      target: { value: user.password },
    });

    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(setAuth).not.toHaveBeenCalled();
    expect(window.localStorage.setItem).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("should show an error when password is incorrect", async () => {
    const user = {
      email: "testuser@example.com",
      password: "testPassword",
      phone: "1234567890",
      address: "123 StreetName",
      answer: "Soccer",
    };

    const hashedPassword = await bcrypt.hash(user.password, 10);
    userModel.findOne.mockResolvedValueOnce({
      ...user,
      password: hashedPassword,
    });

    user.password = "wrongPassword";

    const { getByText, getByPlaceholderText } = await renderPage();

    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: user.email },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Password"), {
      target: { value: user.password },
    });

    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(setAuth).not.toHaveBeenCalled();
    expect(window.localStorage.setItem).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
