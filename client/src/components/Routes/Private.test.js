// Gallen Ong, A0252614L
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
    // Arrange: Mock axios.get to resolve with a successful response
    axios.get.mockResolvedValueOnce({ data: { ok: true } });
    
    // Act: Render the PrivateRoute component wrapped in MemoryRouter and Routes
    const { findByText } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route index element={<div>Outlet Element</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    
    // Assert: Check if the Outlet element is rendered
    expect(await findByText("Outlet Element")).toBeInTheDocument();
  });

  it("renders Spinner component", async () => {
    // Arrange: Mock axios.get to resolve with a successful response
    axios.get.mockResolvedValueOnce({ data: { ok: false } });
    
    // Act: Render the PrivateRoute component wrapped in MemoryRouter and Routes
    const { findByText } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route index element={<div>Spinner Element</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    
    // Assert: Check if the Spinner element is rendered
    expect(await findByText(/redirecting to you in/i)).toBeInTheDocument();
  });

  it("renders Spinner when auth.token is falsy", async () => {
    // Arrange: Set mockAuthValue to have a falsy token
    mockAuthValue = { token: false };
    
    // Act: Render the PrivateRoute component wrapped in MemoryRouter and Routes
    const { findByText } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route index element={<div>Spinner Element</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    
    // Assert: Check if the Spinner element is rendered and axios.get is not called
    expect(await findByText(/redirecting to you in/i)).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });
});
