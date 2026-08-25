export const nodeLibrary = {
  entry: ["src/index.ts"],
  platform: "node" as const,
  format: ["esm" as const],
  dts: true,
  clean: false,
  minify: process.env.NODE_ENV === "production",
  sourcemap: true,
  treeshake: true,
  fixedExtension: false,
};
