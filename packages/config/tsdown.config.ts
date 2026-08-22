import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/eslint/base.ts",
    "src/eslint/node.ts",
    "src/eslint/react.ts",
    "src/prettier.ts",
    "src/tsdown/node.ts",
  ],
  platform: "node",
  format: ["esm"],
  dts: true,
  clean: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: true,
  treeshake: true,
  fixedExtension: false,
});
