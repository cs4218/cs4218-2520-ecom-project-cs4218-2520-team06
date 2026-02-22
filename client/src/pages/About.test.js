// Kok Bo Chang, A0273542E
import React from "react";
import Layout from "../components/Layout";
import { render, getByAltText, getByText } from "@testing-library/react";
import About from "./About";

jest.mock("./../components/Layout", () => {
    return ({ children }) => (
        <div data-testid="layout">
            {children}
        </div>
    );
});

// Kok Bo Chang, A0273542E
describe("About component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Kok Bo Chang, A0273542E
    test("renders the about image with the correct alt text", () => {
        // Empty Arrange

        // Act
        const { container } = render(<About />);

        // Assert
        const image = getByAltText(container, /about/i);
        expect(image).toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("renders text in the about page", () => {
        // Empty Arrange

        // Act
        const { container } = render(<About />);

        // Assert
        expect(
            getByText(container, (text) => text.trim().length > 0)
        ).toBeInTheDocument();
    });
});