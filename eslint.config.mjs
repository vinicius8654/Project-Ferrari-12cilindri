import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
    { files: ["js/index.js"], languageOptions: { globals: { L: "readonly" } } },
  {
    files: ["postcss.config.js"],
    languageOptions: { globals: globals.node, sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  prettierConfig,
]);