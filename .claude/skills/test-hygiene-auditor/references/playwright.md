# Playwright audit checklist (reference)

Use this checklist when Playwright is detected. Keep suggestions aligned with `@playwright/test` fixtures.

## Isolation and side-effect leaks

### Storage/session state

- Leak vectors:
  - Broad reuse of `storageState` across unrelated tests.
  - Tests depending on login state created by a previous test.
- Recommendations:
  - Prefer per-test isolation via fixtures.
  - If using `storageState`, scope it deliberately (by role/suite) and avoid cross-suite coupling.

### Shared objects outside fixtures

- Smell: `page`, `context`, or clients stored in module scope.
- Recommendation: keep `page` and `context` lifecycle within fixtures or test scope.

### Serial suites masking coupling

- Smell: `test.describe.serial` used broadly.
- Recommendation: treat serial as a red flag; split tests and fix isolation.

### Network/DB/test data

- Leak vectors:
  - Shared seeded data relied upon implicitly.
  - Tests assume ordering or exact record counts.
- Recommendations:
  - Seed per test with explicit identifiers.
  - Use dedicated test accounts/tenants per suite when feasible.

## Brittle patterns

### Timing-based waits

- Smell: `waitForTimeout(...)` used to make tests pass.
- Recommendation: replace with event-driven waits:
  - `await expect(locator).toBeVisible()`
  - `await page.waitForResponse(...)`
  - `await locator.waitFor(...)`

### Brittle selectors

- Smell: selectors coupled to DOM structure or CSS.
- Prefer:
  - `getByRole`, `getByLabel`, `getByText` (with stable text)
  - test ids where necessary (use consistently)

## Control-flow and data-dependence coverage

### Control-flow testing ideas

- Cover important user flows and branches:
  - auth: unauthenticated, authenticated, expired session
  - permissions: 401/403 and role matrix
  - empty states, error states, offline/slow network
  - retry flows, cancellation/back navigation, refresh

### Data dependence ideas

- Vary data and environment inputs that matter:
  - locale/timezone
  - feature flags/config
  - different data shapes (missing fields, large lists)
- Avoid coupling to a single golden dataset.

## Evidence to cite in reports

- `test.use({ storageState: ... })`, `globalSetup`, fixture definitions.
- Use of `serial`, shared setup patterns.
- Timing waits and selector strategies.

## Blackbox Perspective Violations

Blackbox violations occur when e2e tests couple to internal implementation details rather than exercising the system through its public interfaces.

### Violation patterns

**HIGH severity (in test body):**

```javascript
// Violation: Importing internal models
import userModel from "../../../models/userModel";

// Violation: Importing DB utilities
import { deleteUserByEmail } from "../../../db-util";

// Violation: Direct DB connection
import connectDB from "../../../config/db";

// Violation: Direct API calls bypassing UI
test("some feature", async ({ request }) => {
  await request.post("http://localhost:6060/api/v1/auth/register", { data });
  // ... should use page.fill(), page.click() instead
});

// Violation: Internal state manipulation
await page.evaluate(() => {
  window.localStorage.setItem("user", JSON.stringify(userData));
});
```

**LOW/WARN severity (in hooks):**

```javascript
// Acceptable for setup, but flag if excessive:
test.beforeAll(async () => {
  await connectDB(); // OK for setup
  await userModel.deleteMany({}); // OK for teardown, but warn if >3 ops
  await orderModel.deleteMany({});
  await categoryModel.deleteMany({});
});
```

### Pragmatic guidance

| Location  | Acceptable                    | Flag                        |
| --------- | ----------------------------- | --------------------------- |
| Test body | UI interactions (`page.*`)    | All DB/API/internal imports |
| Hooks     | UI-based or API-based seeding | Direct DB if >3 operations  |
| Hooks     | Minimal teardown              | Complex setup logic         |

### Recommendations

1. **Test body**: All user-facing interactions should use `page.click()`, `page.fill()`, `page.goto()`, etc.
2. **Seeding**: Prefer API-based seeding over direct DB access. If DB access is needed in hooks, keep it minimal and document why.
3. **Selectors**: Use semantic locators:
   - Prefer: `getByRole`, `getByLabel`, `getByText`
   - Avoid: CSS classes, data attributes tied to framework internals (e.g., `data-bs-target`)
4. **Fixtures**: Use `test.beforeEach` with UI-based login flows rather than hardcoded credentials tied to DB seeds.

### Examples from real codebases

**Violation example (HIGH):**

```javascript
// e2e/tests/auth/login.spec.js
import userModel from "../../../models/userModel";
import connectDB from "../../../config/db";

test("login works", async () => {
  await connectDB();
  await userModel.create({ email: "test@example.com", password: hashed });
  // ... test body accesses DB directly
});
```

**Acceptable pattern (pragmatic):**

```javascript
// e2e/tests/auth/login.spec.js
test.beforeAll(async ({ request }) => {
  await request.post(BASE_URL + "/api/v1/auth/register", { data: testUser });
});

test("login works", async ({ page }) => {
  await page.goto("/login");
  await page.fill("[name=email]", testUser.email);
  // ... all interactions through UI
});
```
