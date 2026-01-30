// @ts-check
const { defineConfig } = require('@playwright/test');

const baseURL = process.env.PORTAL_BASE_URL || 'https://localhost:7091';

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1366, height: 768 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results'
});
