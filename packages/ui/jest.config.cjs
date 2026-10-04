/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // Worklets ships `.native` files that need its native module; this resolver skips them in Jest.
  resolver: "react-native-worklets/jest/resolver",
  setupFiles: ["<rootDir>/test/jest-setup.cjs"],
  testPathIgnorePatterns: ["/node_modules/", "/scripts/"],
  moduleNameMapper: {
    "^@/registry/(.*)$": "<rootDir>/$1",
    // Lucide's "react-native" export is untranspiled ESM (.mjs); Jest takes its CommonJS build.
    "^lucide-react-native$": require.resolve("lucide-react-native"),
  },
};
