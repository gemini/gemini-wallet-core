// these constants are normally replaced by tsup during build, but need to be defined for tests
import pkgJson from "./package.json";

// define globals that are replaced at build time
(globalThis as any).__SDK_BACKEND_URL__ = process.env.SDK_BACKEND_URL || "https://keys.gemini.com";
(globalThis as any).__HORIZON_API_URL__ = process.env.HORIZON_API_URL || "https://horizon-api.gemini.com";
(globalThis as any).__SDK_VERSION__ = pkgJson.version || "0.0.0-test";
