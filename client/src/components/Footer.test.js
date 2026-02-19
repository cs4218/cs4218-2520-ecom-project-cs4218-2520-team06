import React from "react";
import { getByText, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";

// Kok Bo Chang, A0273542E
describe("Footer component", () => {
    // Kok Bo Chang, A0273542E
    test("About link navigates to correct route", () => {
        const { container } = render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        const linkToAboutPage = getByText(container, "About");
        expect(linkToAboutPage.getAttribute("href")).toBe("/about");
    });

    // Kok Bo Chang, A0273542E
    test("Contact link navigates to correct route", () => {
        const { container } = render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        const linkToContactPage = getByText(container, "Contact");
        expect(linkToContactPage.getAttribute("href")).toBe("/contact");
    });

    // Kok Bo Chang, A0273542E
    test("Privacy Policy link navigates to correct route", () => {
        const { container } = render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        const linkToPolicyPage = getByText(container, "Privacy Policy");
        expect(linkToPolicyPage.getAttribute("href")).toBe("/policy");
    });
});