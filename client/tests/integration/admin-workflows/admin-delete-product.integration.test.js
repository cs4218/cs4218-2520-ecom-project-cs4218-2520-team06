// Gallen Ong, A0252614L
// Full-stack integration test for admin delete product and verification workflow
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
];

const mockProduct = {
	_id: "prod-1",
	slug: "product-to-delete",
	name: "Product to Delete",
	description: "This product will be deleted",
	price: 49.99,
	quantity: 5,
	shipping: "0",
	category: { _id: "cat-1", name: "Electronics" },
};

const renderWithProviders = (initialPath = "/dashboard/admin/product/product-to-delete") =>
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

describe("Admin Delete Product and Verify Workflow (Full-Stack)", () => {
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

	it("deletes a product and navigates to the products list", async () => {
		let currentProducts = [
			mockProduct,
			{
				_id: "prod-2",
				slug: "remaining-product",
				name: "Remaining Product",
				description: "This will remain",
			},
		];

		axios.get.mockImplementation((url) => {
			if (url === "/api/v1/category/get-category") {
				return Promise.resolve({
					data: { success: true, category: mockCategories },
				});
			}

			if (url === "/api/v1/product/get-product/product-to-delete") {
				return Promise.resolve({ data: { product: mockProduct } });
			}

			if (url === "/api/v1/product/get-product") {
				return Promise.resolve({ data: { products: currentProducts } });
			}

			return Promise.resolve({ data: {} });
		});

		axios.delete.mockImplementationOnce(async () => {
			currentProducts = currentProducts.filter((product) => product._id !== mockProduct._id);
			return { data: { success: true, message: "Product deleted successfully" } };
		});

		const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
		const { getByText, getByPlaceholderText, getByRole, queryByText } = renderWithProviders();

		await waitFor(() => {
			expect(getByRole("heading", { name: /update product/i })).toBeInTheDocument();
			expect(getByPlaceholderText("write a name").value).toBe("Product to Delete");
		});

		fireEvent.click(getByText("DELETE PRODUCT"));

		await waitFor(() => {
			expect(confirmSpy).toHaveBeenCalled();
			expect(axios.delete).toHaveBeenCalledTimes(1);
			expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
		});

		await waitFor(() => {
			expect(getByRole("heading", { name: /all products list/i })).toBeInTheDocument();
			expect(getByText("Remaining Product")).toBeInTheDocument();
			expect(queryByText("Product to Delete")).not.toBeInTheDocument();
		});

		confirmSpy.mockRestore();
	});

	it("shows an error when deletion fails", async () => {
		axios.get.mockImplementation((url) => {
			if (url === "/api/v1/category/get-category") {
				return Promise.resolve({
					data: { success: true, category: mockCategories },
				});
			}

			if (url === "/api/v1/product/get-product/product-to-delete") {
				return Promise.resolve({ data: { product: mockProduct } });
			}

			return Promise.resolve({ data: {} });
		});

		axios.delete.mockResolvedValueOnce({
			data: {
				success: false,
				message: "Cannot delete product with pending orders",
			},
		});

		const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
		const { getByText, getByPlaceholderText } = renderWithProviders();

		await waitFor(() => {
			expect(getByPlaceholderText("write a name").value).toBe("Product to Delete");
		});

		fireEvent.click(getByText("DELETE PRODUCT"));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Cannot delete product with pending orders");
		});

		confirmSpy.mockRestore();
	});

	it("handles network errors during product deletion", async () => {
		const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

		axios.get.mockImplementation((url) => {
			if (url === "/api/v1/category/get-category") {
				return Promise.resolve({
					data: { success: true, category: mockCategories },
				});
			}

			if (url === "/api/v1/product/get-product/product-to-delete") {
				return Promise.resolve({ data: { product: mockProduct } });
			}

			return Promise.resolve({ data: {} });
		});

		axios.delete.mockRejectedValueOnce(new Error("Network connection lost"));

		const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
		const { getByText, getByPlaceholderText } = renderWithProviders();

		await waitFor(() => {
			expect(getByPlaceholderText("write a name").value).toBe("Product to Delete");
		});

		fireEvent.click(getByText("DELETE PRODUCT"));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Something went wrong");
		});

		confirmSpy.mockRestore();
		logSpy.mockRestore();
	});
});
