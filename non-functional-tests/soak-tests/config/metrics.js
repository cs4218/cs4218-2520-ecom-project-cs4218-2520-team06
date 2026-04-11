// Kok Bo Chang, A0273542E
import { Trend, Rate } from "k6/metrics";

export const metrics = {
    auth: {
        login: new Trend("auth_login_duration"),
        register: new Trend("auth_register_duration"),
        profile: new Trend("auth_profile_duration"),
    },

    product: {
        list: new Trend("product_list_duration"),
        detail: new Trend("product_detail_duration"),
        photo: new Trend("product_photo_duration"),
        search: new Trend("product_search_duration"),
        related: new Trend("product_related_duration"),
    },

    category: {
        list: new Trend("category_list_duration"),
        detail: new Trend("category_detail_duration"),
    },

    checkout: {
        order: new Trend("checkout_order_duration"),
    },

    error: {
        login: new Rate("login_error_rate"),
        checkout: new Rate("checkout_error_rate"),
        global: new Rate("global_error_rate"),
    }
};