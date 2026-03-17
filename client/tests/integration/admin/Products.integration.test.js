// Gallen Ong, A0252614L
// Isolated integration tests for Products List page
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Products from "../../../src/pages/admin/Products";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../../src/components/Header", () => () => <div>Header</div>);
jest.mock("../../../src/components/Footer", () => () => <div>Footer</div>);

const mockProducts = [
	{
		_id: "prod-1",
		name: "Laptop",
		description: "A powerful laptop",
		slug: "laptop",
	},
	{
		_id: "prod-2",
		name: "Mouse",
		description: "Wireless mouse",
		slug: "mouse",
	},
];

const renderPage = () =>
	render(
		<MemoryRouter>
			<Products />
		</MemoryRouter>
	);

describe("Products List Frontend Integration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("fetches and displays products on mount", async () => {
		axios.get.mockResolvedValueOnce({
			data: { products: mockProducts },
		});

		const { findByText } = renderPage();

		// Wait for product descriptions to render (unique text)
		await findByText("A powerful laptop");
		await findByText("Wireless mouse");

		expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
	});

	it("displays product list header", async () => {
		axios.get.mockResolvedValueOnce({
			data: { products: mockProducts },
		});

		const { getByRole } = renderPage();

		await waitFor(() => {
			const heading = getByRole("heading", { name: /all products list/i });
			expect(heading).toBeInTheDocument();
		});
	});

	it("creates links to product edit pages", async () => {
		axios.get.mockResolvedValueOnce({
			data: { products: mockProducts },
		});

		const { getAllByRole, findByText } = renderPage();

		// Wait for products to render
		await findByText("A powerful laptop");

		// Verify product links exist with correct href
		const links = getAllByRole("link");
		const productLinks = links.filter(
			(link) =>
				link.getAttribute("href")?.includes("/dashboard/admin/product/")
		);

		expect(productLinks.length).toBe(2);
		expect(productLinks[0]).toHaveAttribute(
			"href",
			"/dashboard/admin/product/laptop"
		);
		expect(productLinks[1]).toHaveAttribute(
			"href",
			"/dashboard/admin/product/mouse"
		);
	});

	it("displays empty list when no products exist", async () => {
		axios.get.mockResolvedValueOnce({
			data: { products: [] },
		});

		const { queryByText } = renderPage();

		await waitFor(() => {
			expect(axios.get).toHaveBeenCalled();
		});

		expect(queryByText("Laptop")).not.toBeInTheDocument();
		expect(queryByText("Mouse")).not.toBeInTheDocument();
	});

	it("shows error toast when fetching products fails", async () => {
		const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
		axios.get.mockRejectedValueOnce(new Error("network error"));

		renderPage();

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
		});

		logSpy.mockRestore();
	});
});
