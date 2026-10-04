/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/jest-setup.cjs"],
  testPathIgnorePatterns: ["/node_modules/", "/scripts/"],
  moduleNameMapper: { "^@/registry/(.*)$": "<rootDir>/$1" },
};
