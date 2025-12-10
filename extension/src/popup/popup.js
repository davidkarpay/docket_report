/**
 * Client Docket Manager Extractor - Popup UI
 * Handles user interface and interactions
 */

class PopupController {
  constructor() {
    this.currentTab = 'extract';
    this.extractedData = {};
    this.llmConfig = null;
    this.init();
  }

  async init() {
    // Setup tab switching
    this.setupTabs();

    // Setup button handlers
    this.setupEventListeners();

    // Load current data
    await this.loadCurrentData();

    // Load LLM config
    await this.loadLLMConfig();

    // Load history
    await this.loadHistory();

    // Listen for messages from background/content
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request);
    });

    this.setStatus('Ready');
  }

  /**
   * Setup tab switching
   */
  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;

        // Update buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Reload data when switching to certain tabs
        if (tabName === 'history') {
          this.loadHistory();
        } else if (tabName === 'data') {
          this.updateDataPreview();
        }
      });
    });
  }

  /**
   * Setup event listeners for all buttons
   */
  setupEventListeners() {
    // Extract tab
    document.getElementById('auto-extract-btn').addEventListener('click', () => this.autoExtract());
    document.getElementById('manual-extract-btn').addEventListener('click', () => this.manualExtract());
    document.getElementById('llm-process-btn').addEventListener('click', () => this.processWithLLM());

    // Field buttons
    document.querySelectorAll('.field-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectField(btn.dataset.field));
    });

    // Data tab
    document.getElementById('save-db-btn').addEventListener('click', () => this.saveToDatabase());
    document.getElementById('export-json-btn').addEventListener('click', () => this.exportData('json'));
    document.getElementById('export-csv-btn').addEventListener('click', () => this.exportData('csv'));
    document.getElementById('copy-btn').addEventListener('click', () => this.copyToClipboard());
    document.getElementById('clear-data-btn').addEventListener('click', () => this.clearData());

    // History tab
    document.getElementById('clear-history-btn').addEventListener('click', () => this.clearHistory());

    // Settings tab
    document.getElementById('save-llm-config-btn').addEventListener('click', () => this.saveLLMConfig());
    document.getElementById('test-llm-btn').addEventListener('click', () => this.testLLMConnection());
    document.getElementById('llm-enabled').addEventListener('change', (e) => {
      document.getElementById('llm-process-btn').disabled = !e.target.checked;
    });
  }

  /**
   * Check if content script is loaded and ready
   */
  async checkContentScriptReady(retries = 5, delay = 500) {
    for (let i = 0; i < retries; i++) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });

        if (response && response.ready) {
          return true;
        }
      } catch (error) {
        console.log(`Content script not ready (attempt ${i + 1}/${retries}):`, error.message);

        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return false;
  }

  /**
   * Auto extract using predefined rules
   */
  async autoExtract() {
    // Check if content script is ready
    this.setStatus('Checking page readiness...');

    const ready = await this.checkContentScriptReady();
    if (!ready) {
      this.setStatus('Content script not loaded. Please refresh the page and try again.', 'error');
      return;
    }

    this.setStatus('Auto extracting...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'autoExtract'
      });

      if (response.success) {
        this.extractedData = response.data;
        this.updateDataPreview();
        this.setStatus('Auto extraction complete!', 'success');

        // Save to history
        await this.saveToHistory();
      } else {
        this.setStatus('Auto extraction failed', 'error');
      }
    } catch (error) {
      console.error('Auto extract error:', error);
      this.setStatus(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Start manual extraction mode
   */
  async manualExtract() {
    this.setStatus('Manual extraction mode - Select fields on the page');

    // Get all field buttons to enable selection mode
    const fieldButtons = document.querySelectorAll('.field-btn');
    fieldButtons.forEach(btn => {
      if (!btn.classList.contains('selected')) {
        btn.classList.add('available');
      }
    });
  }

  /**
   * Select a specific field
   */
  async selectField(field) {
    if (field === 'custom') {
      const fieldName = prompt('Enter custom field name:');
      if (!fieldName) return;
      field = fieldName;
    }

    // Check if content script is ready
    const ready = await this.checkContentScriptReady();
    if (!ready) {
      this.setStatus('Content script not loaded. Please refresh the page and try again.', 'error');
      return;
    }

    this.setStatus(`Click an element on the page for: ${field}`);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      await chrome.tabs.sendMessage(tab.id, {
        action: 'startManualSelection',
        field: field
      });

      // Highlight the button
      const btn = document.querySelector(`[data-field="${field}"]`);
      if (btn) {
        btn.classList.add('selected');
      }
    } catch (error) {
      console.error('Field selection error:', error);
      this.setStatus(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Process extracted data with LLM
   */
  async processWithLLM() {
    if (!this.llmConfig || !this.llmConfig.enabled) {
      this.setStatus('Please configure LLM in Settings first', 'error');
      return;
    }

    this.setStatus('Processing with LLM...');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'processWithLLM',
        data: this.extractedData
      });

      if (response.success) {
        this.extractedData = response.data;
        this.updateDataPreview();
        this.setStatus('LLM processing complete!', 'success');
      } else {
        this.setStatus(`LLM error: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('LLM processing error:', error);
      this.setStatus(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Export data in specified format
   */
  async exportData(format) {
    if (!this.extractedData || Object.keys(this.extractedData).length === 0) {
      this.setStatus('No data to export', 'error');
      return;
    }

    try {
      // Determine if we have multi-case or single case data
      const metadata = this.extractedData.extractionMetadata;
      const isMultiCase = metadata?.pageType === 'MULTI_CASE_TABLE' &&
                         Array.isArray(this.extractedData.data);

      const recordCount = metadata?.recordCount || 1;

      let exportObj;
      if (metadata) {
        // New format with metadata
        if (isMultiCase) {
          exportObj = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            extractionMetadata: metadata,
            cases: this.extractedData.data
          };
        } else {
          exportObj = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            extractionMetadata: metadata,
            cases: [this.extractedData.data]
          };
        }
      } else {
        // Old format (backward compatibility)
        exportObj = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          cases: [this.extractedData]
        };
      }

      let data, filename, mimeType;

      if (format === 'json') {
        data = JSON.stringify(exportObj, null, 2);
        filename = `docket-export-${Date.now()}.json`;
        mimeType = 'application/json';
      } else if (format === 'csv') {
        const response = await chrome.runtime.sendMessage({
          action: 'exportData',
          format: 'csv',
          data: this.extractedData
        });
        data = response.data;
        filename = `docket-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
      }

      // Create download
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      const countMsg = recordCount > 1 ? ` (${recordCount} cases)` : '';
      this.setStatus(`Exported as ${format.toUpperCase()}${countMsg}`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      this.setStatus(`Export error: ${error.message}`, 'error');
    }
  }

  /**
   * Copy data to clipboard
   */
  async copyToClipboard() {
    if (Object.keys(this.extractedData).length === 0) {
      this.setStatus('No data to copy', 'error');
      return;
    }

    try {
      const jsonString = JSON.stringify(this.extractedData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      this.setStatus('Copied to clipboard!', 'success');
    } catch (error) {
      console.error('Copy error:', error);
      this.setStatus('Failed to copy', 'error');
    }
  }

  /**
   * Save data to database via native messaging host
   */
  async saveToDatabase() {
    if (!this.extractedData || Object.keys(this.extractedData).length === 0) {
      this.setStatus('No data to save', 'error');
      return;
    }

    this.setStatus('Saving to database...');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveExtraction',
        data: this.extractedData
      });

      if (response.success) {
        this.setStatus('Saved to database!', 'success');
      } else {
        this.setStatus(`Save failed: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Database save error:', error);
      this.setStatus(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Clear current extracted data
   */
  async clearData() {
    if (confirm('Clear all extracted data?')) {
      this.extractedData = {};
      this.updateDataPreview();

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { action: 'clearData' });
      } catch (error) {
        console.error('Clear error:', error);
      }

      this.setStatus('Data cleared', 'success');

      // Reset field buttons
      document.querySelectorAll('.field-btn').forEach(btn => {
        btn.classList.remove('selected');
      });
    }
  }

  /**
   * Load current extracted data from content script
   */
  async loadCurrentData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'getExtractedData'
      });

      if (response && response.success && response.data) {
        this.extractedData = response.data;
        this.updateDataPreview();
      }
    } catch (error) {
      // Content script may not be loaded yet, that's OK
      console.log('Could not load current data:', error.message);
    }
  }

  /**
   * Update data preview
   */
  updateDataPreview() {
    const preview = document.getElementById('data-preview');

    if (!this.extractedData || Object.keys(this.extractedData).length === 0) {
      preview.innerHTML = '<p class="no-data">No data extracted yet. Go to Extract tab to begin.</p>';
      return;
    }

    // Check if this is new format with extractionMetadata
    const metadata = this.extractedData.extractionMetadata;
    const data = this.extractedData.data || this.extractedData;

    let headerInfo = '';
    if (metadata) {
      const recordCount = metadata.recordCount || 1;
      const pageType = metadata.pageType === 'MULTI_CASE_TABLE' ? 'Table View' : 'Case Detail';
      const llmStatus = metadata.llmProcessed ? ' (LLM Enhanced)' : '';
      headerInfo = `<div style="padding: 10px; background: #f0f0f0; border-radius: 4px; margin-bottom: 10px; font-size: 12px;">
        <strong>${recordCount} case${recordCount > 1 ? 's' : ''}</strong> | ${pageType}${llmStatus}<br>
        <span style="color: #666;">Extracted: ${new Date(metadata.extractedAt).toLocaleString()}</span>
      </div>`;
    }

    preview.innerHTML = headerInfo + '<pre style="margin: 0;">' +
                       JSON.stringify(this.extractedData, null, 2) +
                       '</pre>';
  }

  /**
   * Save current extraction to history
   */
  async saveToHistory() {
    if (Object.keys(this.extractedData).length === 0) return;

    try {
      await chrome.runtime.sendMessage({
        action: 'saveExtraction',
        data: this.extractedData
      });
    } catch (error) {
      console.error('Save to history error:', error);
    }
  }

  /**
   * Load extraction history
   */
  async loadHistory() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getHistory'
      });

      if (response.success) {
        this.displayHistory(response.history);
      }
    } catch (error) {
      console.error('Load history error:', error);
    }
  }

  /**
   * Display history items
   */
  displayHistory(history) {
    const historyList = document.getElementById('history-list');

    if (!history || history.length === 0) {
      historyList.innerHTML = '<p class="no-data">No history yet.</p>';
      return;
    }

    historyList.innerHTML = history.map(entry => {
      const date = new Date(entry.timestamp);

      // Handle invalid URLs gracefully
      let hostname;
      try {
        hostname = new URL(entry.url).hostname || 'local file';
      } catch {
        // If URL parsing fails, use the raw value
        hostname = entry.url || 'unknown';
      }

      // Extract preview based on data structure
      let preview = 'Case data';
      let caseCount = 1;

      if (entry.data) {
        // Check for new format with extractionMetadata
        if (entry.data.extractionMetadata) {
          caseCount = entry.data.extractionMetadata.recordCount || 1;
          const pageType = entry.data.extractionMetadata.pageType;

          // Get preview from data
          if (Array.isArray(entry.data.data)) {
            // Multi-case array
            const firstCase = entry.data.data[0];
            preview = firstCase?.caseNumber || firstCase?.name || `${caseCount} cases`;
          } else {
            // Single case in new format
            preview = entry.data.data?.docketNumber || entry.data.data?.caseTitle || 'Case data';
          }
        } else {
          // Old format (direct fields)
          preview = entry.data.docketNumber || entry.data.caseTitle || 'Case data';
        }
      }

      const countBadge = caseCount > 1 ? `<span style="background: #007bff; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 8px;">${caseCount} cases</span>` : '';

      return `
        <div class="history-item" data-id="${entry.id}">
          <div class="history-item-header">
            <div class="history-item-url">${hostname}</div>
            <div class="history-item-time">${date.toLocaleString()}</div>
          </div>
          <div class="history-item-preview">${preview}${countBadge}</div>
        </div>
      `;
    }).join('');

    // Add click handlers
    historyList.querySelectorAll('.history-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.loadHistoryItem(history[index]);
      });
    });
  }

  /**
   * Load a history item
   */
  loadHistoryItem(entry) {
    this.extractedData = entry.data;
    this.updateDataPreview();

    // Switch to data tab
    document.querySelector('[data-tab="data"]').click();

    this.setStatus('Loaded from history', 'success');
  }

  /**
   * Clear all history
   */
  async clearHistory() {
    if (confirm('Clear all extraction history?')) {
      try {
        await chrome.runtime.sendMessage({
          action: 'clearHistory'
        });

        this.loadHistory();
        this.setStatus('History cleared', 'success');
      } catch (error) {
        console.error('Clear history error:', error);
        this.setStatus('Failed to clear history', 'error');
      }
    }
  }

  /**
   * Load LLM configuration
   */
  async loadLLMConfig() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getLLMConfig'
      });

      if (response.success) {
        this.llmConfig = response.config;

        // Update UI
        document.getElementById('llm-enabled').checked = this.llmConfig.enabled || false;
        document.getElementById('llm-endpoint').value = this.llmConfig.endpoint || 'http://localhost:11434/api/generate';
        document.getElementById('llm-model').value = this.llmConfig.model || 'llama2';
        document.getElementById('llm-api-key').value = this.llmConfig.apiKey || '';

        document.getElementById('llm-process-btn').disabled = !this.llmConfig.enabled;
      }
    } catch (error) {
      console.error('Load LLM config error:', error);
    }
  }

  /**
   * Save LLM configuration
   */
  async saveLLMConfig() {
    const config = {
      enabled: document.getElementById('llm-enabled').checked,
      endpoint: document.getElementById('llm-endpoint').value,
      model: document.getElementById('llm-model').value,
      apiKey: document.getElementById('llm-api-key').value
    };

    try {
      await chrome.runtime.sendMessage({
        action: 'saveLLMConfig',
        config: config
      });

      this.llmConfig = config;
      document.getElementById('llm-process-btn').disabled = !config.enabled;

      this.setStatus('LLM configuration saved', 'success');
    } catch (error) {
      console.error('Save LLM config error:', error);
      this.setStatus('Failed to save configuration', 'error');
    }
  }

  /**
   * Test LLM connection
   */
  async testLLMConnection() {
    const endpoint = document.getElementById('llm-endpoint').value;
    const apiKey = document.getElementById('llm-api-key').value;

    if (!endpoint) {
      this.setStatus('Please enter an endpoint URL', 'error');
      return;
    }

    this.setStatus('Testing LLM connection...');

    try {
      // Detect if this is a local Ollama instance (doesn't need API key)
      const isLocalOllama = endpoint.includes('localhost') || endpoint.includes('127.0.0.1');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Only send Authorization header for cloud services, not local Ollama
          ...(apiKey && !isLocalOllama && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          model: document.getElementById('llm-model').value || 'llama2',
          prompt: 'Hello',
          stream: false
        })
      });

      if (response.ok) {
        this.setStatus('LLM connection successful!', 'success');
      } else if (response.status === 403 && isLocalOllama) {
        // CORS forbidden error - provide helpful instructions
        console.error('CORS error: Ollama needs to allow chrome-extension origins');
        this.setStatus('CORS Error: Run "sudo snap set ollama origins=\\"chrome-extension://*\\"" and restart Ollama', 'error');
      } else {
        this.setStatus(`Connection failed: ${response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('LLM test error:', error);
      const endpoint = document.getElementById('llm-endpoint').value;
      const isLocalOllama = endpoint.includes('localhost') || endpoint.includes('127.0.0.1');

      // Detect CORS errors (typically show as "Failed to fetch")
      if (error.message.includes('Failed to fetch') && isLocalOllama) {
        this.setStatus('CORS Error: Run "sudo snap set ollama origins=\\"chrome-extension://*\\"" and restart Ollama', 'error');
      } else {
        this.setStatus(`Connection error: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Handle messages from background or content script
   */
  handleMessage(request) {
    switch (request.action) {
      case 'fieldSelected':
        // Update the field button to show it's been selected
        const btn = document.querySelector(`[data-field="${request.field}"]`);
        if (btn) {
          btn.classList.add('selected');
        }

        // Update extracted data
        this.extractedData = { ...this.extractedData };
        this.setStatus(`Captured: ${request.field}`, 'success');
        break;

      case 'autoExtractionComplete':
        this.extractedData = request.data;
        this.updateDataPreview();

        // Show appropriate status message
        const metadata = request.data?.extractionMetadata;
        if (metadata) {
          const recordCount = metadata.recordCount || 1;
          const pageType = metadata.pageType === 'MULTI_CASE_TABLE' ? 'table' : 'case';
          this.setStatus(`Extracted ${recordCount} ${pageType === 'table' ? 'cases from table' : 'case'}`, 'success');
        } else {
          this.setStatus('Auto-extraction complete!', 'success');
        }
        break;
    }
  }

  /**
   * Set status message
   */
  setStatus(message, type = '') {
    const statusBar = document.getElementById('status-bar');
    statusBar.textContent = message;
    statusBar.className = 'status-bar';

    if (type) {
      statusBar.classList.add(type);
    }

    // Auto-clear after 5 seconds
    setTimeout(() => {
      if (statusBar.textContent === message) {
        statusBar.textContent = 'Ready';
        statusBar.className = 'status-bar';
      }
    }, 5000);
  }
}

// Initialize popup when loaded
const popup = new PopupController();
