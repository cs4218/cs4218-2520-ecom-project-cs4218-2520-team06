// Kok Bo Chang, A0273542E
import React from "react";
import { act, render, getByRole, getByText, queryByText, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "./Header";
import useCategory from "../hooks/useCategory";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart"

const ROLE_ADMIN = 1;
const ROLE_USER = 0;

jest.mock("axios");
jest.mock("../context/auth");
jest.mock("../hooks/useCategory");
jest.mock("../context/cart");
jest.mock("../context/search", () => ({
    useSearch: jest.fn(() => [{ keyword: "", results: [] }, jest.fn()]),
}));
jest.mock("react-hot-toast", () => ({
    success: jest.fn(),
}));

// Kok Bo Chang, A0273542E
describe("Header component", () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();

        useAuth.mockReturnValue([{ token: true }, jest.fn()]);
        useCart.mockReturnValue([[], jest.fn()]);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    // Kok Bo Chang, A0273542E
    test("Brand icon should navigate to the correct route", () => {
        // Empty arrange

        // Act
        const { getByText } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Assert
        expect(getByText(/Virtual Vault/)).toBeInTheDocument();

        const linkToContactPage = getByText(/Virtual Vault/);
        expect(linkToContactPage.getAttribute("href")).toBe("/");
    });

    // Kok Bo Chang, A0273542E
    test("Search bar should exist", () => {
        // Empty arrange

        // Act
        const { container } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Assert
        expect(getByRole(container, 'button', { name: /Search/i })).toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("Search button should exist", () => {
        // Empty arrange

        // Act
        const { container } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Assert
        expect(getByText(container, "Search")).toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("Home button should navigate to the correct route", () => {
        // Empty arrange

        // Act
        const { getByText } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Assert
        expect(getByText("Home")).toBeInTheDocument();

        const linkToContactPage = getByText("Home");
        expect(linkToContactPage.getAttribute("href")).toBe("/");
    });

    // Kok Bo Chang, A0273542E
    test("Dropdown menu should contain 'All Categories' even when no categories exist", () => {
        // Arrange
        useCategory.mockReturnValue([]);

        // Act
        const { container } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Assert
        expect(getByText(container, "All Categories").getAttribute("href"))
            .toBe("/categories");
    });

    // Kok Bo Chang, A0273542E
    test("Dropdown menu for categories should contain all categories that are returned from useCategory, plus the default", () => {
        // Arrange
        const mockCategories = [
            { name: "name 1", slug: "slug_one" },
            { name: "name 2", slug: "slug_two" }
        ];
        useCategory.mockReturnValue(mockCategories);

        // Act
        const { container } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Assert
        expect(getByText(container, "All Categories").getAttribute("href"))
            .toBe("/categories");

        for (var i = 0; i < mockCategories.length; i++) {
            const category = mockCategories[i];
            expect(getByText(container, category.name).getAttribute("href"))
                .toBe(`/category/${category.slug}`);
        }
    });

    // Kok Bo Chang, A0273542E
    test("if the user is not authenticated, the login and register buttons should be visible", () => {
        // Arrange
        useAuth.mockReturnValue([{ user: null }, jest.fn()]);

        // Act
        const { container } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Assert
        const register = getByText(container, "Register");
        expect(register).toBeInTheDocument();
        expect(register.getAttribute("href")).toBe("/register");

        const login = getByText(container, "Login")
        expect(login).toBeInTheDocument();
        expect(login.getAttribute("href")).toBe("/login");

        expect(queryByText(container, "Dashboard")).not.toBeInTheDocument();
        expect(queryByText(container, "Logout")).not.toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("if the user is authenticated as a user, they should have access to the user dashboard and the logout button", () => {
        // Arrange
        const mockName = "dummy_name";
        useAuth.mockReturnValue([
            { user: { name: mockName, role: ROLE_USER }},
            jest.fn()
        ]);

        // Act
        const { container } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Assert
        expect(getByText(container, mockName)).toBeInTheDocument();

        const dashboard = getByText(container, "Dashboard");
        expect(dashboard).toBeInTheDocument();
        expect(dashboard.getAttribute("href")).toBe(`/dashboard/user`)

        const logout = getByText(container, "Logout")
        expect(logout).toBeInTheDocument();
        expect(logout.getAttribute("href")).toBe("/login");        

        expect(queryByText(container, "Login")).not.toBeInTheDocument();
        expect(queryByText(container, "Register")).not.toBeInTheDocument()
    });

    // Kok Bo Chang, A0273542E
    test("if the user is authenticated as a admin, they should have access to the admin dashboard and the logout button", () => {
        // Arrange
        const mockName = "dummy_name";
        useAuth.mockReturnValue([
            { user: { name: mockName, role: ROLE_ADMIN }},
            jest.fn()
        ]);

        // Act
        const { container } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Assert
        expect(getByText(container, mockName)).toBeInTheDocument();

        const dashboard = getByText(container, "Dashboard");
        expect(dashboard).toBeInTheDocument();
        expect(dashboard.getAttribute("href")).toBe(`/dashboard/admin`)

        const logout = getByText(container, "Logout")
        expect(logout).toBeInTheDocument();
        expect(logout.getAttribute("href")).toBe("/login");        

        expect(queryByText(container, "Login")).not.toBeInTheDocument();
        expect(queryByText(container, "Register")).not.toBeInTheDocument()
    });

    // Kok Bo Chang, A0273542E
    test("logging out clears auth state, removes localStorage, and shows toast", async () => {
        // Arrange
        const setAuthMock = jest.fn();
        useAuth.mockReturnValue([
            { user: { name: "dummy_name", role: ROLE_USER }, token: "token" },
            setAuthMock,
        ]);

        const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");

        const { container } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Act
        const logout = getByText(container, "Logout");
        act(() => {
            logout.click();
        });

        // Assert
        expect(setAuthMock).toHaveBeenCalledWith({
            user: null,
            token: "",
        });

        expect(removeItemSpy).toHaveBeenCalledWith("auth");

        expect(toast.success).toHaveBeenCalledWith("Logout Successful");
    });

    // Kok Bo Chang, A0273542E
    test("Cart button should exist with empty cart", () => {
        // Empty arrange

        // Act
        const { container } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Assert
        const cart = getByText(container, "Cart");
        expect(cart).toBeInTheDocument();
        expect(cart.getAttribute("href")).toBe("/cart");
    });

    // Kok Bo Chang, A0273542E
    test("Cart badge should show the correct count when cart is not empty", () => {
        // Arrange
        const cartItems = [{ id: 1 }, { id: 2 }, { id: 3 }];
        useCart.mockReturnValue([cartItems, jest.fn()]);

        // Act
        const { container } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Find the Cart link
        const cartLink = within(container).getByRole("link", { name: /cart/i });

        const cartNavItem = cartLink.closest("li"); // find closest <li> container
        expect(cartNavItem).toBeInTheDocument();

        expect(within(cartNavItem).getByText(`${cartItems.length}`))
            .toBeInTheDocument();
    });
});