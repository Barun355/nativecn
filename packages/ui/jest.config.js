/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/jest-setup.js"],
  moduleNameMapper: { "^@/registry/(.*)$": "<rootDir>/$1" },
};
