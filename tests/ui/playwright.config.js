// Testes de tela: abrem o app num navegador de verdade (celular e PC) e conferem telas e fluxos principais.
const { defineConfig } = require('@playwright/test');
const chrome = process.env.CHROME_PATH ? { launchOptions: { executablePath: process.env.CHROME_PATH } } : {};
module.exports = defineConfig({
  testDir: __dirname,
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173', serviceWorkers: 'block', ...chrome },
  webServer: { command: 'node serve.js', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'celular', use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'pc', use: { viewport: { width: 1440, height: 900 } } }
  ]
});
