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
    // The CommonJS scripts behind `npm run scene`, which write app/(home)/scene.ts.
    "tools/grand-entrance/**",
  ]),
  {
    rules: {
      // React escapes text; raw HTML is allowed only for the generated home scene (which carries the fixed
      // FIRST_FRAME camera script inside it) and the fixed `js` class script, each with its own disable comment
      // saying why.
      "react/no-danger": "error",
      // Photos are pre-sized WebP files served as they were on the static site, inside the ported .pic and
      // .deal-photo boxes; next/image would add wrappers that CSS was not written for.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
