import dotenv from "dotenv";
import { replace } from "esbuild-plugin-replace";
import { defineConfig } from "tsup";

import pkgJson from "./package.json";

dotenv.config();

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  esbuildPlugins: [
    replace({
      __HORIZON_API_URL__: `"${process.env.HORIZON_API_URL || "https://horizon-api.gemini.com"}"`,
      __SDK_BACKEND_URL__: `"${process.env.SDK_BACKEND_URL || "https://keys.gemini.com"}"`,
      __SDK_VERSION__: `"${pkgJson?.version || ""}"`,
    }),
  ],
  external: ["@metamask/rpc-errors", "eventemitter3", "viem"],
  format: ["cjs", "esm"],
  outDir: "dist",
  sourcemap: true,
});
