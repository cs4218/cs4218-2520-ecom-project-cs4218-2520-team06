export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  // testMatch: ["<rootDir>/controllers/*.test.js"],
  testMatch: [
    "<rootDir>/config/**/*.test.js",
    "<rootDir>/tests/**/*.test.js",
  ],

  // jest code coverager
  collectCoverage: true,
  coverageDirectory: "coverage/backend",
  collectCoverageFrom: [
    "config/**/*.js",
    "controllers/**/*.js",
    "models/**/*.js",
    "helpers/**/*.js",
    "middlewares/**/*.js",
    "!**/*.test.js",
    "!**/*.integration.test.js",
  ],
};
