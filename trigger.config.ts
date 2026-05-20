import { defineConfig } from "@trigger.dev/sdk/v3";
import { additionalPackages, aptGet } from "@trigger.dev/build/extensions/core";

// Your project ref from the Trigger.dev dashboard (Project Settings).
// Set TRIGGER_PROJECT_REF in your .env file, or replace the fallback below.
const projectRef = process.env.TRIGGER_PROJECT_REF ?? "your-project-ref";

export default defineConfig({
  project: projectRef,
  dirs: ["./src/trigger"],
  build: {
    external: ["canvas"],
    extensions: [
      aptGet({
        packages: [
          "libcairo2-dev",
          "libpango1.0-dev",
          "libjpeg-dev",
          "libgif-dev",
          "librsvg2-dev",
          "build-essential",
          "libpixman-1-dev",
        ],
      }),
      additionalPackages({ packages: ["canvas"] }),
    ],
  },
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },

  maxDuration: 300, // 5 minutes for market-data fetches, chart generation, and email delivery
});
