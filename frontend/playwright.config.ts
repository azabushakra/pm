import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:8123",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm run build && cd ../backend && rm -f data/pm.db && python3 -m uv run uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8123",
    url: "http://127.0.0.1:8123",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
