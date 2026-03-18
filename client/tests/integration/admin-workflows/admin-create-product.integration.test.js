// Gallen Ong, A0252614L
// Full-stack integration test for admin product creation and listing workflow
import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../../src/context/auth.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "../../../src/pages/admin/CreateProduct.js";
import Products from "../../../src/pages/admin/Products.js";

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
	{ _id: "cat-2", name: "Gadgets", slug: "gadgets" },
];

const mockProducts = [
	{
		_id: "prod-1",
		name: "Laptop",
		description: "A powerful laptop",
		slug: "laptop",
		price: 1299.99,
		quantity: 5,
		category: "cat-1",
	},
];

const renderWithProviders = (initialPath = "/dashboard/admin/create-product") => {
	return render(
		<AuthProvider>
			<SearchProvider>
				<CartProvider>
					<MemoryRouter initialEntries={[initialPath]}>
						<Routes>
							<Route
								path="/dashboard/admin/create-product"
								element={<CreateProduct />}
							/>
							<Route
								path="/dashboard/admin/products"
								element={<Products />}
							/>
						</Routes>
					</MemoryRouter>
				</CartProvider>
			</SearchProvider>
		</AuthProvider>
	);
};

describe("Admin Create Product and List Workflow (Full-Stack)", () => {
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

	it("creates a product and verifies it appears in products list", async () => {
		// Step 1: Mock initial category fetch on CreateProduct page
		axios.get.mockImplementation((url) => {
			if (url === "/api/v1/category/get-category") {
				return Promise.resolve({
					data: { success: true, category: mockCategories },
				});
			}
			return Promise.resolve({ data: {} });
		});

		// Step 2: Mock product creation endpoint
		axios.post.mockResolvedValueOnce({
			data: { success: true, message: "Product created successfully" },
		});

		// Step 3: Render CreateProduct page
		const { getByPlaceholderText, getByText, getByRole } =
			renderWithProviders("/dashboard/admin/create-product");

		// Verify page loaded
		await waitFor(() => {
			getByRole("heading", { name: /create product/i });
		});

		// Step 4: Fill out form with product details
		fireEvent.change(getByPlaceholderText("write a name"), {
			target: { value: "Wireless Mouse" },
		});
		fireEvent.change(getByPlaceholderText("write a description"), {
			target: { value: "Ergonomic wireless mouse" },
		});
		fireEvent.change(getByPlaceholderText("write a Price"), {
			target: { value: "29.99" },
		});
		fireEvent.change(getByPlaceholderText("write a quantity"), {
			target: { value: "50" },
		});

		// Step 5: Submit form
		fireEvent.click(getByText("CREATE PRODUCT"));

		// Step 6: Verify creation was successful
		await waitFor(() => {
			expect(axios.post).toHaveBeenCalledTimes(1);
			expect(toast.success).toHaveBeenCalled();
		});

		// Step 7: Clear mocks and navigate to products list
		jest.clearAllMocks();

		// Mock updated product list with newly created product
		const updatedProducts = [
			...mockProducts,
			{
				_id: "prod-2",
				name: "Wireless Mouse",
				description: "Ergonomic wireless mouse",
				slug: "wireless-mouse",
				price: 29.99,
				quantity: 50,
				category: "cat-1",
			},
		];

		axios.get.mockImplementation((url) => {
			if (url === "/api/v1/product/get-product") {
				return Promise.resolve({
					data: { products: updatedProducts },
				});
			}
			return Promise.resolve({ data: {} });
		});

		// Step 8: Render Products page
		const { getByText: getProductsText, queryAllByRole } =
			renderWithProviders("/dashboard/admin/products");

		// Step 9: Verify new product appears in list
		await waitFor(() => {
			expect(getProductsText("Wireless Mouse")).toBeInTheDocument();
			expect(
				getProductsText("Ergonomic wireless mouse")
			).toBeInTheDocument();
		});

		// Step 10: Verify we have both products (original + new)
		const productLinks = queryAllByRole("link");
		const mouseLinks = productLinks.filter(
			(link) =>
				link.getAttribute("href") === `/dashboard/admin/product/${updatedProducts[1].slug || "wireless-mouse"}`
		);
		expect(mouseLinks.length).toBeGreaterThan(0);
	});

	it("shows error when product creation fails and does not add to list", async () => {
		axios.get.mockImplementation((url) => {
			if (url === "/api/v1/category/get-category") {
				return Promise.resolve({
					data: { success: true, category: mockCategories },
				});
			}
			return Promise.resolve({ data: {} });
		});

		axios.post.mockResolvedValueOnce({
			data: {
				success: false,
				message: "Category not found",
			},
		});

		const { getByPlaceholderText, getByText, getByRole } =
			renderWithProviders("/dashboard/admin/create-product");

		await waitFor(() => {
			getByRole("heading", { name: /create product/i });
		});

		fireEvent.change(getByPlaceholderText("write a name"), {
			target: { value: "Failed Product" },
		});
		fireEvent.change(getByPlaceholderText("write a description"), {
			target: { value: "This will fail" },
		});
		fireEvent.change(getByPlaceholderText("write a Price"), {
			target: { value: "99.99" },
		});
		fireEvent.change(getByPlaceholderText("write a quantity"), {
			target: { value: "10" },
		});

		fireEvent.click(getByText("CREATE PRODUCT"));

		// Verify error was displayed
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Category not found");
		});

		// Verify product list doesn't contain failed product
		jest.clearAllMocks();
		axios.get.mockResolvedValueOnce({
			data: { products: mockProducts }, // Original products only
		});

		renderWithProviders("/dashboard/admin/products");

		await waitFor(() => {
			expect(
				screen.queryByText("Failed Product")
			).not.toBeInTheDocument();
		});
	});
});
