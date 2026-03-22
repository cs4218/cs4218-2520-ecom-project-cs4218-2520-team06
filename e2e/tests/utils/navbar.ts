import { expect, type Page } from "@playwright/test";

const NAVBAR_TOGGLER_SELECTOR =
  'button.navbar-toggler[data-bs-target="#navbarTogglerDemo01"]';
const NAVBAR_COLLAPSE_SELECTOR = "#navbarTogglerDemo01";

export async function ensureNavbarExpanded(page: Page) {
  const toggler = page.locator(NAVBAR_TOGGLER_SELECTOR).first();
  const collapse = page.locator(NAVBAR_COLLAPSE_SELECTOR).first();

  if ((await toggler.count()) === 0) return;

  // In desktop view, the toggler is hidden and the collapse is already visible.
  if (!(await toggler.isVisible())) return;
  if (await collapse.isVisible()) return;

  await toggler.click();
  await expect(collapse).toBeVisible();
}
