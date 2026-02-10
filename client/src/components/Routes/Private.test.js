import React from "react";
import { render } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import PrivateRoute from "./Private";

// Mock axios
jest.mock("axios");

let mockAuthValue = { token: true };
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [mockAuthValue, jest.fn()]), // Mock useAuth hook to return a token and a mock function for setAuth
}));

describe("PrivateRoute Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthValue = { token: true };
  });

  it("renders Outlet component", async () => {
    axios.get.mockResolvedValueOnce({ data: { ok: true } });
    const { findByText } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route index element={<div>Outlet Element</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(await findByText("Outlet Element")).toBeInTheDocument();
  });

  it("renders Spinner component", async () => {
    axios.get.mockResolvedValueOnce({ data: { ok: false } });
    const { findByText } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route index element={<div>Spinner Element</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(await findByText(/redirecting to you in/i)).toBeInTheDocument();
  });

  it("renders Spinner when auth.token is falsy", async () => {
    mockAuthValue = { token: false };
    const { findByText } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route index element={<div>Spinner Element</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(await findByText(/redirecting to you in/i)).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });
});
