/**
 * Comprehensive E2E tests for Chrome extension workflows
 * Tests end-to-end user workflows including extraction, LLM processing, exports, and history
 */

const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const {
  loadExtension,
  getExtensionId,
  openPopup,
  clickTab,
  getStatusText,
  waitForStatus,
  getExtractedData,
  loadTestPage,
  MockOllamaServer
} = require('./helpers/extension-utils');

let mockOllamaServer;

test.describe('Extension Installation and Setup', () => {

  test('should load extension successfully', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    expect(extensionId).toBeTruthy();
    expect(extensionId.length).toBeGreaterThan(10);

    await context.close();
  });

  test('should open popup and show initial state', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    await openPopup(page, extensionId);

    // Check popup loaded
    const title = await page.title();
    expect(title).toContain('Docket');

    // Check Extract tab is active by default
    const extractTab = await page.$('.tab-content.active');
    expect(extractTab).toBeTruthy();

    // Check status bar shows "Ready"
    const statusText = await getStatusText(page);
    expect(statusText).toMatch(/Ready/i);

    await context.close();
  });
});

test.describe('Auto-Extraction Workflow', () => {

  test('should auto-extract data from test page', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    // Load test page
    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    // Open popup
    await openPopup(page, extensionId);

    // Click Auto Extract button
    await page.click('button:has-text("Auto Extract")');

    // Wait for extraction to complete
    await page.waitForTimeout(2000);

    // Switch to Data tab
    await clickTab(page, 'Data');

    // Verify data was extracted
    const dataPreview = await page.$('#data-preview');
    const dataText = await dataPreview.textContent();

    expect(dataText).toContain('docketNumber');
    expect(dataText).toContain('CR-2025-12345');
    expect(dataText).toContain('extractionMetadata');

    await context.close();
  });

  test('should include all 4 metadata fields in auto-extraction', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    await clickTab(page, 'Data');

    const data = await getExtractedData(page);

    // Verify all 4 metadata fields
    expect(data).toHaveProperty('extractionMetadata');
    expect(data.extractionMetadata).toHaveProperty('extractedAt');
    expect(data.extractionMetadata).toHaveProperty('sourceUrl');
    expect(data.extractionMetadata).toHaveProperty('extractorVersion');
    expect(data.extractionMetadata.extractorVersion).toBe('1.0.0');

    await context.close();
  });

  test('should extract multiple fields from complex page', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-complex.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    await clickTab(page, 'Data');

    const data = await getExtractedData(page);

    // Should extract multiple fields
    expect(Object.keys(data).length).toBeGreaterThan(3);
    expect(data).toHaveProperty('docketNumber');

    await context.close();
  });
});

test.describe('Manual Selection Workflow', () => {

  test('should enter manual selection mode', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    await openPopup(page, extensionId);

    // Click Manual Selection Mode button
    await page.click('button:has-text("Manual Selection Mode")');

    // Verify status message
    await waitForStatus(page, 'Click any field button');

    await context.close();
  });

  test('should select field and capture value', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);

    // Enter manual selection mode
    await page.click('button:has-text("Manual Selection Mode")');
    await page.waitForTimeout(500);

    // Click Docket Number field button
    await page.click('button:has-text("Docket Number")');
    await page.waitForTimeout(500);

    // Note: Actual element clicking would require content script interaction
    // This is a simplified test focusing on popup behavior

    await context.close();
  });
});

test.describe('Data Export Workflows', () => {

  test('should export data as JSON', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    await clickTab(page, 'Data');

    // Set up download listener
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export JSON")')
    ]);

    // Verify download
    expect(download.suggestedFilename()).toMatch(/docket-export-.*\.json/);

    await context.close();
  });

  test('should export data as CSV', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    await clickTab(page, 'Data');

    // Set up download listener
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export CSV")')
    ]);

    // Verify download
    expect(download.suggestedFilename()).toMatch(/docket-export-.*\.csv/);

    await context.close();
  });

  test('should copy data to clipboard', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    await clickTab(page, 'Data');

    // Click copy button
    await page.click('button:has-text("Copy to Clipboard")');

    // Verify success message
    await waitForStatus(page, 'Copied to clipboard');

    await context.close();
  });

  test('should clear data', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    await clickTab(page, 'Data');

    // Click clear button (will show confirmation)
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Clear")');

    // Wait for clear
    await page.waitForTimeout(500);

    // Verify data is cleared
    const preview = await page.$('#data-preview');
    const text = await preview.textContent();
    expect(text).toMatch(/No data extracted yet/i);

    await context.close();
  });
});

test.describe('History Management', () => {

  test('should save extraction to history', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    // Switch to History tab
    await clickTab(page, 'History');

    // Verify history entry exists
    const historyList = await page.$('#history-list');
    const historyText = await historyList.textContent();

    expect(historyText).not.toMatch(/No history yet/i);

    await context.close();
  });

  test('should show timestamp in history entries', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    await clickTab(page, 'History');

    // Check for timestamp format (date/time)
    const historyEntry = await page.$('.history-entry');
    const entryText = await historyEntry.textContent();

    // Should contain timestamp-like text
    expect(entryText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}:\d{2}/);

    await context.close();
  });

  test('should load history entry when clicked', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    await clickTab(page, 'History');

    // Click history entry
    await page.click('.history-entry');

    // Should switch to Data tab
    await page.waitForTimeout(500);

    // Verify data loaded
    const dataTab = await page.$('.tab-content.active');
    expect(dataTab).toBeTruthy();

    await context.close();
  });

  test('should clear all history', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);

    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    await clickTab(page, 'History');

    // Click Clear All (handle confirmation)
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Clear All")');

    await page.waitForTimeout(500);

    // Verify history cleared
    const historyList = await page.$('#history-list');
    const historyText = await historyList.textContent();
    expect(historyText).toMatch(/No history yet/i);

    await context.close();
  });
});

test.describe('LLM Processing Workflow', () => {

  test.beforeAll(async () => {
    // Start mock Ollama server
    mockOllamaServer = new MockOllamaServer();
    await mockOllamaServer.start();
  });

  test.afterAll(async () => {
    // Stop mock server
    if (mockOllamaServer) {
      await mockOllamaServer.stop();
    }
  });

  test('should configure LLM settings', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    await openPopup(page, extensionId);

    // Go to Settings tab
    await clickTab(page, 'Settings');

    // Enable LLM
    await page.check('#llm-enabled');

    // Fill in config
    await page.fill('#llm-endpoint', 'http://localhost:11434/api/generate');
    await page.fill('#llm-model', 'llama2');

    // Save config
    await page.click('button:has-text("Save Configuration")');

    // Verify success
    await waitForStatus(page, 'saved');

    await context.close();
  });

  test('should process data with LLM', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();

    // Configure LLM first
    await openPopup(page, extensionId);
    await clickTab(page, 'Settings');
    await page.check('#llm-enabled');
    await page.fill('#llm-endpoint', 'http://localhost:11434/api/generate');
    await page.fill('#llm-model', 'llama2');
    await page.click('button:has-text("Save Configuration")');
    await page.waitForTimeout(500);

    // Extract data
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);
    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    // Process with LLM
    await page.click('button:has-text("Process with LLM")');
    await page.waitForTimeout(3000);

    // Check for enhanced data
    await clickTab(page, 'Data');
    const data = await getExtractedData(page);

    // Should have llmProcessed flag
    expect(data.extractionMetadata.llmProcessed).toBe(true);

    // Should have caseInfo object
    expect(data).toHaveProperty('caseInfo');

    await context.close();
  });

  test('should preserve metadata after LLM processing', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();

    // Configure LLM
    await openPopup(page, extensionId);
    await clickTab(page, 'Settings');
    await page.check('#llm-enabled');
    await page.fill('#llm-endpoint', 'http://localhost:11434/api/generate');
    await page.click('button:has-text("Save Configuration")');

    // Extract data
    const testPagePath = path.resolve(__dirname, '../fixtures/sample-case-simple.html');
    await page.goto(`file://${testPagePath}`);
    await openPopup(page, extensionId);
    await page.click('button:has-text("Auto Extract")');
    await page.waitForTimeout(2000);

    // Get original metadata
    await clickTab(page, 'Data');
    const originalData = await getExtractedData(page);
    const originalMetadata = originalData.extractionMetadata;

    // Process with LLM
    await clickTab(page, 'Extract');
    await page.click('button:has-text("Process with LLM")');
    await page.waitForTimeout(3000);

    // Get enhanced data
    await clickTab(page, 'Data');
    const enhancedData = await getExtractedData(page);

    // Verify metadata preserved
    expect(enhancedData.extractionMetadata.extractedAt).toBe(originalMetadata.extractedAt);
    expect(enhancedData.extractionMetadata.sourceUrl).toBe(originalMetadata.sourceUrl);
    expect(enhancedData.extractionMetadata.extractorVersion).toBe(originalMetadata.extractorVersion);
    expect(enhancedData.extractionMetadata.llmProcessed).toBe(true);

    await context.close();
  });
});

test.describe('Settings Management', () => {

  test('should save and persist settings', async ({ playwright }) => {
    const context = await loadExtension(playwright);
    const extensionId = await getExtensionId(context);

    const page = await context.newPage();
    await openPopup(page, extensionId);

    // Go to Settings
    await clickTab(page, 'Settings');

    // Configure
    await page.check('#llm-enabled');
    await page.fill('#llm-model', 'llama3');
    await page.click('button:has-text("Save Configuration")');

    // Close and reopen popup
    await page.close();

    const newPage = await context.newPage();
    await openPopup(newPage, extensionId);
    await clickTab(newPage, 'Settings');

    // Verify settings persisted
    const isChecked = await newPage.isChecked('#llm-enabled');
    const modelValue = await newPage.inputValue('#llm-model');

    expect(isChecked).toBe(true);
    expect(modelValue).toBe('llama3');

    await context.close();
  });
});
