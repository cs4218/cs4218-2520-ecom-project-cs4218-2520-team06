// Gallen Ong, A0252614L
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import UserMenu from "./UserMenu";

describe("UserMenu Component", () => {
  it("renders UserMenu with Profile and Orders links", () => {
    // Arrange: No specific arrangement needed
    // Act: Render the UserMenu component wrapped in MemoryRouter
    const { getByText } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    // Assert: Check if the Dashboard, Profile, and Orders links are rendered
    expect(getByText("Dashboard")).toBeInTheDocument();
    expect(getByText("Profile")).toBeInTheDocument();
    expect(getByText("Orders")).toBeInTheDocument();
  });

  it("Profile link navigates to /dashboard/user/profile", () => {
    // Arrange: No specific arrangement needed
    // Act: Render the UserMenu component wrapped in MemoryRouter
    const { getByText } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );
    
    // Assert: Check if the Profile link has the correct href attribute
    const profileLink = getByText("Profile");
    expect(profileLink.getAttribute("href")).toBe("/dashboard/user/profile");
  });

  it("Orders link navigates to /dashboard/user/orders", () => {
    // Arrange: No specific arrangement needed
    // Act: Render the UserMenu component wrapped in MemoryRouter
    const { getByText } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );
    
    // Assert: Check if the Orders link has the correct href attribute
    const ordersLink = getByText("Orders");
    expect(ordersLink.getAttribute("href")).toBe("/dashboard/user/orders");
  });
});
