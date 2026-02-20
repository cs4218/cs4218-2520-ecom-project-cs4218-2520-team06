import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { render, getByAltText, getByRole, getByText } from "@testing-library/react";
import Contact from "./Contact";

jest.mock("../components/Header", () => () => (
  <div>Header</div>
));

jest.mock("../components/Footer", () => () => (
  <div>Footer</div>
));

// Kok Bo Chang, A0273542E
describe.only("Contact component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Kok Bo Chang, A0273542E
    test("shows the correct heading", () => {
        // Empty Arrange

        // Act
        const { container } = render(<Contact />);

        // Assert
        expect(
            getByRole(container, "heading", { name: /Contact Us/i })
        ).toBeInTheDocument();
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