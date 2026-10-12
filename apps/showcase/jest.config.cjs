/** @type {import('jest').Config} */
const config = {
  rootDir: __dirname,
  preset: "jest-expo",
  // Worklets ships `.native` files that need its native module; this resolver skips them in Jest.
  resolver: "react-native-worklets/jest/resolver",
  setupFiles: ["<rootDir>/test/jest-setup.cjs"],
  testPathIgnorePatterns: ["/node_modules/", "/scripts/"],
  moduleNameMapper: {
    "^@/registry/(.*)$": "<rootDir>/../../packages/ui/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    // Lucide's "react-native" export is untranspiled ESM (.mjs); Jest takes its CommonJS build.
    "^lucide-react-native$": require.resolve("lucide-react-native"),
    // The 32 bundled font files.
    "\\.ttf$": "<rootDir>/test/font-stub.cjs",
  },
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    { ...config, displayName: "showcase" },
    // The Showcase App is built with the React Compiler, which re-splits a component's memos by
    // what each value reads (#156). The tests listed here run a second time with it on, as the
    // app runs, so code that only works uncompiled fails here.
    {
      ...config,
      displayName: "react-compiler",
      testMatch: ["<rootDir>/src/preset/live-preset.test.tsx"],
      transform: { "\\.[jt]sx?$": "<rootDir>/test/react-compiler-transform.cjs" },
    },
  ],
};
