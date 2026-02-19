import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";

// Kok Bo Chang, A0273542E
describe("Footer components", () => {
    // Kok Bo Chang, A0273542E
    test("About link navigates to correct route", () => {
        const { getByText } = render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        const linkToAboutPage = getByText("About");
        expect(linkToAboutPage.getAttribute("href")).toBe("/about");
    });

    // Kok Bo Chang, A0273542E
    test("Contact link navigates to correct route", () => {
        const { getByText } = render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        const linkToContactPage = getByText("Contact");
        expect(linkToContactPage.getAttribute("href")).toBe("/contact");
    });

    // Kok Bo Chang, A0273542E
    test("Privacy Policy link navigates to correct route", () => {
        const { getByText } = render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        const linkToPolicyPage = getByText("Privacy Policy");
        expect(linkToPolicyPage.getAttribute("href")).toBe("/policy");
    });
});