import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    conditions: ["workspace"],
    alias: {
      "@workspace/db": path.resolve(__dirname, "../../lib/db/src/index.ts"),
      "@workspace/api-zod": path.resolve(__dirname, "../../lib/api-zod/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 10000,
  },
});

