// Gallen Ong, A0252614L
// Essential pass/fail thresholds per stress test.

export const thresholds = {
  // Auth stress test (login)
  auth: {
    'http_req_duration{endpoint:auth_login}': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
    'auth_success_rate': ['rate>0.90'],
  },

  // Browse/Search stress test
  browse: {
    'http_req_duration{endpoint:list}': ['p(95)<2000'],
    'http_req_duration{endpoint:search}': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
    'browse_success_rate': ['rate>0.90'],
  },

  // Checkout stress test (mock-payment flow)
  checkout: {
    'http_req_duration{endpoint:checkout_login}': ['p(95)<2000'],
    'http_req_duration{endpoint:checkout_search}': ['p(95)<2000'],
    'http_req_duration{endpoint:checkout_mock_payment}': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
    'checkout_success_rate': ['rate>0.85'],
  },

  // Admin product stress test
  adminProduct: {
    'http_req_duration{endpoint:admin_product}': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
    'admin_product_success_rate': ['rate>0.95'],
  },

  // Admin orders dashboard stress test
  adminOrders: {
    'http_req_duration{endpoint:admin_orders_list}': ['p(95)<2000'],
    'http_req_duration{endpoint:admin_orders_filter}': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
    'admin_orders_success_rate': ['rate>0.95'],
  },
};
