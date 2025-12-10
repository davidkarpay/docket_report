/**
 * Playwright helper utilities for Chrome extension E2E testing
 */

const path = require('path');

/**
 * Load Chrome extension in Playwright
 */
async function loadExtension(playwright) {
  const extensionPath = path.resolve(__dirname, '../../../');

  const context = await playwright.chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox'
    ]
  });

  return context;
}

/**
 * Get extension ID from background page
 */
async function getExtensionId(context) {
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }

  const extensionId = background.url().split('/')[2];
  return extensionId;
}

/**
 * Open extension popup
 */
async function openPopup(page, extensionId) {
  await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Click tab in popup
 */
async function clickTab(page, tabName) {
  await page.click(`button:has-text("${tabName}")`);
  await page.waitForTimeout(300);
}

/**
 * Get current tab content
 */
async function getCurrentTabContent(page) {
  const activeTab = await page.$('.tab-content.active');
  return activeTab;
}

/**
 * Extract text from status bar
 */
async function getStatusText(page) {
  const statusBar = await page.$('#status-bar');
  if (!statusBar) return null;
  return await statusBar.textContent();
}

/**
 * Wait for status message
 */
async function waitForStatus(page, expectedText, timeout = 5000) {
  await page.waitForFunction(
    (text) => {
      const statusBar = document.querySelector('#status-bar');
      return statusBar && statusBar.textContent.includes(text);
    },
    expectedText,
    { timeout }
  );
}

/**
 * Check if button is disabled
 */
async function isButtonDisabled(page, selector) {
  const button = await page.$(selector);
  if (!button) return true;
  return await button.isDisabled();
}

/**
 * Get extracted data from data preview
 */
async function getExtractedData(page) {
  const previewElement = await page.$('#data-preview');
  if (!previewElement) return null;

  const jsonText = await previewElement.textContent();
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    return null;
  }
}

/**
 * Wait for extraction to complete
 */
async function waitForExtraction(page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      const preview = document.querySelector('#data-preview');
      return preview && preview.textContent && preview.textContent.length > 10;
    },
    { timeout }
  );
}

/**
 * Load test page
 */
async function loadTestPage(page, filename) {
  const testPagePath = path.resolve(__dirname, `../../fixtures/${filename}`);
  await page.goto(`file://${testPagePath}`);
  await page.waitForLoadState('load');
}

/**
 * Simulate field selection
 */
async function selectField(page, fieldName, selector) {
  // Click field button
  await page.click(`button:has-text("${fieldName}")`);

  // Wait for selection mode
  await page.waitForTimeout(500);

  // Click element on page
  await page.click(selector);

  // Wait for capture
  await page.waitForTimeout(500);
}

/**
 * Mock Ollama server for testing
 */
class MockOllamaServer {
  constructor(port = 11434) {
    this.port = port;
    this.server = null;
  }

  async start() {
    const http = require('http');

    this.server = http.createServer((req, res) => {
      if (req.url === '/api/generate' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', () => {
          const mockResponse = {
            model: 'llama2',
            created_at: new Date().toISOString(),
            response: JSON.stringify({
              docketNumber: 'CR-2025-12345',
              caseTitle: 'State v. Doe',
              caseInfo: {
                partyNamesAndRoles: [
                  { name: 'State', role: 'Plaintiff' },
                  { name: 'Doe', role: 'Defendant' }
                ]
              }
            }),
            done: true
          };

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          });
          res.end(JSON.stringify(mockResponse));
        });
      } else if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`Mock Ollama server running on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('Mock Ollama server stopped');
          resolve();
        });
      });
    }
  }
}

module.exports = {
  loadExtension,
  getExtensionId,
  openPopup,
  clickTab,
  getCurrentTabContent,
  getStatusText,
  waitForStatus,
  isButtonDisabled,
  getExtractedData,
  waitForExtraction,
  loadTestPage,
  selectField,
  MockOllamaServer
};
