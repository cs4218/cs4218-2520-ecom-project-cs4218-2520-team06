import React from "react";
import "@testing-library/jest-dom";
import { screen, render, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useCart } from "../context/cart";
import axios from "axios";
import { describe } from "node:test";
import ProductDetails from "./ProductDetails";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

jest.mock("axios");
jest.mock("../context/cart", () => ({
    useCart: jest.fn(),
}));
jest.mock("../context/auth", () => ({
    useAuth: jest.fn(),
}));
jest.mock("react-hot-toast", () => ({
    success: jest.fn(),
}));
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn(() => mockNavigate),
    useParams: jest.fn(),
}));
jest.mock("../components/Layout", () => ({ children }) => (
    <div data-testid="layout">{children}</div>
));

const mockProduct = {
    _id: "p1",
    name: "Product 1",
    description: "Desc 1",
    price: 100,
    category: {
        _id: "c1",
    }
};

const relatedProducts = [
    {
        _id: "r1",
        name: "Related 1",
        description: "Related desc 1",
        price: 200,
        slug: "r1",
    },
    {
        _id: "r2",
        name: "Related 2",
        description: "Related desc 2",
        price: 300,
        slug: "r2",
    },
];

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escapes all regex special chars
}

// Kok Bo Chang, A0273542E
describe("ProductDetails component", () => {
    beforeEach(() => {
        useCart.mockReturnValue([[], jest.fn()]);
        useParams.mockReturnValue({ slug: "test-slug" });
    });
    
    afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    // Kok Bo Chang, A0273542E
    test("renders Layout component correctly", () => {
        // Empty Arrange

        // Act
        render(
            <MemoryRouter>
                <ProductDetails />
            </MemoryRouter>
        );

        // Assert
        expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    // Kok Bo Chang, A0273542E
    test("does not crash when params is null", () => {
        // Arrange
        useParams.mockReturnValue({ slug: null });

        // Act
        render(
            <MemoryRouter>
                <ProductDetails />
            </MemoryRouter>
        );

        // Assert
        expect(axios.get).not.toHaveBeenCalled();
    });

    // Kok Bo Chang, A0273542E
    describe("Interactions pertaining to the main displayed product", () => {
        // Kok Bo Chang, A0273542E
        test("renders main product details correctly", async () => {
            // Arrange
            axios.get
                .mockResolvedValueOnce({ data: { product: mockProduct } })
                .mockResolvedValueOnce({ data: { products: [] } });

            // Act
            render(
                <MemoryRouter>
                    <ProductDetails />
                </MemoryRouter>
            );

            // Assert
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-slug");

            // Header
            expect(await screen.findByText("Product Details")).toBeInTheDocument();

            // Name
            const nameRegExp = new RegExp(mockProduct.name, "i");
            expect(await screen.findByText(nameRegExp)).toBeInTheDocument();

            // Description
            const descRegExp = new RegExp(mockProduct.description, "i")
            expect(await screen.findByText(descRegExp)).toBeInTheDocument();

            // Price
            const priceText = mockProduct.price.toLocaleString("en-US", { style: "currency", currency: "USD" });
            const priceRegExp = new RegExp(escapeRegex(priceText), "i");
            expect(await screen.findByText(priceRegExp)).toBeInTheDocument();

            // Image
            const img = screen.getByRole("img", { name: mockProduct.name });
            expect(img).toHaveAttribute("src", expect.stringContaining(mockProduct._id));
        });

        // Kok Bo Chang, A0273542E
        test("does not render main product details if error is thrown", async () => {
            // Arrange
            const err = new Error("axios error");
            axios.get.mockRejectedValueOnce(err);

            const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

            // Act
            render(
                <MemoryRouter>
                    <ProductDetails />
                </MemoryRouter>
            );

            // Assert
            await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-slug"));
            await waitFor(() => expect(axios.get).not.toHaveBeenCalledWith("/api/v1/product/related-product/p1/c1"));
            
            expect(consoleSpy).toHaveBeenCalledTimes(1);
            expect(consoleSpy).toHaveBeenCalledWith(err);
        });

        // Kok Bo Chang, A0273542E
        test("handles 'Add to Cart' button click correctly for main product", async () => {
            // Arrange
            axios.get
                .mockResolvedValueOnce({ data: { product: mockProduct } })
                .mockResolvedValueOnce({ data: { products: [] } });
            
            const localStorageSpy = jest.spyOn(window.localStorage.__proto__, "setItem");
            const mockSetCart = jest.fn();
            useCart.mockReturnValue([[], mockSetCart]);

            // Act
            render(
                <MemoryRouter>
                    <ProductDetails />
                </MemoryRouter>
            );
            const nameRegExp = new RegExp(mockProduct.name, "i");
            await screen.findByText(nameRegExp);

            const addToCartButton = await screen.findByRole("button", { name: /Add to Cart/i });
            addToCartButton.click();

            // Assert
            await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-slug"));

            expect(mockSetCart).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining(mockProduct),
            ]));
            expect(localStorageSpy).toHaveBeenLastCalledWith(
                "cart",
                JSON.stringify([mockProduct])
            );
            expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
        });
    });
    
    // Kok Bo Chang, A0273542E
    describe("Interactions pertaining to related products", () => {
        // Kok Bo Chang, A0273542E
        test("renders empty related products correctly", async () => {
            // Arrange
            axios.get
                .mockResolvedValueOnce({ data: { product: mockProduct } })
                .mockResolvedValueOnce({ data: { products: [] } });

            // Act
            render(
                <MemoryRouter>
                    <ProductDetails />
                </MemoryRouter>
            );

            // Assert
            await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/related-product/p1/c1"));
            expect(screen.getByText("No Similar Products found")).toBeInTheDocument();
        });

        // Kok Bo Chang, A0273542E
        test("does not render related products if error is thrown", async () => {
            // Arrange
            const err = new Error("axios error");
            axios.get
                .mockResolvedValueOnce({ data: { product: mockProduct } })
                .mockRejectedValueOnce(err);

            const consoleSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});

            // Act
            render(
                <MemoryRouter>
                    <ProductDetails />
                </MemoryRouter>
            );

            // Assert
            await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-slug"));
            await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/related-product/p1/c1"));
            
            expect(consoleSpy).toHaveBeenCalledTimes(1);
            expect(consoleSpy).toHaveBeenCalledWith(err);
        });

        // Kok Bo Chang, A0273542E
        test("renders details of related products correctly", async () => {
            // Arrange
            axios.get
                .mockResolvedValueOnce({ data: { product: mockProduct } })
                .mockResolvedValueOnce({ data: { products: relatedProducts } });

            // Act
            render(
                <MemoryRouter>
                    <ProductDetails />
                </MemoryRouter>
            );

            // Assert
            await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/related-product/p1/c1"));
                
            expect(screen.queryByText("No Similar Products found")).not.toBeInTheDocument();

            relatedProducts.forEach((rp) => {
                const card = screen.getByTestId(`related-product-${rp._id}`);

                // Name
                const nameRegExp = new RegExp(rp.name, "i");
                expect(within(card).getByText(rp.name, nameRegExp)).toBeInTheDocument();

                // Description
                expect(within(card)
                        .getByText((content) =>
                            content.startsWith(rp.description.substring(0, 60))
                        )
                    ).toBeInTheDocument();
                
                // Price
                const priceText = rp.price.toLocaleString("en-US", { style: "currency", currency: "USD" });
                const priceRegExp = new RegExp(escapeRegex(priceText), "i");
                expect(within(card).getByText(priceRegExp)).toBeInTheDocument();
                
                // Image
                const img = card.querySelector(`img[alt="${rp.name}"]`);
                expect(img).toHaveAttribute("src", expect.stringContaining(rp._id));
            });
        });

        // Kok Bo Chang, A0273542E
        test("handles 'Add to Cart' button click correctly for related products", async () => {
            // Arrange
            axios.get
                .mockResolvedValueOnce({ data: { product: mockProduct } })
                .mockResolvedValueOnce({ data: { products: relatedProducts } });
            
            const localStorageSpy = jest.spyOn(window.localStorage.__proto__, "setItem");
            const mockSetCart = jest.fn();
            useCart.mockReturnValue([[], mockSetCart]);

            // Act
            render(
                <MemoryRouter>
                    <ProductDetails />
                </MemoryRouter>
            );

            for (const rp of relatedProducts) {
                const card = await screen.findByTestId(`related-product-${rp._id}`);
                const addToCartButton = within(card).getByRole("button", { name: /Add to Cart/i });
                addToCartButton.click();

                expect(mockSetCart).toHaveBeenCalledWith(
                    expect.arrayContaining([expect.objectContaining(rp)])
                );
                expect(localStorageSpy).toHaveBeenLastCalledWith(
                    "cart",
                    JSON.stringify([rp])
                );
                expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
            }
        });

        // Kok Bo Chang, A0273542E
        test("handles 'More Details' button click correctly for related products", async () => {
            // Arrange
            axios.get
                .mockResolvedValueOnce({ data: { product: mockProduct } })
                .mockResolvedValueOnce({ data: { products: relatedProducts } });

            // Act
            render(
                <MemoryRouter>
                    <ProductDetails />
                </MemoryRouter>
            );

            // Assert
            for (let i = 0; i < relatedProducts.length; i++) {
                const rp = relatedProducts[i];

                const card = await screen.findByTestId(`related-product-${rp._id}`);
                const moreDetailsButton = within(card).getByRole("button", { name: /More Details/i });

                moreDetailsButton.click();

                await waitFor(() =>
                    expect(mockNavigate).toHaveBeenNthCalledWith(i + 1, `/product/${rp.slug}`)
                );
            }
        });
    });
});