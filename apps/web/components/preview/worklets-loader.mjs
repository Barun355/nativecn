// A webpack loader for the preview: runs the Reanimated worklets Babel plugin over nativecn's
// Registry source (packages/ui) before SWC compiles it, as babel-preset-expo does in an Expo app.
// Without it, useAnimatedStyle never learns which shared values it reads, so the Switch thumb,
// SegmentedTabs indicator, Spinner, Progress and Skeleton would not animate on the web.
// Only the worklets transform runs here: TypeScript and JSX are parsed and left for SWC.
import { transformAsync } from "@babel/core";
import { createRequire } from "node:module";

const workletsPlugin = createRequire(import.meta.url).resolve("react-native-worklets/plugin");

export default function workletsLoader(source, inputSourceMap) {
  const callback = this.async();
  if (!source.includes("react-native-reanimated") && !source.includes("worklet")) {
    callback(null, source, inputSourceMap);
    return;
  }
  transformAsync(source, {
    filename: this.resourcePath,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    inputSourceMap: inputSourceMap || undefined,
    parserOpts: { plugins: ["jsx", "typescript"] },
    plugins: [workletsPlugin],
  })
    .then((result) => callback(null, result?.code ?? source, result?.map ?? inputSourceMap))
    .catch(callback);
}
