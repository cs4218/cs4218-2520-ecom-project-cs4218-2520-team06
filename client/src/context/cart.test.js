// Hans Delano, A0273456X
import React from "react";
import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "../context/cart";

const mockCart = [
  { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
  { _id: "p2", name: "Product 2", price: 200, description: "Desc 2" },
];

describe("useCart Hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("should initialize from localStorage", async () => {
    localStorage.setItem("cart", JSON.stringify(mockCart));
    let results = {};

    const TestComponent = () => {
      const [cart] = useCart();
      results.cart = cart;
      return null;
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(results.cart).toEqual(mockCart);
    });
  });

  test("should update state on setCart", async () => {
    const mockItems = [mockCart[0]];
    let results = {};

    const TestComponent = () => {
      const [cart, setCart] = useCart();
      React.useEffect(() => {
        setCart(mockItems);
      }, [setCart]);
      results.cart = cart;
      return null;
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(results.cart).toEqual(mockItems);
    });
  });
});
