import React from "react";
import { useAuth } from "../../context/auth";
import { render, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Orders from "./Orders";

// Mock axios
jest.mock("axios");

// Mock useAuth hook
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

// Mock UserMenu component
jest.mock("../../components/UserMenu", () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

// Mock Layout component
jest.mock("../../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout">
        <div data-testid="layout-title">{title}</div>
        {children}
      </div>
    );
  };
});

// Mock moment
jest.mock("moment", () => {
  return jest.fn(() => ({
    fromNow: () => "2 days ago",
  }));
});

describe("Orders Component", () => {
  const order1 = {
    _id: "order1",
    status: "Processing",
    buyer: { name: "John Doe" },
    createAt: "2024-01-01T00:00:00.000Z",
    payment: { success: true },
    products: [
      {
        _id: "prod1",
        name: "Test Product 1",
        description: "This is a test product description",
        price: 99.99,
      },
    ],
  };

  const order2 = {
    _id: "order2",
    status: "Shipped",
    buyer: { name: "Jane Smith" },
    createAt: "2024-01-02T00:00:00.000Z",
    payment: { success: false },
    products: [
      {
        _id: "prod2",
        name: "Test Product 2",
        description: "Another test product",
        price: 49.99,
      },
      {
        _id: "prod3",
        name: "Test Product 3",
        description: "Third test product",
        price: 29.99,
      },
    ],
  };

  const mockOrders = [order1, order2];

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  describe("Check Authentication", () => {
    it("should fetch orders when user is authenticated with token", async () => {
      // Arrange: Set up authenticated user with valid token
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify API was called to fetch orders
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
      });
    });

    it("should NOT fetch orders when user is not authenticated (no token)", async () => {
      // Arrange: Set up unauthenticated user with default empty token
      useAuth.mockReturnValue([{ token: "" }, jest.fn()]);

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify API was NOT called
      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
      });
    });

    it("should NOT fetch orders when auth object is undefined", async () => {
      // Arrange: Set up undefined auth object
      useAuth.mockReturnValue([undefined, jest.fn()]);

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify API was NOT called
      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
      });
    });
  });

  describe("Orders Display - Components", () => {
    it("should render UserMenu component", () => {
      // Arrange: Set up authenticated user with empty orders
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify UserMenu component is rendered
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });

    it("should render Layout component", () => {
      // Arrange: Set up authenticated user with empty orders
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify Layout component is rendered
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });
  });

  describe("Orders Display - Order Details", () => {
    it("should display buyer name from fetched data", async () => {
      // Arrange: Set up authenticated user with orders (single order)
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [order1] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify buyer name is displayed
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should display order status", async () => {
      // Arrange: Set up authenticated user with orders (single order)
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [order1] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify Processing status is displayed
      await waitFor(() => {
        // From first order
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });
    });

    it("should display payment status Success when success", async () => {
      // Arrange: Set up authenticated user with orders (single order)
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [order1] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify Success payment status is displayed
      await waitFor(() => {
        expect(screen.getByText("Success")).toBeInTheDocument();
      });
    });

    it("should display payment status Failed when not success", async () => {
      // Arrange: Set up authenticated user with orders (single order with failed payment)
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [order2] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify Failed payment status is displayed
      await waitFor(() => {
        expect(screen.getByText("Failed")).toBeInTheDocument();
      });
    });

    it("should display moment formatted date", async () => {
      // Arrange: Set up authenticated user with orders (single order)
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [order1] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify formatted date is displayed
      await waitFor(() => {
        expect(screen.getByText("2 days ago")).toBeInTheDocument();
      });
    });

    it("should display multiple orders data", async () => {
      // Arrange: Set up authenticated user with multiple orders
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify both orders' buyer names and statuses are displayed
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText("Shipped")).toBeInTheDocument();
      });
    });
  });

  describe("Orders Display - Product Details", () => {
    it("should display product name", async () => {
      // Arrange: Set up authenticated user with orders
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [order1] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify Test Product 1 name is displayed
      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      });
    });

    it("should display product description", async () => {
      // Arrange: Set up authenticated user with orders
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [order1] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify product description is displayed
      await waitFor(() => {
        expect(screen.getByText(/This is a test product/)).toBeInTheDocument();
      });
    });

    it("should display product price", async () => {
      // Arrange: Set up authenticated user with orders
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [order1] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify Test Product 1 price is displayed
      await waitFor(() => {
        expect(screen.getByText("Price : 99.99")).toBeInTheDocument();
      });
    });

    it("should display product image", async () => {
      // Arrange: Set up authenticated user with orders
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [order1] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify first product image has correct src
      await waitFor(() => {
        const images = screen.getAllByRole("img");
        expect(images[0]).toHaveAttribute(
          "src",
          "/api/v1/product/product-photo/prod1"
        );
      });
    });

    it("should display multiple products in an order", async () => {
      // Arrange: Set up authenticated user with order containing multiple products
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [order2] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify both product names are displayed
      await waitFor(() => {
        expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText("Test Product 3")).toBeInTheDocument();
      });
    });
  });

  describe("Orders Display - Edge Cases", () => {
    it("should render without errors when orders array is empty", async () => {
      // Arrange: Set up authenticated user with empty orders array
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify component still renders
      await waitFor(() => {
        expect(screen.getByText("All Orders")).toBeInTheDocument();
      });
    });

    it("should render without errors when order has missing optional fields", async () => {
      // Arrange: Set up authenticated user with incomplete order data
      const incompleteOrder = [
        {
          _id: "order3",
          buyer: { name: "Incomplete User" },
        },
      ];
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: incompleteOrder });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify component renders without crashing with incomplete data
      await waitFor(() => {
        expect(screen.getByText("Incomplete User")).toBeInTheDocument();
      });
    });

    it("should handle products with missing fields gracefully", async () => {
      // Arrange: Set up authenticated user with order containing incomplete product data
      const orderWithIncompleteProduct = [
        {
          _id: "order4",
          status: "Not Process",
          buyer: { name: "User With Incomplete Product" },
          createAt: "2024-01-03T00:00:00.000Z",
          payment: { success: true },
          products: [
            {
              _id: "prod4",
              // name is missing
              description: "Product without a name",
              // price is missing
            },
          ],
        },
      ];
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: orderWithIncompleteProduct });

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify component renders without crashing with incomplete product data
      await waitFor(() => {
        expect(
          screen.getByText("User With Incomplete Product")
        ).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText("Product without a name")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should log error when API call fails", async () => {
      // Arrange: Set up authenticated user and mock API error
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const error = new Error("Network Error");
      axios.get.mockRejectedValueOnce(error);

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify error was logged to console
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });

      consoleSpy.mockRestore();
    });

    it("should not crash when API returns malformed data", async () => {
      // Arrange: Set up authenticated user with malformed data
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({}); // Malformed data

      // Act: Render the Orders component
      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify component still renders
      await waitFor(() => {
        expect(screen.getByText("All Orders")).toBeInTheDocument();
      });
    });
  });

  describe("useEffect Dependencies", () => {
    it("should refetch orders when auth token changes", async () => {
      // Arrange: Set up initial authenticated user
      const mockSetAuth = jest.fn();
      useAuth.mockReturnValue([{ token: "initial-token" }, mockSetAuth]);
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      const { rerender } = render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });

      // Act: Update auth with different token and rerender
      useAuth.mockReturnValue([{ token: "token" }, mockSetAuth]);
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      rerender(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      // Assert: Verify API was called twice (initial + refetch)
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(2);
      });
    });
  });
});
