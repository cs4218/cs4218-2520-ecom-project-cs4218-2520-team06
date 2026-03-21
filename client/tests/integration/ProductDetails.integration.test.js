// Kok Bo Chang, A0273542E
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProductDetails from "../../src/pages/ProductDetails";
import Layout from "../../src/components/Layout";
import Footer from '../../src/components/Footer';
import Header from '../../src/components/Header';
import { Helmet } from "react-helmet";
import axios from "axios";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

import { CartProvider, useCart } from "../../src/context/cart";
import { AuthProvider } from "../../src/context/auth";
import { SearchProvider } from "../../src/context/search";

jest.mock('react-helmet', () => ({ Helmet: ({ children }) => <>{children}</> }));
jest.mock('react-hot-toast', () => ({ Toaster: () => <div />, success: jest.fn() }));
jest.mock('../../src/components/Header', () => () => <div data-testid="header" />);
jest.mock('../../src/components/Footer', () => () => <div data-testid="footer" />);

jest.mock("axios");

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escapes all regex special chars
}

// Helper to render with the necessary providers and routing
function renderWithProviders(ui, { route = "/product/laptop" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <Routes>
              <Route path="/product/:slug" element={ui} />
            </Routes>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("ProductDetails Integration Tests", () => {
  const mainProduct = {
    _id: "1",
    name: "Laptop",
    slug: "laptop",
    description: "Gaming Laptop",
    price: 1000,
    category: { _id: "c1", name: "Electronics" },
  };

  const relatedProducts = [
    {
      _id: "2",
      name: "Mouse",
      slug: "mouse",
      description: "Wireless Mouse",
      price: 50,
      category: { _id: "c1", name: "Electronics" },
    },
    {
      _id: "3",
      name: "Keyboard",
      slug: "keyboard",
      description: "Mechanical Keyboard",
      price: 120,
      category: { _id: "c1", name: "Electronics" },
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock axios get for product details and related
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { product: mainProduct } });
      }
      if (url.includes("/related-product/")) {
        return Promise.resolve({ data: { products: relatedProducts } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  describe("Layout + ProductDetails rendering", () => {
    test("renders Layout, Header, Footer, and main product details", async () => {
      // Empty Arrange

      // Act
      renderWithProviders(<ProductDetails />);

      // Assert
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    
      // Check for main product
      const name = (await screen.findAllByText(/Laptop/i))[0];
      expect(name).toBeInTheDocument();

      const descRegExp = new RegExp(mainProduct.description, "i");
      expect(screen.getByText(descRegExp)).toBeInTheDocument();

      const priceText = mainProduct.price.toLocaleString("en-US", { style: "currency", currency: "USD" });
      const priceRegExp = new RegExp(escapeRegex(priceText), "i");
      expect(screen.getByText(priceRegExp)).toBeInTheDocument();

      // Check for related products
      await waitFor(() => screen.getAllByText(/Similar Products/i));
      relatedProducts.forEach((rp) => {
        expect(screen.getByText(rp.name)).toBeInTheDocument();

        const descRegExp = new RegExp(rp.description, "i");
        expect(screen.getByText(descRegExp)).toBeInTheDocument();
      });
      
      // Check for Header and Footer
      expect(screen.getByTestId("header")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Cart + ProductDetails integration", () => {
    test("can add main product and related products to cart", async () => {
      // Empty Arrange

      // Act
      renderWithProviders(<ProductDetails />);
      
      // Add main product to cart
      await screen.findAllByText(/Laptop/i);
      const addMainButton = screen.getAllByRole("button", { name: /Add to Cart/i })[0];
      await userEvent.click(addMainButton);

      // Assert
      expect(toast.success).toHaveBeenCalledWith("Item Added to cart");

      // Add related products to cart
      await waitFor(() => screen.getByText(/Similar Products/i));
      for (const rp of relatedProducts) {
        const card = screen.getByTestId(`related-product-${rp._id}`);
        const addButton = within(card).getByRole("button", { name: /Add to Cart/i });
        await userEvent.click(addButton);
        expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
      }
    });

    test("cart state updates correctly via useCart", async () => {
      // Arrange
      let cartState;
      const CartConsumerTest = () => {
        const [cart] = useCart();
        cartState = cart;
        return null;
      };

      // Act
      renderWithProviders(
        <>
          <ProductDetails />
          <CartConsumerTest />
        </>
      );
      await screen.findAllByText(/Laptop/i);
      const addMainButton = screen.getAllByRole("button", { name: /Add to Cart/i })[0];
      await userEvent.click(addMainButton);

      // Assert
      expect(cartState).toContainEqual(mainProduct);
    });
  });
});