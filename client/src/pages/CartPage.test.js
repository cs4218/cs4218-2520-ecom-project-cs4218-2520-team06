// Hans Delano, A0273456X
import React from "react";
import "@testing-library/jest-dom";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import { CartProvider } from "../context/cart";
import { useAuth } from "../context/auth";
import axios from "axios";
import CartPage from "./CartPage";

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

jest.mock("axios", () => ({
  get: jest.fn((url) => {
    if (url === "/api/v1/product/braintree/token") {
      return Promise.resolve({ data: { clientToken: "mock-client-token" } });
    }
    return Promise.reject(new Error("Unknown API endpoint"));
  }),
  post: jest.fn(),
}));

jest.mock("../context/auth.js", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));

jest.mock("../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout">
        <div data-testid="layout-title">{title}</div>
        {children}
      </div>
    );
  };
});

const mockRequestPaymentMethod = jest
  .fn()
  .mockResolvedValue({ nonce: "mock-nonce" });

// Button to mock Braintree DropIn loading and instance creation
jest.mock("braintree-web-drop-in-react", () => {
  return function MockDropIn({ onInstance }) {
    return (
      <div data-testid="mock-dropin">
        Braintree UI
        <button
          data-testid="braintree-init-btn"
          onClick={() => {
            if (onInstance) {
              onInstance({ requestPaymentMethod: mockRequestPaymentMethod });
            }
          }}
        >
          Simulate Braintree Load
        </button>
      </div>
    );
  };
});

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(() => mockNavigate),
}));

delete window.location;
window.location = { reload: jest.fn() };

const mockCart = [
  { _id: "p1", name: "Product 1", price: 100, description: "Desc 1" },
  { _id: "p2", name: "Product 2", price: 200, description: "Desc 2" },
];

const renderCartPage = async () => {
  return await act(async () => {
    render(
      <Router>
        <CartProvider>
          <CartPage />
        </CartProvider>
      </Router>
    );
  });
};

const setMockAuth = (user = null, token = null) => {
  useAuth.mockReturnValue([{ user, token }, jest.fn()]);
};

const setMockCart = (cart = mockCart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
};

describe("CartPage", () => {
  beforeEach(() => {
    setMockAuth({ name: "Test User" }, "mock-token");
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("CartPage Component", () => {
    test("should renders cart items and total price", async () => {
      setMockCart();
      await renderCartPage();

      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getByText(/\$300\.00/)).toBeInTheDocument();
    });

    test("should let guest users see login prompt", async () => {
      setMockCart();
      setMockAuth(); // Sets to null
      await renderCartPage();

      expect(screen.getByText(/Please Login to checkout/)).toBeInTheDocument();
    });

    test("should let logged in users without address to see address prompt", async () => {
      setMockCart();
      setMockAuth({ name: "Test User", address: null }, "mock-token");
      await renderCartPage();

      expect(screen.getByText(/Update Address/)).toBeInTheDocument();
      expect(
        screen.queryByText(/Please Login to checkout/)
      ).not.toBeInTheDocument();
    });

    test("should let logged in users with address see current address", async () => {
      setMockCart();
      setMockAuth({ name: "Test User", address: "123 Test St" }, "mock-token");
      await renderCartPage();

      expect(screen.getByText("Current Address")).toBeInTheDocument();
      expect(screen.getByText("123 Test St")).toBeInTheDocument();
    });
  });

  describe("CartPage Errors", () => {
    test("should handle totalPrice error gracefully", async () => {
      setMockCart([
        { price: "invalid", name: "Product 1", description: "Desc 1" },
      ]);
      const error = new Error("Currency formatting failed");
      const localeSpy = jest
        .spyOn(Number.prototype, "toLocaleString")
        .mockImplementation(() => {
          throw error;
        });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await renderCartPage();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });

      localeSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    test("should handle removeCartItem error gracefully", async () => {
      setMockCart();
      const error = new Error("Error removing item from cart");
      localStorage.setItem.mockImplementationOnce(() => {
        throw error;
      });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await renderCartPage();

      const deleteButtons = screen.getAllByText("Remove");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });

    test("should handle getToken error gracefully", async () => {
      const error = new Error("API Error");
      axios.get.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await renderCartPage();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });
  });

  describe("CartPage Interactions", () => {
    test("should removes item from cart on delete", async () => {
      setMockCart();
      await renderCartPage();

      const deleteButtons = screen.getAllByText("Remove");
      expect(deleteButtons).toHaveLength(2);

      fireEvent.click(deleteButtons[0]);

      expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getByText(/\$200\.00/)).toBeInTheDocument();
    });

    test("should navigates to login on checkout for guest users", async () => {
      setMockCart();
      setMockAuth(); // Sets to null
      await renderCartPage();

      const checkoutButton = screen.getByText(/Please Login to checkout/);
      fireEvent.click(checkoutButton);

      expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/cart" });
    });

    test("should navigates to profile on checkout for logged in users without address", async () => {
      setMockCart();
      setMockAuth({ name: "Test User", address: null }, "mock-token");
      await renderCartPage();

      const updateAddressBtn = screen.getByText(/Update Address/);
      fireEvent.click(updateAddressBtn);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
    });

    test("should navigates to profile on checkout for logged in users with address", async () => {
      setMockCart();
      setMockAuth({ name: "Test User", address: "123 Test St" }, "mock-token");
      await renderCartPage();

      const checkoutButton = screen.getByText(/Update Address/);
      fireEvent.click(checkoutButton);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
    });
  });

  describe("Payment Handling", () => {
    test("should handle payment success", async () => {
      setMockCart();
      setMockAuth({ name: "Test User", address: "123 Test St" }, "mock-token");
      axios.post.mockResolvedValue({ data: { success: true } });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await renderCartPage();

      await waitFor(async () => {
        const dropInElement = await screen.findByTestId("mock-dropin");

        expect(dropInElement).toBeInTheDocument();
      });

      // Simulate payment handling
      const loadInstance = await screen.findByText(/Simulate Braintree Load/);
      fireEvent.click(loadInstance);

      const makePayment = await screen.findByText(/Make Payment/);
      fireEvent.click(makePayment);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      });

      consoleSpy.mockRestore();
    });

    test("should handle payment failure", async () => {
      setMockCart();
      setMockAuth({ name: "Test User", address: "123 Test St" }, "mock-token");
      const error = new Error("Payment Failed");
      axios.post.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await renderCartPage();

      await waitFor(async () => {
        const dropInElement = await screen.findByTestId("mock-dropin");

        expect(dropInElement).toBeInTheDocument();
      });

      // Simulate payment handling
      const loadInstance = await screen.findByText(/Simulate Braintree Load/);
      fireEvent.click(loadInstance);

      const makePayment = await screen.findByText(/Make Payment/);
      fireEvent.click(makePayment);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });

      consoleSpy.mockRestore();
    });
  });
});
