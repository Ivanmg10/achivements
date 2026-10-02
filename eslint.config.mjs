import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // New with eslint-config-next 16 (React Compiler rules). Its ~50 hits are
      // working patterns — reading localStorage after mount, resetting a modal
      // when it opens — to move off effects one by one; a warning keeps them
      // visible without blocking the build.
      "react-hooks/set-state-in-effect": "warn",
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
