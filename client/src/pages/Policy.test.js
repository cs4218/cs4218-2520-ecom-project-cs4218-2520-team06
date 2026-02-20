import React from "react";
import Layout from "../components/Layout";
import { render, getAllByText, getByAltText } from "@testing-library/react";
import Policy from "./Policy";

jest.mock("./../components/Layout", () => {
  return ({ children }) => (
    <div data-testid="layout">
      {children}
    </div>
  );
});

// Kok Bo Chang, A0273542E
describe("Policy component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Kok Bo Chang, A0273542E
    test("renders the image with the correct alt text", () => {
        // Empty Arrange

        // Act
        const { container } = render(<Policy />);

        // Assert
        const image = getByAltText(container, /contactus/i);
        expect(image).toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("privacy policy contains text content", () => {
        // Empty Arrange

        // Act
        const { container } = render(<Policy />);

        // Assert
        const paragraphs = getAllByText(container, (content, element) => {
            return (
                element.tagName.toLowerCase() === "p" &&
                content.trim().length > 0
            );
        });

        expect(paragraphs.length).toBeGreaterThan(0);
    });
});