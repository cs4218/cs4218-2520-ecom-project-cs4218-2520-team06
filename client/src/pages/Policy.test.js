import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Helmet } from 'react-helmet';
import { render, getAllByText, getByAltText, getByRole, getByText } from "@testing-library/react";
import Policy from "./Policy";

jest.mock("../components/Header", () => () => (
  <div>Header</div>
));

jest.mock("../components/Footer", () => () => (
  <div>Footer</div>
));

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