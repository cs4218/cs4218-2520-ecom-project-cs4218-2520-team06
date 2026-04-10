import { Trend } from "k6/metrics";

export const metrics = {
    auth: {
        login: new Trend("auth_login_duration"),
        register: new Trend("auth_register_duration"),
        profile: new Trend("auth_profile_duration"),
    },

    product: {
        list: new Trend("product_list_duration"),
        detail: new Trend("product_detail_duration"),
        search: new Trend("product_search_duration"),
        filter: new Trend("product_filter_duration"),
        related: new Trend("product_related_duration"),
        photo: new Trend("product_photo_duration"),
    },

    category: {
        list: new Trend("category_list_duration"),
        detail: new Trend("category_detail_duration"),
    },

    checkout: {
        order: new Trend("checkout_order_duration"),
    }
};