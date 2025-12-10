/**
 * Client Docket Manager Extractor - Background Service Worker
 * Manages data storage, processing, and communication between components
 */

// Native messaging host name - must match manifest
const NATIVE_HOST_NAME = 'com.docketsuite.native';

class BackgroundService {
  constructor() {
    this.extractionHistory = [];
    this.llmConfig = null;
    this.nativeHostConnected = false;
    this.saveToDatabaseEnabled = true; // Enable database saving by default
    this.init();
  }

  async init() {
    console.log('Background service worker initialized');

    // Load saved data
    await this.loadData();

    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep channel open for async
    });

    // Listen for extension icon click
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });

    // Load LLM configuration
    await this.loadLLMConfig();

    // Load database settings
    await this.loadDatabaseSettings();

    // Test native host connection
    this.testNativeHostConnection();
  }

  /**
   * Load database settings from storage
   */
  async loadDatabaseSettings() {
    const result = await chrome.storage.local.get(['saveToDatabaseEnabled']);
    if (result.saveToDatabaseEnabled !== undefined) {
      this.saveToDatabaseEnabled = result.saveToDatabaseEnabled;
    }
  }

  /**
   * Save database settings to storage
   */
  async saveDatabaseSettings(enabled) {
    this.saveToDatabaseEnabled = enabled;
    await chrome.storage.local.set({ saveToDatabaseEnabled: enabled });
  }

  /**
   * Test connection to native messaging host
   */
  async testNativeHostConnection() {
    try {
      const response = await this.sendToNativeHost({ action: 'ping' });
      if (response && response.success) {
        this.nativeHostConnected = true;
        console.log('Native host connected:', response.version, 'DB:', response.db_path);
      }
    } catch (error) {
      this.nativeHostConnected = false;
      console.log('Native host not available:', error.message);
    }
  }

  /**
   * Send message to native messaging host
   */
  sendToNativeHost(message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Save case to SQLite database via native host
   * Routes to different actions based on page type:
   * - SINGLE_CASE_DETAIL -> update_case (auto-update existing case)
   * - MULTI_CASE_TABLE -> save_case (batch insert new cases)
   */
  async saveToDatabaseViaHost(data) {
    if (!this.saveToDatabaseEnabled) {
      console.log('Database saving disabled');
      return null;
    }

    try {
      // Determine action based on page type
      const pageType = data.extractionMetadata?.pageType;
      const action = pageType === 'SINGLE_CASE_DETAIL' ? 'update_case' : 'save_case';

      console.log(`Using action '${action}' for pageType: ${pageType}`);

      const response = await this.sendToNativeHost({
        action: action,
        data: data,
        metadata: data.extractionMetadata || {}
      });

      if (response && response.success) {
        // Handle different response types
        if (response.case_ids !== undefined) {
          // Multi-case save
          console.log(`Saved ${response.count} cases to database, IDs:`, response.case_ids);
          if (response.errors) {
            console.warn('Some cases had errors:', response.errors);
          }
          return response.case_ids;
        } else if (response.case_id !== undefined) {
          // Single case save/update
          const verb = response.was_update ? 'Updated' : 'Created';
          console.log(`${verb} case in database, ID: ${response.case_id}, docket: ${response.docket_number}`);
          return response.case_id;
        } else {
          console.log('Saved to database (no ID returned)', response);
          return true;
        }
      } else {
        console.error('Database save failed:', response?.error);
        return null;
      }
    } catch (error) {
      console.error('Error saving to database:', error.message);
      return null;
    }
  }

  /**
   * Handle messages from content scripts or popup
   */
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'saveExtraction':
          await this.saveExtraction(request.data);
          sendResponse({ success: true });
          break;

        case 'getHistory':
          sendResponse({ success: true, history: this.extractionHistory });
          break;

        case 'clearHistory':
          await this.clearHistory();
          sendResponse({ success: true });
          break;

        case 'exportData':
          const exported = await this.exportData(request.format);
          sendResponse({ success: true, data: exported });
          break;

        case 'processWithLLM':
          const processed = await this.processWithLLM(request.data);
          sendResponse({ success: true, data: processed });
          break;

        case 'getLLMConfig':
          sendResponse({ success: true, config: this.llmConfig });
          break;

        case 'saveLLMConfig':
          await this.saveLLMConfig(request.config);
          sendResponse({ success: true });
          break;

        case 'fieldSelected':
        case 'autoExtractionComplete':
          // Relay to popup if open
          this.notifyPopup(request);
          sendResponse({ success: true });
          break;

        // Database operations via native messaging
        case 'getDatabaseStatus':
          sendResponse({
            success: true,
            connected: this.nativeHostConnected,
            enabled: this.saveToDatabaseEnabled
          });
          break;

        case 'setDatabaseEnabled':
          await this.saveDatabaseSettings(request.enabled);
          sendResponse({ success: true });
          break;

        case 'testDatabaseConnection':
          await this.testNativeHostConnection();
          sendResponse({
            success: true,
            connected: this.nativeHostConnected
          });
          break;

        case 'searchDatabase':
          const searchResults = await this.searchDatabase(request.query);
          sendResponse({ success: true, results: searchResults });
          break;

        case 'getDatabaseStats':
          const stats = await this.getDatabaseStats();
          sendResponse({ success: true, stats: stats });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle extension icon click
   */
  handleActionClick(tab) {
    // Open popup (default behavior in manifest v3)
    console.log('Extension clicked on tab:', tab.id);
  }

  /**
   * Save extracted data to history and database
   */
  async saveExtraction(data) {
    const entry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      url: data.extractionMetadata?.sourceUrl || 'unknown',
      data: data,
      dbCaseId: null
    };

    // Save to SQLite database via native host
    if (this.saveToDatabaseEnabled && this.nativeHostConnected) {
      const caseId = await this.saveToDatabaseViaHost(data);
      entry.dbCaseId = caseId;
    }

    this.extractionHistory.unshift(entry);

    // Keep only last 100 entries
    if (this.extractionHistory.length > 100) {
      this.extractionHistory = this.extractionHistory.slice(0, 100);
    }

    await this.persistData();

    // Show notification
    let hostname;
    try {
      hostname = new URL(entry.url).hostname || 'local file';
    } catch {
      hostname = entry.url || 'unknown';
    }

    let dbStatus = '';
    if (entry.dbCaseId) {
      if (Array.isArray(entry.dbCaseId)) {
        dbStatus = ` (${entry.dbCaseId.length} cases saved to DB)`;
      } else {
        dbStatus = ` (DB ID: ${entry.dbCaseId})`;
      }
    }
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Data Extracted',
      message: `Case data saved from ${hostname}${dbStatus}`
    });
  }

  /**
   * Search cases in the database
   */
  async searchDatabase(query) {
    if (!this.nativeHostConnected) {
      return [];
    }

    try {
      const response = await this.sendToNativeHost({
        action: 'search',
        query: query,
        limit: 50
      });

      if (response && response.success) {
        return response.cases || [];
      }
      return [];
    } catch (error) {
      console.error('Database search error:', error);
      return [];
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    if (!this.nativeHostConnected) {
      return null;
    }

    try {
      const response = await this.sendToNativeHost({
        action: 'get_stats'
      });

      if (response && response.success) {
        return {
          totalCases: response.total_cases,
          byStatus: response.by_status,
          bySource: response.by_source
        };
      }
      return null;
    } catch (error) {
      console.error('Database stats error:', error);
      return null;
    }
  }

  /**
   * Load data from storage
   */
  async loadData() {
    const result = await chrome.storage.local.get(['extractionHistory']);
    if (result.extractionHistory) {
      this.extractionHistory = result.extractionHistory;
    }
  }

  /**
   * Persist data to storage
   */
  async persistData() {
    await chrome.storage.local.set({
      extractionHistory: this.extractionHistory
    });
  }

  /**
   * Clear extraction history
   */
  async clearHistory() {
    this.extractionHistory = [];
    await this.persistData();
  }

  /**
   * Export data in specified format
   */
  async exportData(format = 'json') {
    const exportObj = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cases: this.extractionHistory.map(entry => entry.data)
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportObj, null, 2);

      case 'csv':
        return this.convertToCSV(exportObj.cases);

      default:
        return exportObj;
    }
  }

  /**
   * Convert extracted data to CSV format
   */
  convertToCSV(cases) {
    if (!cases || cases.length === 0) return '';

    // Flatten the data structure
    const rows = [];
    const headers = new Set();

    cases.forEach(caseData => {
      const flattened = this.flattenObject(caseData);
      Object.keys(flattened).forEach(key => headers.add(key));
      rows.push(flattened);
    });

    // Create CSV
    const headerArray = Array.from(headers);
    const csvLines = [headerArray.join(',')];

    rows.forEach(row => {
      const values = headerArray.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvLines.push(values.join(','));
    });

    return csvLines.join('\n');
  }

  /**
   * Flatten nested object for CSV export
   */
  flattenObject(obj, prefix = '') {
    const flattened = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        flattened[newKey] = JSON.stringify(value);
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Process extracted data with LLM
   */
  async processWithLLM(data) {
    if (!this.llmConfig || !this.llmConfig.enabled) {
      throw new Error('LLM not configured');
    }

    try {
      // Check if this is multi-case table data (has extractionMetadata.pageType and data array)
      const isMultiCase = data.extractionMetadata?.pageType === 'MULTI_CASE_TABLE' &&
                         Array.isArray(data.data);

      if (isMultiCase) {
        console.log(`Processing ${data.data.length} cases individually through LLM...`);

        const processedCases = [];

        // Process each case separately
        for (let i = 0; i < data.data.length; i++) {
          const caseData = data.data[i];
          console.log(`Processing case ${i + 1} of ${data.data.length}: ${caseData.caseNumber || 'Unknown'}`);

          try {
            const processedCase = await this.processSingleCaseWithLLM(caseData);
            processedCases.push(processedCase);
          } catch (error) {
            console.error(`Error processing case ${i + 1}:`, error);
            // Keep original data if LLM processing fails for this case
            processedCases.push({ ...caseData, llmError: error.message });
          }
        }

        // Return with same structure, preserving metadata
        return {
          data: processedCases,
          extractionMetadata: {
            ...data.extractionMetadata,
            llmProcessed: true,
            llmProcessedCount: processedCases.filter(c => !c.llmError).length
          }
        };

      } else {
        // Single case processing (traditional flow)
        console.log('Processing single case with LLM...');

        // Extract the actual case data (handle both old and new structure)
        const caseData = data.data || data;
        const processedCase = await this.processSingleCaseWithLLM(caseData);

        // Ensure complete metadata with defensive fallbacks
        const metadata = {
          extractedAt: data.extractionMetadata?.extractedAt || new Date().toISOString(),
          sourceUrl: data.extractionMetadata?.sourceUrl || 'unknown',
          extractorVersion: data.extractionMetadata?.extractorVersion || '2.0.0',
          pageType: data.extractionMetadata?.pageType || 'SINGLE_CASE_DETAIL',
          recordCount: 1,
          llmProcessed: true
        };

        // Return in new standardized structure
        return {
          data: processedCase,
          extractionMetadata: metadata
        };
      }

    } catch (error) {
      console.error('LLM processing error:', error);

      // Enhance error message for CORS issues
      if (error.message.includes('Failed to fetch')) {
        const isLocalOllama = this.llmConfig.endpoint.includes('localhost') ||
                             this.llmConfig.endpoint.includes('127.0.0.1');
        if (isLocalOllama) {
          throw new Error('CORS Error: Ollama needs to allow chrome-extension origins. Run: sudo snap set ollama origins="chrome-extension://*" && sudo systemctl restart snap.ollama.listener.service');
        }
      }

      throw error;
    }
  }

  /**
   * Process a single case with LLM
   */
  async processSingleCaseWithLLM(caseData) {
    const prompt = this.buildLLMPrompt(caseData);

    // Detect if this is a local Ollama instance (doesn't need API key)
    const isLocalOllama = this.llmConfig.endpoint.includes('localhost') ||
                         this.llmConfig.endpoint.includes('127.0.0.1');

    const response = await fetch(this.llmConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Only send Authorization header for cloud services, not local Ollama
        ...(this.llmConfig.apiKey && !isLocalOllama && { 'Authorization': `Bearer ${this.llmConfig.apiKey}` })
      },
      body: JSON.stringify({
        model: this.llmConfig.model || 'llama2',
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      // Provide helpful CORS error message for local Ollama
      if (response.status === 403 && isLocalOllama) {
        throw new Error('CORS Error: Ollama needs to allow chrome-extension origins. Run: sudo snap set ollama origins="chrome-extension://*" && sudo systemctl restart snap.ollama.listener.service');
      }
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const result = await response.json();

    // Parse LLM response and merge with original data
    const parsed = this.parseLLMResponse(result.response || result.text);

    // Merge original data with LLM enhancements
    return { ...caseData, ...parsed, llmProcessed: true };
  }

  /**
   * Build prompt for LLM
   */
  buildLLMPrompt(data) {
    // Check if data is already well-structured (from court calendar)
    const isStructured = data.caseNumber && data.name && data.statuteDescription;

    if (isStructured) {
      // Simpler prompt for already-structured court calendar data
      return `Normalize this court case data into a clean JSON structure.

Input:
${JSON.stringify(data, null, 2)}

Return JSON with this exact structure:
{
  "caseInfo": {
    "docketNumber": "${data.caseNumber || ''}",
    "defendant": "${data.name || ''}",
    "dateOfBirth": "${data.dob || ''}",
    "caseType": "Misdemeanor",
    "status": "${data.status || ''}",
    "parties": [
      {"name": "${data.name || ''}", "role": "Defendant"},
      {"name": "${data.publicDefender || ''}", "role": "Defense Attorney"},
      {"name": "${data.stateAttorney || ''}", "role": "Prosecutor"}
    ],
    "charges": [SPLIT the statuteDescription by comma into array of {charge, statute, degree}],
    "nextHearing": {
      "date": "CONVERT ${data.courtDate || ''} to ISO format YYYY-MM-DD",
      "type": "${data.courtEventType || ''}",
      "location": "${data.courtroom || ''}"
    },
    "custody": {
      "inCustody": true,
      "location": "${data.jailCell || ''}"
    }
  }
}

IMPORTANT: Return ONLY the JSON object. Split charges by comma. Convert date to YYYY-MM-DD format.`;
    }

    // Original complex prompt for unstructured data
    return `You are a legal data extraction assistant. Parse and structure the following case information into clean, well-organized JSON.

Raw extracted data:
${JSON.stringify(data, null, 2)}

Your task:
1. Extract and clean all case information
2. Parse party names from case title (e.g., "State v. Doe" → State is plaintiff, Doe is defendant)
3. Structure dates in ISO format (YYYY-MM-DD)
4. Extract charges as an array if multiple charges exist
5. Organize court information hierarchically

Return ONLY valid JSON with this structure:
{
  "caseInfo": {
    "docketNumber": "string",
    "caseTitle": "string",
    "caseType": "string",
    "parties": [{"name": "string", "role": "string"}],
    "charges": [{"charge": "string", "statute": "string", "degree": "string"}],
    "nextHearing": {"date": "YYYY-MM-DD", "type": "string", "location": "string"},
    "court": {"name": "string", "division": "string"}
  }
}

Return ONLY the JSON object, no other text.`;
  }

  /**
   * Parse LLM response
   */
  parseLLMResponse(response) {
    console.log('Raw LLM response:', response);

    if (!response) {
      console.error('Empty LLM response');
      return { llmParseError: 'Empty response from LLM' };
    }

    try {
      // Try to extract JSON from response - handle markdown code blocks
      let cleanResponse = response.trim();

      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.slice(7);
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.slice(3);
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(0, -3);
      }
      cleanResponse = cleanResponse.trim();

      // Try to find JSON object
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed LLM response:', parsed);
        return parsed;
      }

      console.error('No JSON found in LLM response');
      return { llmParseError: 'No JSON found in response', rawResponse: response.substring(0, 500) };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      return { llmParseError: error.message, rawResponse: response.substring(0, 500) };
    }
  }

  /**
   * Load LLM configuration
   */
  async loadLLMConfig() {
    const result = await chrome.storage.local.get(['llmConfig']);
    this.llmConfig = result.llmConfig || {
      enabled: false,
      endpoint: 'http://localhost:11434/api/generate', // Default Ollama endpoint
      model: 'llama2',
      apiKey: null
    };
  }

  /**
   * Save LLM configuration
   */
  async saveLLMConfig(config) {
    this.llmConfig = config;
    await chrome.storage.local.set({ llmConfig: config });
  }

  /**
   * Notify popup of events
   */
  notifyPopup(message) {
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup may not be open, ignore error
    });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize background service
const backgroundService = new BackgroundService();
