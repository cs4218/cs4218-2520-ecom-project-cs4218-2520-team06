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

    const { findByDisplayValue, getByText, findByText, getByRole } = render(
      <UpdateProduct />
    );
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

    // Verify the category select rendered
    const categorySelect = await findByText(/Category 1/i);
    expect(categorySelect).toBeInTheDocument();
    fireEvent.mouseDown(categorySelect);
    waitFor(() => {
      expect(getByText("Category 1")).toBeInTheDocument();
      expect(getByText("Category 2")).toBeInTheDocument();
    });

    // Verify form fields are populated from the fetched product
    expect(await findByDisplayValue("Test Product")).toBeInTheDocument();
    expect(await findByDisplayValue("Test Description")).toBeInTheDocument();
    expect(await findByDisplayValue("100")).toBeInTheDocument();
    expect(await findByDisplayValue("10")).toBeInTheDocument();
    expect(await findByText(/Yes/i)).toBeInTheDocument();
  });

  it("handles product update successfully", async () => {
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

    const {
      getByRole,
      getByPlaceholderText,
      findByText,
      getByText,
      getByLabelText,
    } = render(<UpdateProduct />);
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

    const shippingSelect = await findByText(/Yes/i);
    expect(shippingSelect).toBeInTheDocument();
    fireEvent.mouseDown(shippingSelect);
    waitFor(() => {
      expect(getByText("Yes")).toBeInTheDocument();
      expect(getByText("No")).toBeInTheDocument();
    });
    fireEvent.click(getByText("No"));

    const file = new File(["photo"], "photo.png", { type: "image/png" });
    fireEvent.change(getByLabelText(/upload photo/i), {
      target: { files: [file] },
    });

    const updateButton = getByRole("button", { name: /update product/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
    });
    expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("handles product deletion successfully", async () => {
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

    const { getByRole } = render(<UpdateProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");
    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledTimes(1);
    });
    expect(promptSpy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("handles API error on fetching single product", async () => {
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

    const { queryByDisplayValue, queryByText } = render(<UpdateProduct />);
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
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/test-slug`) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: false } });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    const { queryByText, container } = render(<UpdateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    // Find the category Select by its class (first ant-select in the form)
    const categorySelect = container.querySelector(".ant-select");
    expect(categorySelect).toBeInTheDocument();

    fireEvent.mouseDown(categorySelect);

    await waitFor(() => {
      expect(queryByText("Category 1")).not.toBeInTheDocument();
      expect(queryByText("Category 2")).not.toBeInTheDocument();
    });
  });

  it("handles API error on fetching categories", async () => {
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

    const { queryByText, container } = render(<UpdateProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong in getting category"
    );

    // Find the category Select by its class (first ant-select in the form)
    const categorySelect = container.querySelector(".ant-select");
    expect(categorySelect).toBeInTheDocument();
    fireEvent.mouseDown(categorySelect);

    await waitFor(() => {
      expect(queryByText("Category 1")).not.toBeInTheDocument();
      expect(queryByText("Category 2")).not.toBeInTheDocument();
    });
  });

  it("handles product update success false", async () => {
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

    const { getByRole, getByPlaceholderText, findByText, getByText } = render(
      <UpdateProduct />
    );
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

    const shippingSelect = await findByText(/Yes/i);
    expect(shippingSelect).toBeInTheDocument();
    fireEvent.mouseDown(shippingSelect);
    waitFor(() => {
      expect(getByText("Yes")).toBeInTheDocument();
      expect(getByText("No")).toBeInTheDocument();
    });
    fireEvent.click(getByText("No"));

    const updateButton = getByRole("button", { name: /update product/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
    });
    expect(toast.error).toHaveBeenCalledWith("Update failed");
  });

  it("handles API error on product update", async () => {
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

    const { getByRole, getByPlaceholderText, findByText, getByText } = render(
      <UpdateProduct />
    );
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

    const shippingSelect = await findByText(/Yes/i);
    expect(shippingSelect).toBeInTheDocument();
    fireEvent.mouseDown(shippingSelect);
    waitFor(() => {
      expect(getByText("Yes")).toBeInTheDocument();
      expect(getByText("No")).toBeInTheDocument();
    });
    fireEvent.click(getByText("No"));

    const updateButton = getByRole("button", { name: /update product/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
    });
    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("handles product deletion cancellation", async () => {
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

    const { getByRole } = render(<UpdateProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("");
    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    expect(promptSpy).toHaveBeenCalled();
    expect(axios.delete).not.toHaveBeenCalled();
  });

  it("handles product deletion success false", async () => {
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

    const { getByRole } = render(<UpdateProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");
    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledTimes(1);
    });
    expect(promptSpy).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Deletion failed");
  });

  it("handles API error on product deletion", async () => {
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

    const { getByRole } = render(<UpdateProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");
    const deleteButton = getByRole("button", { name: /delete product/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledTimes(1);
    });
    expect(promptSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });
});
