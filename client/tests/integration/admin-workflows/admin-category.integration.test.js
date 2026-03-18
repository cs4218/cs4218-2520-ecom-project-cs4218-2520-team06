// Gallen Ong, A0252614L
// Full-stack integration test for admin category creation and listing workflow
import React from "react";
import { render, fireEvent, waitFor, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../../src/context/auth.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "../../../src/pages/admin/CreateCategory.js";

jest.mock("axios");
jest.mock("react-hot-toast");

const adminUser = {
	name: "Admin User",
	email: "admin@test.com",
	phone: "1234567890",
	role: 1,
};
const mockToken = "mock-admin-token";

const mockCategories = [
	{ _id: "cat-1", name: "Electronics", slug: "electronics" },
	{ _id: "cat-2", name: "Books", slug: "books" },
];

const mockCategoryRequest = (categories) => {
	axios.get.mockImplementation((url) => {
		if (url === "/api/v1/category/get-category") {
			return Promise.resolve({
				data: { success: true, category: categories },
			});
		}

		return Promise.resolve({ data: {} });
	});
};

const getCategoryTable = () => screen.getByRole("table");

const waitForCategoryInTable = async (categoryName) => {
	await waitFor(() => {
		expect(within(getCategoryTable()).getByText(categoryName)).toBeInTheDocument();
	});
};

const renderWithProviders = (initialPath = "/dashboard/admin/create-category") => {
	return render(
		<AuthProvider>
			<SearchProvider>
				<CartProvider>
					<MemoryRouter initialEntries={[initialPath]}>
						<Routes>
							<Route
								path="/dashboard/admin/create-category"
								element={<CreateCategory />}
							/>
						</Routes>
					</MemoryRouter>
				</CartProvider>
			</SearchProvider>
		</AuthProvider>
	);
};

describe("Admin Create Category and List Workflow (Full-Stack)", () => {
	beforeAll(() => {
		localStorage.setItem(
			"auth",
			JSON.stringify({
				user: adminUser,
				token: mockToken,
			})
		);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		localStorage.removeItem("auth");
	});

	it("creates a category and verifies it appears in categories list", async () => {
		// Step 1: Mock initial category fetch
		mockCategoryRequest(mockCategories);

		// Step 2: Render CreateCategory page
		const { getByPlaceholderText, getByText } =
			renderWithProviders("/dashboard/admin/create-category");

		// Step 3: Wait for page to load with existing categories
		await waitForCategoryInTable("Electronics");
		await waitForCategoryInTable("Books");

		// Step 4: Mock category creation endpoint
		axios.post.mockResolvedValueOnce({
			data: { success: true, message: "Category created" },
		});

		// Step 5: Mock refetch after creation
		const updatedCategories = [
			...mockCategories,
			{ _id: "cat-3", name: "Gadgets", slug: "gadgets" },
		];
		mockCategoryRequest(updatedCategories);

		// Step 6: Fill in and submit form
		fireEvent.change(getByPlaceholderText("Enter new category"), {
			target: { value: "Gadgets" },
		});
		fireEvent.click(getByText("Submit"));

		// Step 7: Verify creation was successful
		await waitFor(() => {
			expect(axios.post).toHaveBeenCalledTimes(1);
			expect(toast.success).toHaveBeenCalledWith("Gadgets is created");
		});

		// Step 8: Verify new category appears in list
		await waitForCategoryInTable("Gadgets");
	});

	it("shows error when category creation fails", async () => {
		mockCategoryRequest(mockCategories);

		const { getByPlaceholderText, getByText } =
			renderWithProviders("/dashboard/admin/create-category");

		await waitForCategoryInTable("Electronics");

		// Mock failed creation
		axios.post.mockResolvedValueOnce({
			data: {
				success: false,
				message: "Category name already exists",
			},
		});

		fireEvent.change(getByPlaceholderText("Enter new category"), {
			target: { value: "Electronics" }, // Duplicate name
		});
		fireEvent.click(getByText("Submit"));

		// Verify error was displayed
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Category name already exists"
			);
		});
	});

	it("handles network errors during category creation", async () => {
		mockCategoryRequest(mockCategories);

		const { getByPlaceholderText, getByText } =
			renderWithProviders("/dashboard/admin/create-category");

		await waitForCategoryInTable("Electronics");

		// Mock network error
		axios.post.mockRejectedValueOnce(new Error("Network error"));

		fireEvent.change(getByPlaceholderText("Enter new category"), {
			target: { value: "New Category" },
		});
		fireEvent.click(getByText("Submit"));

		// Verify error handling
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Something went wrong in input form"
			);
		});
	});

	it("updates a category in the list", async () => {
		mockCategoryRequest(mockCategories);

		const { getByDisplayValue } =
			renderWithProviders("/dashboard/admin/create-category");

		await waitForCategoryInTable("Electronics");

		const table = getCategoryTable();
		const categoryCell = within(table).getByText("Electronics");
		const row = categoryCell.closest("tr");
		fireEvent.click(within(row).getByRole("button", { name: /edit/i }));

		// Wait for modal to appear and fill in new name
		await waitFor(() => {
			expect(getByDisplayValue("Electronics")).toBeInTheDocument();
		});

		fireEvent.change(getByDisplayValue("Electronics"), {
			target: { value: "Consumer Electronics" },
		});

		// Mock successful update
		axios.put.mockResolvedValueOnce({
			data: { success: true, message: "Category updated" },
		});

		// Mock refetch after update
		const updatedCategories = [
			{ _id: "cat-1", name: "Consumer Electronics", slug: "consumer-electronics" },
			mockCategories[1],
		];
		mockCategoryRequest(updatedCategories);

		const dialog = await screen.findByRole("dialog");
		fireEvent.click(within(dialog).getByRole("button", { name: /submit/i }));

		// Verify update was successful
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"Consumer Electronics is updated"
			);
		});

		// Verify updated category appears in list
		await waitForCategoryInTable("Consumer Electronics");
	});

	it("deletes a category from the list", async () => {
		mockCategoryRequest(mockCategories);

		axios.delete.mockResolvedValueOnce({
			data: { success: true, message: "Category deleted" },
		});

		window.confirm = jest.fn(() => true);

		const { getByText, queryByText } =
			renderWithProviders("/dashboard/admin/create-category");

		await waitForCategoryInTable("Electronics");

		const table = getCategoryTable();
		const categoryCell = within(table).getByText("Electronics");
		const row = categoryCell.closest("tr");
		mockCategoryRequest([mockCategories[1]]);
		fireEvent.click(within(row).getByRole("button", { name: /delete/i }));

		// Confirm deletion
		expect(window.confirm).toHaveBeenCalled();

		// Wait for deletion to complete
		await waitFor(() => {
			expect(axios.delete).toHaveBeenCalledTimes(1);
			expect(toast.success).toHaveBeenCalledWith("Category is deleted");
		});

		// Verify deleted category is gone
		await waitFor(() => {
			expect(within(getCategoryTable()).queryByText("Electronics")).not.toBeInTheDocument();
			expect(within(getCategoryTable()).getByText("Books")).toBeInTheDocument();
		});
	});

	it("handles deletion cancellation", async () => {
		mockCategoryRequest(mockCategories);

		window.confirm = jest.fn(() => false); // User cancels

		renderWithProviders("/dashboard/admin/create-category");

		await waitForCategoryInTable("Electronics");

		const table = getCategoryTable();
		const categoryCell = within(table).getByText("Electronics");
		const row = categoryCell.closest("tr");
		fireEvent.click(within(row).getByRole("button", { name: /delete/i }));

		// Verify confirmation was shown
		expect(window.confirm).toHaveBeenCalled();

		// Verify delete API was not called
		await waitFor(() => {
			expect(axios.delete).not.toHaveBeenCalled();
		});

		// Verify category still exists
		expect(within(getCategoryTable()).getByText("Electronics")).toBeInTheDocument();
	});
});
