import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The static site this app replaces. Each file is deleted once its pages are ported; remove the line with it.
    "assets/js/**",
    "data/**",
    "tools/grand-entrance/**",
    // Plain script served as-is from public/, shared with the option pages.
    "public/assets/options-nav/**",
  ]),
]);

export default eslintConfig;
