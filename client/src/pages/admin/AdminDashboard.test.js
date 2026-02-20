// Gabriel Chang, A0276978Y
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import Layout from "../../components/Layout";
import AdminMenu from "../../components/AdminMenu";

jest.mock("../../components/AdminMenu");

jest.mock("../../components/Layout", () => {
  return {
    __esModule: true,
    default: jest.fn(({ children }) => children),
  };
});

const mockAuth = {
  user: {
    name: "Admin User",
    email: "admin@gmail.com",
    phone: "1234567890",
  },
};

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [mockAuth, jest.fn()]),
}));

describe("AdminDashboard Component", () => {
  test("renders layout", () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(Layout).toBeCalled();
  });

  test("AdminMenu is rendered", () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(AdminMenu).toBeCalled();
  });

  test("displays admin user information", () => {
    const { getByText } = render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(getByText(/Admin Name : Admin User/i)).toBeInTheDocument();
    expect(getByText(/Admin Email : admin@gmail.com/i)).toBeInTheDocument();
    expect(getByText(/Admin Contact : 1234567890/i)).toBeInTheDocument();
  });
});
