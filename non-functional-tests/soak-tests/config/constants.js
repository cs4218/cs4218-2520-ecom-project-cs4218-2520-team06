// Kok Bo Chang, A0273542E
export const BASE_URL = "http://localhost:6060";

export const SEEDED_USER = {
    EMAIL_PREFIX: "seeded-soak-test-user",
    EMAIL_DOMAIN: "soak-test-user.com",
    PASSWORD: "Q$d69_fm'",
}

export const TEMP_USER = {
    EMAIL_PREFIX: "temp-soak-test-user",
    EMAIL_DOMAIN: "soak-test-user.com",
    DEFAULT_NAME: "Temp Soak Test User",
    PHONE_NUMBER: "1234567890",
    ADDRESS: "123 Soak Test St",
    ANSWER: "example",
    PASSWORD: "Q$d69_fm'",
};

export const PRODUCT_API = {
    MOCK_PAYMENT_PATH: "/api/v1/product/mock/payment",
};

export const TEMP_FILE = {
    directory: "./temp",
    fileName: "seededUsers.json",
}