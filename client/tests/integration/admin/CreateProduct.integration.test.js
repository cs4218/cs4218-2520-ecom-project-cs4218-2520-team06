// Gallen Ong, A0252614L
// Isolated integration tests for CreateProduct page
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "../../../src/pages/admin/CreateProduct";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../../src/components/Header", () => () => <div>Header</div>);
jest.mock("../../../src/components/Footer", () => () => <div>Footer</div>);

const mockCategories = [
	{ _id: "cat-1", name: "Electronics" },
	{ _id: "cat-2", name: "Books" },
];

const renderPage = () =>
	render(
		<MemoryRouter>
			<CreateProduct />
		</MemoryRouter>
	);

describe("Create Product Page Integration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("loads categories on mount with real routing context", async () => {
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: mockCategories },
		});

		const { getByRole, getByText } = renderPage();

		await waitFor(() => {
			getByRole("heading", { name: /create product/i });
			expect(getByText("Select a category")).toBeInTheDocument();
			expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
		});
	});

	it("submits form with page routing", async () => {
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: mockCategories },
		});
		axios.post.mockResolvedValueOnce({ data: { success: true } });

		const { getByPlaceholderText, getByText, getByRole } = renderPage();

		await waitFor(() => {
			getByRole("heading", { name: /create product/i });
			expect(getByText("Select a category")).toBeInTheDocument();
		});

		fireEvent.change(getByPlaceholderText("write a name"), {
			target: { value: "Test Product" },
		});
		fireEvent.change(getByPlaceholderText("write a description"), {
			target: { value: "A test product" },
		});
		fireEvent.change(getByPlaceholderText("write a Price"), {
			target: { value: "99.99" },
		});
		fireEvent.change(getByPlaceholderText("write a quantity"), {
			target: { value: "10" },
		});

		fireEvent.click(getByText("CREATE PRODUCT"));

		await waitFor(() => {
			expect(axios.post).toHaveBeenCalledTimes(1);
		});
	});
});
