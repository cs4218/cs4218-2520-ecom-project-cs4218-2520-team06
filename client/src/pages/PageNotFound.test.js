// Kok Bo Chang, A0273542E
import React from "react";
import Layout from "../components/Layout";
import { render, getByAltText, getByText, getByRole } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PageNotFound from "./PageNotFound";

jest.mock("./../components/Layout", () => {
  return ({ children }) => (
    <div data-testid="layout">
      {children}
    </div>
  );
});

// Kok Bo Chang, A0273542E
describe.only("PageNotFound component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Kok Bo Chang, A0273542E
    test("displays the correct text in the <h1> and <h2> tags", () => {
        // Empty Arrange

        // Act
        const { container } = render(
            <MemoryRouter>
                <PageNotFound />
            </MemoryRouter>
        );

        // Assert
        const h1 = getByRole(container, "heading", { level: 1, name: /404/i });
        expect(h1).toBeInTheDocument();

        // <h2>Oops! Page Not Found</h2>
        const h2 = getByRole(container, "heading", { level: 2, name: /Oops! Page Not Found/i });
        expect(h2).toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("back button redirects back to homepage", () => {
        // Empty Arrange

        // Act
        const { container } = render(
            <MemoryRouter>
                <PageNotFound />
            </MemoryRouter>
        );

        // Assert
        const backButton = getByText(container, "Go Back");
        expect(backButton).toBeInTheDocument();
        expect(backButton.getAttribute("href")).toBe("/");
    });
});
