import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import UserMenu from "./UserMenu";

describe("UserMenu Component", () => {
  it("renders UserMenu with Profile and Orders links", () => {
    const { getByText } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(getByText("Dashboard")).toBeInTheDocument();
    expect(getByText("Profile")).toBeInTheDocument();
    expect(getByText("Orders")).toBeInTheDocument();
  });

  it("Profile link navigates to /dashboard/user/profile", () => {
    const { getByText } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = getByText("Profile");
    expect(profileLink.getAttribute("href")).toBe("/dashboard/user/profile");
  });

  it("Orders link navigates to /dashboard/user/orders", () => {
    const { getByText } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const ordersLink = getByText("Orders");
    expect(ordersLink.getAttribute("href")).toBe("/dashboard/user/orders");
  });
});
