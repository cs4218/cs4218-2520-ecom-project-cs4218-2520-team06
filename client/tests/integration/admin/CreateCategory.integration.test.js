// Gallen Ong, A0252614L
// Isolated integration tests for Category management (Create, Update, Delete)
import React from "react";
import { render, fireEvent, waitFor, within, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "../../../src/pages/admin/CreateCategory";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../../src/components/Header", () => () => <div>Header</div>);
jest.mock("../../../src/components/Footer", () => () => <div>Footer</div>);

const renderPage = async () => {
	let rendered;
	await act(async () => {
		rendered = render(
			<MemoryRouter>
				<CreateCategory />
			</MemoryRouter>
		);
	});

	return rendered;
};

describe("Category Management (Create, Update, Delete)", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("creates a category with real routing context", async () => {
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: [{ _id: "c1", name: "Electronics" }] },
		});
		axios.post.mockResolvedValueOnce({ data: { success: true } });
		axios.get.mockResolvedValueOnce({
			data: {
				success: true,
				category: [
					{ _id: "c1", name: "Electronics" },
					{ _id: "c2", name: "Books" },
				],
			},
		});

		const { getByPlaceholderText, getAllByRole, findByText } = await renderPage();

		await findByText("Electronics");
		fireEvent.change(getByPlaceholderText("Enter new category"), {
			target: { value: "Books" },
		});
		await act(async () => {
			fireEvent.click(getAllByRole("button", { name: /submit/i })[0]);
		});

		await waitFor(() => {
			expect(axios.post).toHaveBeenCalledTimes(1);
		});

		await findByText("Books");
	});

	it("updates a category with page routing", async () => {
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: [{ _id: "c1", name: "Electronics" }] },
		});
		axios.put.mockResolvedValueOnce({ data: { success: true } });
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: [{ _id: "c1", name: "Home" }] },
		});

		const { findByText } = await renderPage();
		const categoryCell = await findByText("Electronics");
		const row = categoryCell.closest("tr");
		const editBtn = within(row).getByRole("button", { name: /edit/i });
		fireEvent.click(editBtn);

		const modalInputs = document.querySelectorAll('input[placeholder="Enter new category"]');
		const modalInput = Array.from(modalInputs).find((input) => input.value === "Electronics");
		fireEvent.change(modalInput, { target: { value: "Home" } });

		const modalForm = modalInput.closest("form");
		const modalSubmitButton = modalForm.querySelector('button[type="submit"]');
		await act(async () => {
			fireEvent.click(modalSubmitButton);
		});

		await waitFor(() => {
			expect(axios.put).toHaveBeenCalledTimes(1);
		});

		await findByText("Home");
	});

	it("deletes a category after confirmation", async () => {
		axios.get
			.mockResolvedValueOnce({
				data: {
					success: true,
					category: [
						{ _id: "c1", name: "Electronics" },
						{ _id: "c2", name: "Books" },
					],
				},
			})
			.mockResolvedValueOnce({
				data: { success: true, category: [{ _id: "c2", name: "Books" }] },
			});
		axios.delete.mockResolvedValueOnce({ data: { success: true } });
		const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

		const { findByText, queryByText } = await renderPage();
		const categoryCell = await findByText("Electronics");
		const row = categoryCell.closest("tr");
		await act(async () => {
			fireEvent.click(within(row).getByRole("button", { name: /delete/i }));
		});

		await waitFor(() => {
			expect(axios.delete).toHaveBeenCalledTimes(1);
		});

		await waitFor(() => {
			expect(queryByText("Electronics")).not.toBeInTheDocument();
		});

		confirmSpy.mockRestore();
	});

	it("respects cancellation in category delete confirmation", async () => {
		axios.get.mockResolvedValueOnce({
			data: {
				success: true,
				category: [{ _id: "c1", name: "Electronics" }],
			},
		});
		const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);

		const { findByText } = await renderPage();
		const categoryCell = await findByText("Electronics");
		const row = categoryCell.closest("tr");
		await act(async () => {
			fireEvent.click(within(row).getByRole("button", { name: /delete/i }));
		});

		expect(axios.delete).not.toHaveBeenCalled();
		confirmSpy.mockRestore();
	});
});
