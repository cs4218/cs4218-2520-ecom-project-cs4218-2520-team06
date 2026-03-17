// Gallen Ong, A0252614L
// Full-stack integration test for admin product update and verification workflow
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../../src/context/auth.js";
import { CartProvider } from "../../../src/context/cart.js";
import { SearchProvider } from "../../../src/context/search.js";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "../../../src/pages/admin/UpdateProduct.js";
import Products from "../../../src/pages/admin/Products.js";

jest.mock("axios");
jest.mock("react-hot-toast");

const adminUser = {
	name: "Admin User",
	email: "admin@test.com",
	phone: "1234567890",
	role: 1,
};

const mockCategories = [
	{ _id: "cat-1", name: "Electronics", slug: "electronics" },
	{ _id: "cat-2", name: "Gadgets", slug: "gadgets" },
];

const mockProduct = {
	_id: "prod-1",
	slug: "original-laptop",
	name: "Original Laptop",
	description: "A basic laptop",
	price: 999.99,
	quantity: 10,
	shipping: "0",
	category: { _id: "cat-1", name: "Electronics" },
	photo: "photo-url",
};

const renderWithProviders = (initialPath = "/dashboard/admin/product/original-laptop") =>
	render(
		<AuthProvider>
			<SearchProvider>
				<CartProvider>
					<MemoryRouter initialEntries={[initialPath]}>
						<Routes>
							<Route
								path="/dashboard/admin/product/:slug"
								element={<UpdateProduct />}
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

describe("Admin Update Product and Verify Workflow (Full-Stack)", () => {
	beforeAll(() => {
		localStorage.setItem(
			"auth",
			JSON.stringify({ user: adminUser, token: "mock-admin-token" })
		);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		localStorage.removeItem("auth");
	});

	it("updates a product and verifies changes appear in products list", async () => {
		let currentProducts = [mockProduct];

		axios.get.mockImplementation((url) => {
			if (url === "/api/v1/category/get-category") {
				return Promise.resolve({ data: { success: true, category: mockCategories } });
			}

			if (url === "/api/v1/product/get-product/original-laptop") {
				return Promise.resolve({ data: { product: mockProduct } });
			}

			if (url === "/api/v1/product/get-product") {
				return Promise.resolve({ data: { products: currentProducts } });
			}

			return Promise.resolve({ data: {} });
		});

		axios.put.mockImplementationOnce(async () => {
			currentProducts = [
				{
					...mockProduct,
					slug: "updated-premium-laptop",
					name: "Updated Premium Laptop",
					description: "A premium laptop with updates",
					price: 1299.99,
				},
			];

			return { data: { success: true, message: "Product updated successfully" } };
		});

		const { getByDisplayValue, getByText, getByRole } = renderWithProviders();

		await waitFor(() => {
			expect(getByDisplayValue(mockProduct.name)).toBeInTheDocument();
			expect(getByDisplayValue(mockProduct.price.toString())).toBeInTheDocument();
		});

		fireEvent.change(getByDisplayValue(mockProduct.name), {
			target: { value: "Updated Premium Laptop" },
		});
		fireEvent.change(getByDisplayValue(mockProduct.description), {
			target: { value: "A premium laptop with updates" },
		});
		fireEvent.change(getByDisplayValue(mockProduct.price.toString()), {
			target: { value: "1299.99" },
		});

		fireEvent.click(getByText("UPDATE PRODUCT"));

		await waitFor(() => {
			expect(axios.put).toHaveBeenCalledTimes(1);
			expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
		});

		await waitFor(() => {
			expect(getByRole("heading", { name: /all products list/i })).toBeInTheDocument();
			expect(getByText("Updated Premium Laptop")).toBeInTheDocument();
			expect(getByText("A premium laptop with updates")).toBeInTheDocument();
		});
	});

	it("handles update failure gracefully and stays on update page", async () => {
		const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

		axios.get.mockImplementation((url) => {
			if (url === "/api/v1/category/get-category") {
				return Promise.resolve({ data: { success: true, category: mockCategories } });
			}

			if (url === "/api/v1/product/get-product/original-laptop") {
				return Promise.resolve({ data: { product: mockProduct } });
			}

			return Promise.resolve({ data: {} });
		});

		axios.put.mockResolvedValueOnce({
			data: { success: false, message: "Price must be positive" },
		});

		const { getByDisplayValue, getByText, getByRole } = renderWithProviders();

		await waitFor(() => {
			expect(getByDisplayValue(mockProduct.name)).toBeInTheDocument();
		});

		fireEvent.change(getByDisplayValue(mockProduct.name), {
			target: { value: "Failed Update" },
		});
		fireEvent.change(getByDisplayValue(mockProduct.price.toString()), {
			target: { value: "-50" },
		});

		fireEvent.click(getByText("UPDATE PRODUCT"));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Price must be positive");
			expect(getByRole("heading", { name: /update product/i })).toBeInTheDocument();
			expect(getByDisplayValue("Failed Update")).toBeInTheDocument();
		});

		logSpy.mockRestore();
	});

	it("handles network errors during product update", async () => {
		const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

		axios.get.mockImplementation((url) => {
			if (url === "/api/v1/category/get-category") {
				return Promise.resolve({ data: { success: true, category: mockCategories } });
			}

			if (url === "/api/v1/product/get-product/original-laptop") {
				return Promise.resolve({ data: { product: mockProduct } });
			}

			return Promise.resolve({ data: {} });
		});

		axios.put.mockRejectedValueOnce(new Error("Network timeout"));

		const { getByDisplayValue, getByText } = renderWithProviders();

		await waitFor(() => {
			expect(getByDisplayValue(mockProduct.name)).toBeInTheDocument();
		});

		fireEvent.change(getByDisplayValue(mockProduct.name), {
			target: { value: "Network Error Product" },
		});

		fireEvent.click(getByText("UPDATE PRODUCT"));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Something went wrong");
		});

		logSpy.mockRestore();
	});
});
