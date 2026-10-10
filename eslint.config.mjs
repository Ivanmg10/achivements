import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React Compiler rule (eslint-config-next 16). Nothing trips it any more: state
      // that starts over goes through useWhenChanged, what the browser holds through
      // useStorageValue / useIsClient / useLocationHash. See CLAUDE.md, State and effects.
      "react-hooks/set-state-in-effect": "error",
      // next.config sets images.unoptimized (avatars are links to any https
      // host), so next/image would render the same <img> with nothing gained.
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Test doubles are components too, but nobody reads their display names.
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: { "react/display-name": "off" },
  },
  {
    // Jest module mocks are CommonJS on purpose (jest.mock loads them with require),
    // and their stand-ins ignore the props they are handed.
    files: ["__mocks__/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/display-name": "off",
    },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "graphify-out/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
