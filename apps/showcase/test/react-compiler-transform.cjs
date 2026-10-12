// The Jest transform for tests that must run the way the Showcase App is built: with the React
// Compiler on (app.json `experiments.reactCompiler`). It is jest-expo's own Babel transform with
// the flag Metro passes when the compiler is on; like Metro, it leaves node_modules uncompiled.
// No new dependency: babel-preset-expo already brings babel-plugin-react-compiler.
const path = require("node:path");

const { resolveBabelOptions } = require("jest-expo/src/resolveBabelOptions");

const babelJest = require(
  require.resolve("babel-jest", {
    paths: [path.dirname(require.resolve("jest-expo/package.json"))],
  }),
).default;

const options = resolveBabelOptions(path.resolve(__dirname, ".."));
const compiled = babelJest.createTransformer({
  ...options,
  caller: { ...options.caller, supportsReactCompiler: true },
});
const uncompiled = babelJest.createTransformer(options);

const pick = (filename) =>
  filename.split(path.sep).includes("node_modules") ? uncompiled : compiled;

module.exports = {
  canInstrument: true,
  getCacheKey: (source, filename, opts) => pick(filename).getCacheKey(source, filename, opts),
  process: (source, filename, opts) => pick(filename).process(source, filename, opts),
  processAsync: (source, filename, opts) => pick(filename).processAsync(source, filename, opts),
};
