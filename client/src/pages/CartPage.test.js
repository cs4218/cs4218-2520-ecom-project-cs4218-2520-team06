// Hans Delano, A0273456X
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import { CartProvider } from "../context/cart";
import { useAuth } from "../context/auth";
import axios from "axios";
import CartPage from "./CartPage";

// Fake localStorage implementation for testing
const localStorageFake = (() => {
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
Object.defineProperty(window, "localStorage", { value: localStorageFake });

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

jest.mock("../components/Layout.js", () => ({ children, title }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
));

const mockRequestPaymentMethod = jest
  .fn()
  .mockResolvedValue({ nonce: "mock-nonce" });

jest.mock("braintree-web-drop-in-react", () => {
  return function MockDropIn({ onInstance }) {
    return (
      <div data-testid="mock-dropin">
        Braintree UI
        {/* Button to simulate instance creation:  */}
        <button
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
const loadFakeBraintree = async () => {
  await waitFor(async () => {
    const dropInElement = await screen.findByTestId("mock-dropin");
    expect(dropInElement).toBeInTheDocument();
  });
  // Simulate loading of Braintree and instance creation
  const loadInstance = await screen.findByText(/Simulate Braintree Load/);
  await act(async () => {
    loadInstance.click();
  });
};

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
  // wrap render in act because there is an async useEffect in CartPage that we need to wait for
  // eslint-disable-next-line testing-library/no-unnecessary-act
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
    localStorageFake.clear();
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
      await act(async () => {
        deleteButtons[0].click();
      });

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
      await act(async () => {
        deleteButtons[0].click();
      });

      expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getByText(/\$200\.00/)).toBeInTheDocument();
    });

    test("should navigates to login on checkout for guest users", async () => {
      setMockCart();
      setMockAuth(); // Sets to null
      await renderCartPage();

      const checkoutButton = screen.getByText(/Please Login to checkout/);
      await act(async () => {
        checkoutButton.click();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/cart" });
    });

    test("should navigates to profile on checkout for logged in users without address", async () => {
      setMockCart();
      setMockAuth({ name: "Test User", address: null }, "mock-token");
      await renderCartPage();

      const updateAddressBtn = screen.getByText(/Update Address/);
      await act(async () => {
        updateAddressBtn.click();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
    });

    test("should navigates to profile on checkout for logged in users with address", async () => {
      setMockCart();
      setMockAuth({ name: "Test User", address: "123 Test St" }, "mock-token");
      await renderCartPage();

      const checkoutButton = screen.getByText(/Update Address/);
      await act(async () => {
        checkoutButton.click();
      });

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
      await loadFakeBraintree();
      const makePayment = await screen.findByText(/Make Payment/);
      await act(async () => {
        makePayment.click();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        { cart: mockCart, nonce: "mock-nonce" }
      );

      consoleSpy.mockRestore();
    });

    test("should handle payment failure", async () => {
      setMockCart();
      setMockAuth({ name: "Test User", address: "123 Test St" }, "mock-token");
      const error = new Error("Payment Failed");
      axios.post.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await renderCartPage();
      await loadFakeBraintree();
      const makePayment = await screen.findByText(/Make Payment/);
      await act(async () => {
        makePayment.click();
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });

      consoleSpy.mockRestore();
    });
  });
});
