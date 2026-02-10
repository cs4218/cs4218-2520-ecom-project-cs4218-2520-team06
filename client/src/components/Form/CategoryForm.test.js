import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import CategoryForm from "./CategoryForm";

describe("CategoryForm Component", () => {
  it("renders the form with correct labels and placeholders", () => {
    const { getByPlaceholderText } = render(<CategoryForm />);
    expect(getByPlaceholderText("Enter new category")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    const { getByText } = render(<CategoryForm />);
    expect(getByText("Submit")).toBeInTheDocument();
  });

  it("changes input value on user input", () => {
    const mockSetValue = jest.fn();
    const { getByPlaceholderText } = render(
      <CategoryForm value="" setValue={mockSetValue} />
    );
    const input = getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "New Category" } });
    expect(mockSetValue).toHaveBeenCalledWith("New Category");
  });
});
