// Gabriel Chang, A0276978Y
import React from "react";
import {
  CREATE_CATEGORY_URL,
  CREATE_PRODUCT_URL,
  PRODUCTS_URL,
  ORDERS_URL,
  USERS_URL,
} from "./AdminMenu";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminMenu from "./AdminMenu";

describe("AdminMenu Component", () => {
  test("Create Category link navigates to correct route", () => {
    const { getByText } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    const createCategoryLink = getByText("Create Category");
    expect(createCategoryLink.getAttribute("href")).toBe(CREATE_CATEGORY_URL);
  });

  test("Create Product link navigates to correct route", () => {
    const { getByText } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    const createProductLink = getByText("Create Product");
    expect(createProductLink.getAttribute("href")).toBe(CREATE_PRODUCT_URL);
  });

  test("Products link navigates to correct route", () => {
    const { getByText } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    const productsLink = getByText("Products");
    expect(productsLink.getAttribute("href")).toBe(PRODUCTS_URL);
  });

  test("Orders link navigates to correct route", () => {
    const { getByText } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    const ordersLink = getByText("Orders");
    expect(ordersLink.getAttribute("href")).toBe(ORDERS_URL);
  });

  test("Users link navigates to correct route", () => {
    const { getByText } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    const usersLink = getByText("Users");
    expect(usersLink.getAttribute("href")).toBe(USERS_URL);
  });
});
