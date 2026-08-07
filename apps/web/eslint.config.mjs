import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next.js 16 removió `next lint` en favor del ESLint CLI directo — este es el
// patrón documentado en node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md,
// no el FlatCompat de Next.js 15.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
