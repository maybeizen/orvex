import { nodeLibrary } from "@orvex/config/tsdown/node";
import { defineConfig } from "tsdown";

export default defineConfig({
  ...nodeLibrary,
  entry: ["src/index.ts", "src/server.ts"],
});
