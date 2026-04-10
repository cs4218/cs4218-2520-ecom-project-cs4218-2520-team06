export const PRODUCTS = [
    { slug: "laptop", searchTerm: "laptop" },
    { slug: "smartphone", searchTerm: "smartphone" },
    { slug: "textbook", searchTerm: "textbook" },
    { slug: "novel", searchTerm: "novel" }
];

export function getRandomProduct() {
    return PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
}

export function getRandomPageNumber() {
    const MAX_PAGES = 5; // includes out-of-bounds values
    return Math.floor(Math.random() * MAX_PAGES) + 1;
}