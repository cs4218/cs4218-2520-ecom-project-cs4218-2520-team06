/* eslint-disable notice/notice */

import { defineConfig, devices } from "@playwright/test";
import { make } from "covertable";
import path from "path";

const pairwiseFiles = [
  "e2e/tests/orders/orders.spec.ts",
  "e2e/tests/profile/profile.spec.ts",
  "e2e/tests/search/search.spec.ts",
  "e2e/tests/admin/admin-user.spec.ts",
];

const browsers = ["chromium", "firefox", "webkit"];
const resolutions = [
  "1920x1080", // Standard desktop
  "1440x900", // MacBook Air
  "1366x768", // Standard laptop

  "1024x1366", // iPad Pro 12.9 (Portrait)
  "1366x1024", // iPad Pro 12.9 (Landscape)
  "820x1180", // iPad Air / Pro 11 (Portrait)
  "768x1024", // Standard iPad (Portrait)
];

const allPairs = make([pairwiseFiles, browsers, resolutions]);

const deviceMap = {
  chromium: "Desktop Chrome",
  firefox: "Desktop Firefox",
  webkit: "Desktop Safari",
};

export default defineConfig({
  testDir: "./e2e/tests",

  timeout: 10_000,

  captureGitInfo: { commit: true, diff: true },

  expect: {
    timeout: 3_000,
  },

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: [["html"], ["list"]],

  use: {
    actionTimeout: 0,

    baseURL: "http://localhost:3000",

    trace: "on-first-retry",
  },

  projects: [
    ...allPairs.map(([specFile, browser, resolution]) => {
      const [width, height] = resolution.split("x").map(Number);
      return {
        name: `PW-${path.basename(specFile, ".spec.ts")}-${browser}-${resolution}`,
        testMatch: specFile,
        use: {
          ...devices[deviceMap[browser]],
          viewport: {
            width,
            height,
          },
        },
      };
    }),
  ],

  webServer: {
    command: "yarn dev",
    port: 3000,
  },
});
