// Gallen Ong, A0252614L
// Isolated integration tests for Product Update and Delete
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import UpdateProduct from "../../../src/pages/admin/UpdateProduct";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../../src/components/Header", () => () => <div>Header</div>);
jest.mock("../../../src/components/Footer", () => () => <div>Footer</div>);

const mockCategories = [
	{ _id: "cat-1", name: "Electronics" },
	{ _id: "cat-2", name: "Books" },
];

const mockProduct = {
	_id: "prod-1",
	name: "Original Product",
	description: "Original description",
	price: "50.00",
	quantity: "5",
	shipping: "1",
	category: { _id: "cat-1" },
	slug: "original-product",
};

const renderPage = () =>
	render(
		<MemoryRouter initialEntries={["/dashboard/admin/product/original-product"]}>
			<Routes>
				<Route
					path="/dashboard/admin/product/:slug"
					element={<UpdateProduct />}
				/>
			</Routes>
		</MemoryRouter>
	);

describe("Product Update and Delete (Page Integration)", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("loads product data on mount with real routing context", async () => {
		axios.get.mockResolvedValueOnce({
			data: { product: mockProduct },
		});
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: mockCategories },
		});

		const { getByText, getByDisplayValue } = renderPage();

		await waitFor(() => {
			getByText("Update Product");
			getByDisplayValue(mockProduct.name);
		});
	});

	it("submits product update with page routing", async () => {
		axios.get.mockResolvedValueOnce({
			data: { product: mockProduct },
		});
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: mockCategories },
		});
		axios.put.mockResolvedValueOnce({ data: { success: true } });

		const { getByDisplayValue, getByText, findByText } = renderPage();

		await findByText((content, element) => content.includes("Update Product"));
		await waitFor(() => {
			expect(getByDisplayValue(mockProduct.name)).toBeInTheDocument();
		});

		const nameInput = getByDisplayValue(mockProduct.name);
		fireEvent.change(nameInput, { target: { value: "Updated Product" } });

		fireEvent.click(getByText("UPDATE PRODUCT"));

		await waitFor(() => {
			expect(axios.put).toHaveBeenCalledTimes(1);
		});
	});

	it("deletes product after confirmation with page routing", async () => {
		axios.get.mockResolvedValueOnce({
			data: { product: mockProduct },
		});
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: mockCategories },
		});
		axios.delete.mockResolvedValueOnce({ data: { success: true } });
		const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");

		const { getByText, findByText } = renderPage();
		await findByText((content, element) => content.includes("Update Product"));

		fireEvent.click(getByText("DELETE PRODUCT"));

		await waitFor(() => {
			expect(promptSpy).toHaveBeenCalled();
			expect(axios.delete).toHaveBeenCalledTimes(1);
		});

		promptSpy.mockRestore();
	});

	it("respects user cancellation in product delete confirmation", async () => {
		axios.get.mockResolvedValueOnce({
			data: { product: mockProduct },
		});
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: mockCategories },
		});
		const promptSpy = jest.spyOn(window, "prompt").mockReturnValue(null);

		const { getByText, findByText } = renderPage();
		await findByText((content, element) => content.includes("Update Product"));

		fireEvent.click(getByText("DELETE PRODUCT"));

		await waitFor(() => {
			expect(promptSpy).toHaveBeenCalled();
		});

		expect(axios.delete).not.toHaveBeenCalled();

		promptSpy.mockRestore();
	});
});
