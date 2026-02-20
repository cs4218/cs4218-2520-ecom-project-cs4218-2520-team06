import React from "react";
import Layout from "../components/Layout";
import { render, getByAltText, getByText } from "@testing-library/react";
import Contact from "./Contact";

jest.mock("./../components/Layout", () => {
  return ({ children }) => (
    <div data-testid="layout">
      {children}
    </div>
  );
});

// Kok Bo Chang, A0273542E
describe("Contact component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Kok Bo Chang, A0273542E
    test("renders the contact image with the correct alt text", () => {
        // Empty Arrange

        // Act
        const { container } = render(<Contact />);

        // Assert
        const image = getByAltText(container, /contactus/i);
        expect(image).toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("displays the correct contact information", () => {
        // Empty Arrange

        // Act
        const { container } = render(<Contact />);

        // Assert
        expect(getByText(container, /help@ecommerceapp\.com/i)).toBeInTheDocument();
        expect(getByText(container, /012-3456789/)).toBeInTheDocument();
        expect(getByText(container, /1800-0000-0000/i)).toBeInTheDocument();
  });
});