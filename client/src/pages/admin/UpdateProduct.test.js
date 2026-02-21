// Gallen Ong, A0252614L
import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  queryByDisplayValue,
} from "@testing-library/react";
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

describe("UpdateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "mock-url");
  });

  it("renders correctly with fetched product and categories", async () => {
    // Arrange: Mock API responses for product and categories
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

    // Act: Render the UpdateProduct component
    const { findByDisplayValue, getByText, findByText, getByRole } = render(
      <UpdateProduct />
    );
    
    // Assert: Verify component renders with expected elements and populated form fields
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    expect(getByText("Dashboard - Create Product")).toBeInTheDocument();
    expect(getByText("AdminMenu")).toBeInTheDocument();
    expect(getByText("Update Product")).toBeInTheDocument();
    expect(
      getByRole("button", { name: /update product/i })
    ).toBeInTheDocument();
    expect(
      getByRole("button", { name: /delete product/i })
    ).toBeInTheDocument();

    // Assert: Verify category dropdown is rendered and categories are displayed
    const categorySelect = await findByText(/Category 1/i);
    expect(categorySelect).toBeInTheDocument();
    fireEvent.mouseDown(categorySelect);
    waitFor(() => {
      expect(getByText("Category 1")).toBeInTheDocument();
      expect(getByText("Category 2")).toBeInTheDocument();
    });

    // Assert: Form fields are populated with product data
    expect(await findByDisplayValue("Test Product")).toBeInTheDocument();
    expect(await findByDisplayValue("Test Description")).toBeInTheDocument();
    expect(await findByDisplayValue("100")).toBeInTheDocument();
    expect(await findByDisplayValue("10")).toBeInTheDocument();
    expect(await findByText(/Yes/i)).toBeInTheDocument();
  });

  it("handles product update successfully", async () => {
    // Arrange: Mock API responses for product, categories, and successful update
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
    
    // Act: Render the UpdateProduct component and fill in form fields
    const {
      getByRole,
      getByPlaceholderText,
      findByText,
      getByText,
      getByLabelText,
    } = render(<UpdateProduct />);
    
    // Assert: Verify initial API calls were made and category dropdown is rendered
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    const categorySelect = await findByText(/Category 1/i);
    expect(categorySelect).toBeInTheDocument();
    fireEvent.mouseDown(categorySelect);
    waitFor(() => {
      expect(getByText("Category 1")).toBeInTheDocument();
      expect(getByText("Category 2")).toBeInTheDocument();
    });
    
    // Act: Update form fields
    fireEvent.click(getByText("Category 2"));

    fireEvent.change(getByPlaceholderText(/write a name/i), {
      target: { value: "Updated Test Product" },
    });
    fireEvent.change(getByPlaceholderText(/write a description/i), {
      target: { value: "Updated Test Description" },
    });
    fireEvent.change(getByPlaceholderText(/write a price/i), {
      target: { value: "200" },
    });
    fireEvent.change(getByPlaceholderText(/write a quantity/i), {
      target: { value: "20" },
    });
    
    // Assert: Verify shipping dropdown is rendered and options are displayed
    const shippingSelect = await findByText(/Yes/i);
    expect(shippingSelect).toBeInTheDocument();
    fireEvent.mouseDown(shippingSelect);
    waitFor(() => {
      expect(getByText("Yes")).toBeInTheDocument();
      expect(getByText("No")).toBeInTheDocument();
    });
    
    // Act: Select "No" for shipping and submit the form
    fireEvent.click(getByText("No"));
    const file = new File(["photo"], "photo.png", { type: "image/png" });
    fireEvent.change(getByLabelText(/upload photo/i), {
      target: { files: [file] },
    });
    const updateButton = getByRole("button", { name: /update product/i });
    fireEvent.click(updateButton);

    // Assert: Verify product was updated and navigation occurred
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
    });
    expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("handles product deletion successfully", async () => {
    // Arrange: Mock API responses for product, categories, and successful deletion
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

    // Act: Render the UpdateProduct component
    const { getByRole } = render(<UpdateProduct />);
    
    // Assert: Verify initial API calls were made
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    // Act: Confirm deletion via prompt and click delete button
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");
    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    // Assert: Verify product was deleted and navigation occurred
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledTimes(1);
    });
    expect(promptSpy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("handles API error on fetching single product", async () => {
    // Arrange: Mock API error for product fetch and spy on console.log
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.reject(new Error("API Error"));
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    // Act: Render the UpdateProduct component
    const { queryByDisplayValue, queryByText } = render(<UpdateProduct />);
    
    // Assert: Verify error was logged, error toast was shown, and form fields are not rendered
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    expect(consoleSpy).toHaveBeenCalledWith(new Error("API Error"));
    expect(queryByDisplayValue("Test Product")).not.toBeInTheDocument();
    expect(queryByDisplayValue("Test Description")).not.toBeInTheDocument();
    expect(queryByDisplayValue("100")).not.toBeInTheDocument();
    expect(queryByDisplayValue("10")).not.toBeInTheDocument();
    expect(queryByText(/Yes/i)).not.toBeInTheDocument();
  });

  it("handles category fetch success false", async () => {
    // Arrange: Mock successful product fetch but failed category fetch
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: false } });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    // Act: Render the UpdateProduct component and open category dropdown
    const { queryByText, container } = render(<UpdateProduct />);
    
    // Assert: Verify initial API calls were made
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    // Act: Find the category Select by its class (first ant-select in the form) and click to open the dropdown
    const categorySelect = container.querySelector(".ant-select");
    expect(categorySelect).toBeInTheDocument();
    fireEvent.mouseDown(categorySelect);

    // Assert: Verify no categories are displayed in dropdown
    await waitFor(() => {
      expect(queryByText("Category 1")).not.toBeInTheDocument();
      expect(queryByText("Category 2")).not.toBeInTheDocument();
    });
  });

  it("handles API error on fetching categories", async () => {
    // Arrange: Mock successful product fetch but API error on category fetch
    const error = new Error("API Error");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.reject(error);
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    // Act: Render the UpdateProduct component and open category dropdown
    const { queryByText, container } = render(<UpdateProduct />);
    
    // Assert: Verify error was logged, error toast was shown
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong in getting category"
    );

    // Act: Find the category Select by its class (first ant-select in the form) and click to open the dropdown
    const categorySelect = container.querySelector(".ant-select");
    expect(categorySelect).toBeInTheDocument();
    fireEvent.mouseDown(categorySelect);
    
    // Assert: Verify no categories are displayed in dropdown
    await waitFor(() => {
      expect(queryByText("Category 1")).not.toBeInTheDocument();
      expect(queryByText("Category 2")).not.toBeInTheDocument();
    });
  });

  it("handles product update success false", async () => {
    // Arrange: Mock API responses for product, categories, and failed update
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
    
    // Act: Render the UpdateProduct component and fill in form fields
    const { getByRole, getByPlaceholderText, findByText, getByText } = render(
      <UpdateProduct />
    );
    
    // Assert: Verify category dropdown is rendered and categories are displayed
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    const categorySelect = await findByText(/Category 1/i);
    expect(categorySelect).toBeInTheDocument();
    fireEvent.mouseDown(categorySelect);
    waitFor(() => {
      expect(getByText("Category 1")).toBeInTheDocument();
      expect(getByText("Category 2")).toBeInTheDocument();
    });
    
    // Act: Update form fields
    fireEvent.click(getByText("Category 2"));

    fireEvent.change(getByPlaceholderText(/write a name/i), {
      target: { value: "Updated Test Product" },
    });
    fireEvent.change(getByPlaceholderText(/write a description/i), {
      target: { value: "Updated Test Description" },
    });
    fireEvent.change(getByPlaceholderText(/write a price/i), {
      target: { value: "200" },
    });
    fireEvent.change(getByPlaceholderText(/write a quantity/i), {
      target: { value: "20" },
    });
    
    // Assert: Verify shipping dropdown is rendered and options are displayed
    const shippingSelect = await findByText(/Yes/i);
    expect(shippingSelect).toBeInTheDocument();
    fireEvent.mouseDown(shippingSelect);
    waitFor(() => {
      expect(getByText("Yes")).toBeInTheDocument();
      expect(getByText("No")).toBeInTheDocument();
    });
    
    // Act: Select "No" for shipping and submit the form
    fireEvent.click(getByText("No"));
    const updateButton = getByRole("button", { name: /update product/i });
    fireEvent.click(updateButton);

    // Assert: Verify error toast was shown
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
    });
    expect(toast.error).toHaveBeenCalledWith("Update failed");
  });

  it("handles API error on product update", async () => {
    // Arrange: Mock API responses for product, categories, and API error on update
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
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    
    // Act: Render the UpdateProduct component and fill in form fields
    const { getByRole, getByPlaceholderText, findByText, getByText } = render(
      <UpdateProduct />
    );
    
    // Assert: Verify category dropdown is rendered and categories are displayed
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    const categorySelect = await findByText(/Category 1/i);
    expect(categorySelect).toBeInTheDocument();
    fireEvent.mouseDown(categorySelect);
    waitFor(() => {
      expect(getByText("Category 1")).toBeInTheDocument();
      expect(getByText("Category 2")).toBeInTheDocument();
    });
    
    // Act: Update form fields
    fireEvent.click(getByText("Category 2"));

    fireEvent.change(getByPlaceholderText(/write a name/i), {
      target: { value: "Updated Test Product" },
    });
    fireEvent.change(getByPlaceholderText(/write a description/i), {
      target: { value: "Updated Test Description" },
    });
    fireEvent.change(getByPlaceholderText(/write a price/i), {
      target: { value: "200" },
    });
    fireEvent.change(getByPlaceholderText(/write a quantity/i), {
      target: { value: "20" },
    });
    
    // Assert: Verify shipping dropdown is rendered and options are displayed
    const shippingSelect = await findByText(/Yes/i);
    expect(shippingSelect).toBeInTheDocument();
    fireEvent.mouseDown(shippingSelect);
    waitFor(() => {
      expect(getByText("Yes")).toBeInTheDocument();
      expect(getByText("No")).toBeInTheDocument();
    });
    
    // Act: Select "No" for shipping and submit the form
    fireEvent.click(getByText("No"));
    const updateButton = getByRole("button", { name: /update product/i });
    fireEvent.click(updateButton);

    // Assert: Verify error was logged and error toast was shown
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
    });
    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("handles product deletion cancellation", async () => {
    // Arrange: Mock API responses for product and categories
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
    
    // Act: Render the UpdateProduct component and attempt to delete product but cancel via prompt
    const { getByRole } = render(<UpdateProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("");
    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    // Assert: Verify deletion was cancelled and no API call was made
    expect(promptSpy).toHaveBeenCalled();
    expect(axios.delete).not.toHaveBeenCalled();
  });

  it("handles product deletion success false", async () => {
    // Arrange: Mock API responses for product, categories, and failed deletion
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
    
    // Act: Render the UpdateProduct component and attempt to delete product
    const { getByRole } = render(<UpdateProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");
    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    // Assert: Verify error toast was shown
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledTimes(1);
    });
    expect(promptSpy).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Deletion failed");
  });

  it("handles API error on product deletion", async () => {
    // Arrange: Mock API responses for product, categories, and API error on deletion
    const error = new Error("API Error");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
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
    
    // Act: Render the UpdateProduct component and attempt to delete product
    const { getByRole } = render(<UpdateProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");
    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    // Assert: Verify error was logged and error toast was shown
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledTimes(1);
    });
    expect(promptSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });
});
