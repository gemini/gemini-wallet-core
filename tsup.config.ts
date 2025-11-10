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
      $SDK_VERSION: pkgJson.version,
      "process.env?.SDK_BACKEND_URL": process.env.SDK_BACKEND_URL ? `"${process.env.SDK_BACKEND_URL}"` : "undefined",
    }),
  ],
  external: ["@metamask/rpc-errors", "eventemitter3", "viem"],
  format: ["cjs", "esm"],
  outDir: "dist",
  sourcemap: true,
});
