import { defineConfig } from "eslint/config";
import globals from "globals";
import { baseEslintConfig } from "./base.js";

export const nodeEslintConfig = defineConfig(
  ...baseEslintConfig,
  {
    languageOptions: {
      globals: globals.node,
    },
  },
);
