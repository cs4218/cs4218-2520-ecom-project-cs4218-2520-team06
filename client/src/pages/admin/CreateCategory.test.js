// Gallen Ong, A0252614L
import React from "react";
import { render, fireEvent, waitFor, within } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu</div>);
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

const mockCategories = [
  { _id: "cat-1", name: "Category 1" },
  { _id: "cat-2", name: "Category 2" },
];

describe("CreateCategory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders correctly", async () => {
    axios.get.mockResolvedValueOnce({
      data: { category: [], success: true },
    });
    const { getByText } = render(<CreateCategory />);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    expect(getByText("AdminMenu")).toBeInTheDocument();
    expect(getByText("Manage Category")).toBeInTheDocument();
  });

  it("fetches and displays categories on mount", async () => {
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });

    const { findByText } = render(<CreateCategory />);

    expect(await findByText("Category 1")).toBeInTheDocument();
    expect(await findByText("Category 2")).toBeInTheDocument();
  });

  it("creates a new category successfully", async () => {
    const newCategory = { _id: "cat-3", name: "Category 3" };
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });

    // Second call after creation
    axios.get.mockResolvedValueOnce({
      data: { category: [...mockCategories, newCategory], success: true },
    });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByPlaceholderText, getAllByRole, findByText } = render(
      <CreateCategory />
    );
    const input = getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "Category 3" } });
    // Get the first submit button (main form)
    const submitButtons = getAllByRole("button", { name: /submit/i });
    fireEvent.click(submitButtons[0]);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Category 3 is created")
    );
    expect(await findByText("Category 3")).toBeInTheDocument();
  });

  it("updates an existing category successfully", async () => {
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });

    // Second call after update
    const updatedCategory = { _id: "cat-1", name: "Updated Category 1" };
    axios.get.mockResolvedValueOnce({
      data: { category: [updatedCategory, mockCategories[1]], success: true },
    });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    const { getByRole, findByText } = render(<CreateCategory />);
    
    // Wait for category to appear, then find its row
    const categoryCell = await findByText("Category 1");
    const row = categoryCell.closest("tr");
    
    // Click edit button within that row
    const editButton = within(row).getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);
    
    const inputs = document.querySelectorAll('input[placeholder="Enter new category"]');
    fireEvent.change(inputs[1], { target: { value: "Updated Category 1" } });
    
    // Get all submit buttons and click the second one (modal submit)
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    fireEvent.click(submitButtons[1]);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Updated Category 1 is updated"
      )
    );
    expect(await findByText("Updated Category 1")).toBeInTheDocument();
  });

  it("deletes a category successfully", async () => {
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });

    // Second call after delete
    axios.get.mockResolvedValueOnce({
      data: { category: [mockCategories[1]], success: true },
    });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    const { findByText, queryByText } = render(<CreateCategory />);
    
    // Wait for category to appear, then find its row
    const categoryCell = await findByText("Category 1");
    const row = categoryCell.closest("tr");
    
    // Click delete button within that row
    const deleteButton = within(row).getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Category is deleted")
    );
    await waitFor(() =>
      expect(queryByText("Category 1")).not.toBeInTheDocument()
    );
  });

  it("does not display any categories when fetching returns success false", async () => {
    axios.get.mockResolvedValueOnce({
      data: { category: [], success: false },
    });

    const { queryByText } = render(<CreateCategory />);

    // Wait for the async effect to complete
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(queryByText("Category 1")).not.toBeInTheDocument();
    expect(queryByText("Category 2")).not.toBeInTheDocument();
  });

  it("logs error when fetching categories fails", async () => {
    const error = new Error("Fetch failed");
    axios.get.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    render(<CreateCategory />);

    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(error));
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong in getting all categories"
    );
  });

  it("shows error toast when creating category returns success false", async () => {
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });
    axios.post.mockResolvedValueOnce({
      data: { message: "Create category error", success: false },
    });

    const { getByPlaceholderText, getAllByRole } = render(<CreateCategory />);
    const input = getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "New Category" } });
    const submitButtons = getAllByRole("button", { name: /submit/i });
    fireEvent.click(submitButtons[0]);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Create category error")
    );
  });

  it("logs error when creating category fails", async () => {
    const error = new Error("Create failed");
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });
    axios.post.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { getByPlaceholderText, getAllByRole } = render(<CreateCategory />);
    const input = getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "New Category" } });
    const submitButtons = getAllByRole("button", { name: /submit/i });
    fireEvent.click(submitButtons[0]);

    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(error));
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong in input form"
    );
  });

  it("shows error toast when updating category returns success false", async () => {
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });

    axios.put.mockResolvedValueOnce({
      data: { message: "Update category error", success: false },
    });

    const { findByText } = render(<CreateCategory />);

    // Wait for category to appear, then find its row
    const categoryCell = await findByText("Category 1");
    const row = categoryCell.closest("tr");
    
    // Click edit button within that row
    const editButton = within(row).getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);
    
    const inputs = document.querySelectorAll('input[placeholder="Enter new category"]');
    fireEvent.change(inputs[1], { target: { value: "Updated Category 1" } });
    
    // Get all submit buttons and click the second one (modal submit)
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    fireEvent.click(submitButtons[1]);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Update category error")
    );
  });

  it("shows error toast when updating category fails", async () => {
    const error = new Error("Update failed");
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });
    axios.put.mockRejectedValueOnce(error);

    const { findByText } = render(<CreateCategory />);

    // Wait for category to appear, then find its row
    const categoryCell = await findByText("Category 1");
    const row = categoryCell.closest("tr");
    
    // Click edit button within that row
    const editButton = within(row).getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);
    
    const inputs = document.querySelectorAll('input[placeholder="Enter new category"]');
    fireEvent.change(inputs[1], { target: { value: "Updated Category 1" } });
    
    // Get all submit buttons and click the second one (modal submit)
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    fireEvent.click(submitButtons[1]);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in updating category"
      )
    );
  });

  it("shows error toast when deleting category returns success false", async () => {
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });
    axios.delete.mockResolvedValueOnce({
      data: { message: "Delete category error", success: false },
    });

    const { findByText } = render(<CreateCategory />);
    
    // Wait for category to appear, then find its row
    const categoryCell = await findByText("Category 1");
    const row = categoryCell.closest("tr");
    
    // Click delete button within that row
    const deleteButton = within(row).getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Delete category error")
    );
  });

  it("show error toast when deleting category fails", async () => {
    const error = new Error("Delete failed");
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });
    axios.delete.mockRejectedValueOnce(error);

    const { findByText } = render(<CreateCategory />);
    
    // Wait for category to appear, then find its row
    const categoryCell = await findByText("Category 1");
    const row = categoryCell.closest("tr");
    
    // Click delete button within that row
    const deleteButton = within(row).getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in deleting category"
      )
    );
  });

  it("closes the modal when cancel button is clicked", async () => {
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });

    const { findByText, getByLabelText, queryByLabelText } = render(<CreateCategory />);

    // Wait for category to appear, then find its row
    const categoryCell = await findByText("Category 1");
    const row = categoryCell.closest("tr");
    
    // Click edit button within that row
    const editButton = within(row).getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(getByLabelText("Close")).toBeInTheDocument();
    });
  
    // Click the close button in the modal
    const closeButton = getByLabelText("Close");
    fireEvent.click(closeButton);

    await waitFor(() => {
      const closeBtn = queryByLabelText("Close");
      if (closeBtn) {
        expect(closeBtn.closest('.ant-modal-wrap')).toHaveStyle({ display: 'none' });
      } else {
        expect(closeBtn).not.toBeInTheDocument();
      }
    });
  });
});
