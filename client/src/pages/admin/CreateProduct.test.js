// Gallen Ong, A0252614L
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";

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
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockCategories = [
  { _id: "cat-1", name: "Category 1" },
  { _id: "cat-2", name: "Category 2" },
];

describe("CreateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "mock-url");
  });

  it("renders correctly", async () => {
    // Arrange: Mock empty categories response
    axios.get.mockResolvedValue({ data: { success: true, category: [] } });
    
    // Act: Render the CreateProduct component
    const { getByText } = render(<CreateProduct />);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    
    // Assert: Verify expected elements are rendered
    expect(getByText("AdminMenu")).toBeInTheDocument();
    expect(getByText("Dashboard - Create Product")).toBeInTheDocument();
    expect(getByText("Create Product")).toBeInTheDocument();
  });

  it("renders form fields correctly", async () => {
    // Arrange: Mock categories response
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });

    // Act: Render the CreateProduct component
    const { getByText, getByPlaceholderText, container } = render(
      <CreateProduct />
    );
    
    // Assert: Verify form fields are rendered
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    const categorySelect = getByText(/select a category/i);
    expect(categorySelect).toBeInTheDocument();

    // Act: Click to open the category dropdown
    fireEvent.mouseDown(categorySelect);

    // Assert: Check that categories are rendered in the dropdown and other form fields are present
    await waitFor(() => {
      expect(getByText("Category 1")).toBeInTheDocument();
      expect(getByText("Category 2")).toBeInTheDocument();
    });
    expect(getByText(/select shipping/i)).toBeInTheDocument();
    expect(getByPlaceholderText(/write a name/i)).toBeInTheDocument();
    expect(getByPlaceholderText(/write a description/i)).toBeInTheDocument();
    expect(getByPlaceholderText(/write a price/i)).toBeInTheDocument();
    expect(getByPlaceholderText(/write a quantity/i)).toBeInTheDocument();
    expect(getByText(/upload photo/i)).toBeInTheDocument();
  });

  it("handles category fetch success false", async () => {
    // Arrange: Mock API response with success false
    axios.get.mockResolvedValue({
      data: { success: false, message: "Creation failed" },
    });

    // Act: Render the CreateProduct component
    const { queryByText, getByText } = render(<CreateProduct />);
    
    // Assert: Dropdown is rendered
    const categorySelect = getByText(/select a category/i);
    expect(categorySelect).toBeInTheDocument();
    
    // Act: Click to open the category dropdown
    fireEvent.mouseDown(categorySelect);

    // Assert: Verify axios was called, and no categories are rendered in the dropdown
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(queryByText("Category 1")).not.toBeInTheDocument();
    expect(queryByText("Category 2")).not.toBeInTheDocument();
  });

  it("handles API error during category fetch", async () => {
    // Arrange: Mock API error and spy on console.log
    const error = new Error("Fetch failed");
    axios.get.mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act: Render the CreateProduct component and open dropdown
    const { queryByText, getByText } = render(<CreateProduct />);

    // Assert: Dropdown is rendered
    const categorySelect = getByText(/select a category/i);
    expect(categorySelect).toBeInTheDocument();
    
    // Act: Click to open the category dropdown
    fireEvent.mouseDown(categorySelect);

    // Assert: Verify axios was called, error was logged, error toast was shown, and no categories are rendered in the dropdown
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong in getting category"
    );
    expect(queryByText("Category 1")).not.toBeInTheDocument();
    expect(queryByText("Category 2")).not.toBeInTheDocument();
  });

  it("submits form and creates product successfully", async () => {
    // Arrange: Mock successful categories fetch and product creation
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockResolvedValue({ data: { success: true } });
    
    // Act: Render the CreateProduct component and fill in form fields
    const { getByPlaceholderText, getByText, getByLabelText, getByRole } =
      render(<CreateProduct />);

    // Assert: Axios get was called to fetch categories and category dropdown is rendered
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    const categorySelect = getByText(/select a category/i);
    expect(categorySelect).toBeInTheDocument();

    // Act: Click to open the category dropdown
    fireEvent.mouseDown(categorySelect);

    // Assert: Check that categories are rendered in the dropdown
    await waitFor(() => {
      expect(getByText("Category 1")).toBeInTheDocument();
      expect(getByText("Category 2")).toBeInTheDocument();
    });

    // Act: Fill in form fields
    fireEvent.click(getByText("Category 1"));

    fireEvent.change(getByPlaceholderText(/write a name/i), {
      target: { value: "Test Product" },
    });
    fireEvent.change(getByPlaceholderText(/write a description/i), {
      target: { value: "Test Description" },
    });
    fireEvent.change(getByPlaceholderText(/write a price/i), {
      target: { value: "100" },
    });
    fireEvent.change(getByPlaceholderText(/write a quantity/i), {
      target: { value: "10" },
    });
    
    // Assert: Shipping dropdown is rendered
    const shippingSelect = getByText(/select shipping/i);
    expect(shippingSelect).toBeInTheDocument();

    // Act: Click to open the shipping dropdown
    fireEvent.mouseDown(shippingSelect);

    // Assert: Shipping options are rendered in the dropdown
    await waitFor(() => {
      expect(getByText("Yes")).toBeInTheDocument();
      expect(getByText("No")).toBeInTheDocument();
    });
    
    // Act: Select "Yes" for shipping and upload a photo, then submit the form
    fireEvent.click(getByText("Yes"));
    const file = new File(["photo"], "photo.png", { type: "image/png" });
    fireEvent.change(getByLabelText(/upload photo/i), {
      target: { files: [file] },
    });
    fireEvent.click(getByRole("button", { name: /Create Product/i }));

    // Assert: Verify product was created and navigation occurred
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
    expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("handles product creation success is false", async () => {
    // Arrange: Mock successful categories fetch but failed product creation
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockResolvedValue({
      data: { success: false, message: "Creation failed" },
    });
    
    // Act: Render the CreateProduct component and fill in form fields
    const { getByPlaceholderText, getByText, getByRole } = render(
      <CreateProduct />
    );
    
    // Assert: Axios get was called to fetch categories and category dropdown is rendered
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    const categorySelect = getByText(/select a category/i);
    expect(categorySelect).toBeInTheDocument();

    // Act: Click to open the category dropdown
    fireEvent.mouseDown(categorySelect);

    // Assert: Check that categories are rendered in the dropdown
    await waitFor(() => {
      expect(getByText("Category 1")).toBeInTheDocument();
      expect(getByText("Category 2")).toBeInTheDocument();
    });

    // Act: Fill in form fields
    fireEvent.click(getByText("Category 1"));

    fireEvent.change(getByPlaceholderText(/write a name/i), {
      target: { value: "Test Product" },
    });
    fireEvent.change(getByPlaceholderText(/write a description/i), {
      target: { value: "Test Description" },
    });
    fireEvent.change(getByPlaceholderText(/write a price/i), {
      target: { value: "100" },
    });
    fireEvent.change(getByPlaceholderText(/write a quantity/i), {
      target: { value: "10" },
    });
    
    // Assert: Shipping dropdown is rendered
    const shippingSelect = getByText(/select shipping/i);
    expect(shippingSelect).toBeInTheDocument();

    // Act: Click to open the shipping dropdown
    fireEvent.mouseDown(shippingSelect);

    // Assert: Shipping options are rendered in the dropdown
    await waitFor(() => {
      expect(getByText("Yes")).toBeInTheDocument();
      expect(getByText("No")).toBeInTheDocument();
    });
    
    // Act: Select "Yes" for shipping and submit the form
    fireEvent.click(getByText("Yes"));
    fireEvent.click(getByRole("button", { name: /Create Product/i }));

    // Assert: Verify error toast was shown and no navigation occurred
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Creation failed");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it("handles API error during product creation", async () => {
    // Arrange: Mock successful categories fetch but API error on product creation
    const error = new Error("Fetch failed");
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    
    // Act: Render the CreateProduct component and fill in form fields
    const { getByPlaceholderText, getByText, getByRole } = render(
      <CreateProduct />
    );
    
    // Assert: Axios get was called to fetch categories and category dropdown is rendered
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    const categorySelect = getByText(/select a category/i);
    expect(categorySelect).toBeInTheDocument();

    // Act: Click to open the category dropdown
    fireEvent.mouseDown(categorySelect);

    // Assert: Check that categories are rendered in the dropdown
    await waitFor(() => {
      expect(getByText("Category 1")).toBeInTheDocument();
      expect(getByText("Category 2")).toBeInTheDocument();
    });

    // Act: Fill in form fields
    fireEvent.click(getByText("Category 1"));

    fireEvent.change(getByPlaceholderText(/write a name/i), {
      target: { value: "Test Product" },
    });
    fireEvent.change(getByPlaceholderText(/write a description/i), {
      target: { value: "Test Description" },
    });
    fireEvent.change(getByPlaceholderText(/write a price/i), {
      target: { value: "100" },
    });
    fireEvent.change(getByPlaceholderText(/write a quantity/i), {
      target: { value: "10" },
    });
    
    // Assert: Shipping dropdown is rendered
    const shippingSelect = getByText(/select shipping/i);
    expect(shippingSelect).toBeInTheDocument();

    // Act: Click to open the shipping dropdown
    fireEvent.mouseDown(shippingSelect);

    // Assert: Shipping options are rendered in the dropdown
    await waitFor(() => {
      expect(getByText("Yes")).toBeInTheDocument();
      expect(getByText("No")).toBeInTheDocument();
    });
    
    // Act: Select "Yes" for shipping and submit the form
    fireEvent.click(getByText("Yes"));
    fireEvent.click(getByRole("button", { name: /Create Product/i }));

    // Assert: Verify error was logged, error toast was shown, and no navigation occurred
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
