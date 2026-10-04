/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: { "^@/registry/(.*)$": "<rootDir>/$1" },
};
