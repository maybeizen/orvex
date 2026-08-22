import { nodeEslintConfig } from "@orvex/config/eslint/node";

export default [{ ignores: ["src/database.ts"] }, ...nodeEslintConfig];
