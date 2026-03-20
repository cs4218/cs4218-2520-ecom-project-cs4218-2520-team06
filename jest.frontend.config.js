export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // only run these tests
  testMatch: [
    "<rootDir>/client/src/**/*.test.js",
    "<rootDir>/client/tests/**/*.test.js",
    "<rootDir>/client/tests/**/*.integration.test.js",
  ],

  testPathIgnorePatterns: [
    "<rootDir>/client/src/_site/"
  ],

  // jest code coverage
  collectCoverage: true,
  coverageDirectory: "coverage/frontend",
  collectCoverageFrom: [
    "client/src/components/**/*.js",
    "client/src/context/**/*.js",
    "client/src/hooks/useCategory.js",
    "client/src/pages/**/*.js",
    "!client/src/_site/**",
    "!client/src/**/*.test.js",
    "!client/tests/**/*.integration.test.js",
  ],
  // coverageThreshold: {
  //   global: {
  //     lines: 100,
  //     functions: 100,
  //   },
  // },
  setupFiles: ["<rootDir>/client/tests/integration/setupIntegration.js"],
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
