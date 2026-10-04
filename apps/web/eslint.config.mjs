// nativecn.dev has its own ESLint config: the root eslint.config.js covers the Expo and Node
// packages (and ignores apps/web), while Next's rules only make sense here.
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [{ ignores: [".next/**", "next-env.d.ts", "public/**"] }, ...nextVitals, ...nextTs];

export default config;
