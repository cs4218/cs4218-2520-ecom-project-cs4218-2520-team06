// Gallen Ong, A0252614L
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import CategoryForm from "./CategoryForm";

describe("CategoryForm Component", () => {
  it("renders a text input field", () => {
    // Arrange: No specific arrangement needed
    // Act: Render the CategoryForm component
    const { getByRole } = render(<CategoryForm />);
    
    // Assert: Check if the input field is rendered with the correct placeholder
    const input = getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", expect.stringMatching(/category/i));
  });

  it("renders a submit button", () => {
    // Arrange: No specific arrangement needed
    // Act: Render the CategoryForm component
    const { getByRole } = render(<CategoryForm />);
    
    // Assert: Check if the submit button is rendered with the correct type
    const button = getByRole("button", { name: /submit/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("calls setValue when input value changes", () => {
    // Arrange: Create a mock function for setValue
    const mockSetValue = jest.fn();
    
    // Act: Render the CategoryForm component with the mock setValue function and simulate input change
    const { getByRole } = render(
      <CategoryForm value="" setValue={mockSetValue} />
    );
    const input = getByRole("textbox");
    fireEvent.change(input, { target: { value: "New Category" } });
    
    // Assert: Check if setValue was called with the new input value
    expect(mockSetValue).toHaveBeenCalledTimes(1);
    expect(mockSetValue).toHaveBeenCalledWith("New Category");
  });
});
