// Kok Bo Chang, A0273542E
import React from "react";
import { Helmet } from "react-helmet"
import { render, getByTestId } from "@testing-library/react";
import Layout from "./Layout";
import Header from "./Header";
import Footer from "./Footer"

jest.mock("./Header", () => {
  return () => <div data-testid="header">Header</div>;
});

jest.mock("./Footer", () => {
  return () => <div data-testid="footer">Footer</div>;
});

jest.mock('react-hot-toast', () => ({
    Toaster: () => <div data-testid="toaster" />,
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Kok Bo Chang, A0273542E
describe("Layout component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Kok Bo Chang, A0273542E
    test("renders header and footer", () => {
        // Empty Arrange

        // Act
        const { container } = render(<Layout />);

        // Assert
        expect(getByTestId(container, "header")).toBeInTheDocument();
        expect(getByTestId(container, "footer")).toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("renders children correctly", () => {
        // Arrange
        const childTestId1 = "child-1";
        const childTestId2 = "child-2";

        // Act
        const { container } = render(
            <Layout>
                <p data-testid={childTestId1}>1</p>
                <p data-testid={childTestId2}>2</p>
            </Layout>
        );

        // Assert
        expect(getByTestId(container, childTestId1)).toBeInTheDocument();
        expect(getByTestId(container, childTestId2)).toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("renders toaster", () => {
        // Empty Arrange

        // Act
        const { container } = render(<Layout />);

        // Assert
        expect(getByTestId(container, "toaster")).toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("renders default prop values if no prop values are passed", () => {
        // Empty Arrange

        // Act
        const { container } = render(<Layout/>);

        // Assert
        const helmet = Helmet.peek();
        expect(helmet.title).toBe(Layout.defaultProps.title);
        expect(helmet.metaTags).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "description",
                    content: Layout.defaultProps.description,
                }),
                expect.objectContaining({
                    name: "keywords",
                    content: Layout.defaultProps.keywords,
                }),
                expect.objectContaining({
                    name: "author",
                    content: Layout.defaultProps.author,
                }),
            ])
        );
    });

    // Kok Bo Chang, A0273542E
    test("renders non-default prop values passed to it", () => {
        // Arrange
        const title = "Dummy Title";
        const description = "Dummy Description";
        const keywords = "keyword1, keyword2";
        const author = "Dummy Author";

        // Act
        const { container } = render(
            <Layout
                title={title}
                description={description}
                keywords={keywords}
                author={author}
            />
        );

        // Assert
        const helmet = Helmet.peek();
        expect(helmet.title).toBe(title);
        expect(helmet.metaTags).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "description",
                    content: description,
                }),
                expect.objectContaining({
                    name: "keywords",
                    content: keywords,
                }),
                expect.objectContaining({
                    name: "author",
                    content: author,
                }),
            ])
        );
    });
});