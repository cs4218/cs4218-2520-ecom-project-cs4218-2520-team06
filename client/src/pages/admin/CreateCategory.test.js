import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
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

    const { getByPlaceholderText, getByText, findByText } = render(
      <CreateCategory />
    );
    const input = getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "Category 3" } });
    const button = getByText("Submit");
    fireEvent.click(button);

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

    const { getAllByText, getAllByPlaceholderText, findByText, findAllByText } =
      render(<CreateCategory />);
    const editButtons = await findAllByText("Edit");
    fireEvent.click(editButtons[0]);
    const inputs = getAllByPlaceholderText("Enter new category");
    fireEvent.change(inputs[1], { target: { value: "Updated Category 1" } });
    const submitButtons = getAllByText("Submit");
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

    const { findAllByText, queryByText } = render(<CreateCategory />);
    const deleteButtons = await findAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Category is deleted")
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
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

    const { getByPlaceholderText, getByText } = render(<CreateCategory />);
    const input = getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "New Category" } });
    const button = getByText("Submit");
    fireEvent.click(button);

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

    const { getByPlaceholderText, getByText } = render(<CreateCategory />);
    const input = getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "New Category" } });
    const button = getByText("Submit");
    fireEvent.click(button);

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

    const { getAllByText, getAllByPlaceholderText, findAllByText } = render(
      <CreateCategory />
    );

    const editButtons = await findAllByText("Edit");
    fireEvent.click(editButtons[0]);
    const inputs = getAllByPlaceholderText("Enter new category");
    fireEvent.change(inputs[1], { target: { value: "Updated Category 1" } });
    const submitButtons = getAllByText("Submit");
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

    const { getAllByText, getAllByPlaceholderText, findAllByText } = render(
      <CreateCategory />
    );

    const editButtons = await findAllByText("Edit");
    fireEvent.click(editButtons[0]);
    const inputs = getAllByPlaceholderText("Enter new category");
    fireEvent.change(inputs[1], { target: { value: "Updated Category 1" } });
    const submitButtons = getAllByText("Submit");
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

    const { findAllByText } = render(<CreateCategory />);
    const deleteButtons = await findAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

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

    const { findAllByText } = render(<CreateCategory />);
    const deleteButtons = await findAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

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

    const {
      getAllByPlaceholderText,
      queryAllByPlaceholderText,
      findAllByText,
      getByLabelText,
    } = render(<CreateCategory />);

    const editButtons = await findAllByText("Edit");
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      const inputs = getAllByPlaceholderText("Enter new category");
      expect(inputs.length).toBe(2); // One in main form, one in modal
      expect(inputs[1]).toBeVisible(); // Modal input is visible
    });

    const closeButton = getByLabelText("Close");
    fireEvent.click(closeButton);

    await waitFor(() => {
      const inputs = getAllByPlaceholderText("Enter new category");
      expect(inputs[1]).not.toBeVisible(); // Modal input is hidden
    });
  });
});
