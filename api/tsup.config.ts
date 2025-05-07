import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], // Main entry point
  outDir: "dist", // Output directory
  format: ["cjs", "esm"], // CommonJS and ES Module formats
  dts: true, // Generate TypeScript declaration files
  sourcemap: true, // Enable sourcemaps for debugging
  clean: true, // Clean output directory before build
  minify: false, // Avoid minification for better debugging in backend
  target: "node16", // Target Node.js runtime
  external: ["express", "dotenv", "mongoose"], // Exclude dependencies from the bundle
  splitting: false, // Disable code splitting for backend simplicity
  shims: true, // Add shims for Node.js globals like __dirname
});
