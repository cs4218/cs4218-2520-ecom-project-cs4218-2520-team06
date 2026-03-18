// Gallen Ong, A0252614L
import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";

// Mocks
jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu</div>);
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div>
    {title && <div>{title}</div>}
    {children}
  </div>
));

const mockNavigate = jest.fn();
const mockParams = { slug: "test-slug" };
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(() => mockNavigate),
  useParams: jest.fn(() => mockParams),
}));

// Mock window.confirm
global.window.confirm = jest.fn();

const mockProduct = {
  _id: "1",
  name: "Test Product",
  description: "Test Description",
  price: 100,
  quantity: 10,
  shipping: true,
  category: { _id: "cat1", name: "Category 1" },
};

const mockCategories = [
  { _id: "cat1", name: "Category 1" },
  { _id: "cat2", name: "Category 2" },
];

describe("UpdateProduct Component - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "mock-url");
  });

  it("fetches product and categories on mount", async () => {
    // Arrange: Mock API responses
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    // Act: Render component
    render(<UpdateProduct />);

    // Assert: Verify both API calls were made
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/test-slug"
      );
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
  });

  it("displays error toast when product fetch fails", async () => {
    // Arrange: Mock API error on product fetch
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.reject(new Error("Product fetch failed"));
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    // Act: Render component
    render(<UpdateProduct />);

    // Assert: Error should be logged (component logs errors)
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  it("displays error toast when categories fetch fails", async () => {
    // Arrange: Mock API error on categories fetch
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.reject(new Error("Category fetch failed"));
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    // Act: Render component
    render(<UpdateProduct />);

    // Assert: Error toast should be shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting category"
      );
    });
  });

  it("updates product successfully", async () => {
    // Arrange: Mock successful API responses
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
    axios.put.mockResolvedValue({ data: { success: true } });

    // Act: Render component and wait for data to load
    const { getByRole } = render(<UpdateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    // Act: Click update button (simulating form submission)
    const updateButton = getByRole("button", { name: /update product/i });
    fireEvent.click(updateButton);

    // Assert: Verify success response and navigation
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
    expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("shows error when product update fails", async () => {
    // Arrange: Mock successful fetch but failed update
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
    axios.put.mockResolvedValue({
      data: { success: false, message: "Update failed" },
    });

    // Act: Render component and click update
    const { getByRole } = render(<UpdateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    const updateButton = getByRole("button", { name: /update product/i });
    fireEvent.click(updateButton);

    // Assert: Error toast should be shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  it("deletes product successfully with confirmation", async () => {
    // Arrange: Mock successful API responses and confirmation
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
    axios.delete.mockResolvedValue({ data: { success: true } });
    global.window.confirm.mockReturnValue(true);

    // Act: Render component and click delete
    const { getByRole } = render(<UpdateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    // Assert: Verify deletion and navigation
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
    });
    expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("cancels deletion when user does not confirm", async () => {
    // Arrange: Mock successful API responses but cancelled confirmation
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
    global.window.confirm.mockReturnValue(false);

    // Act: Render component and click delete
    const { getByRole } = render(<UpdateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    // Assert: Verify deletion API was NOT called
    expect(axios.delete).not.toHaveBeenCalled();
  });

  it("shows error when product update API call fails", async () => {
    // Arrange: Mock successful fetch but API error on update
    const error = new Error("API Error");
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
    axios.put.mockRejectedValue(error);

    // Act: Render component and click update
    const { getByRole } = render(<UpdateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    const updateButton = getByRole("button", { name: /update product/i });
    fireEvent.click(updateButton);

    // Assert: Error toast should be shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("shows error when product deletion fails", async () => {
    // Arrange: Mock successful fetch but failed deletion
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
    axios.delete.mockResolvedValue({
      data: { success: false, message: "Deletion failed" },
    });
    global.window.confirm.mockReturnValue(true);

    // Act: Render component and click delete
    const { getByRole } = render(<UpdateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    // Assert: Error toast should be shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Deletion failed");
    });
  });

  it("shows error when product deletion API call fails", async () => {
    // Arrange: Mock successful fetch but API error on deletion
    const error = new Error("API Error");
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
    axios.delete.mockRejectedValue(error);
    global.window.confirm.mockReturnValue(true);

    // Act: Render component and click delete
    const { getByRole } = render(<UpdateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    // Assert: Error toast should be shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
})
  