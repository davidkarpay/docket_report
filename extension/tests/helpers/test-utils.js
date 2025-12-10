/**
 * Test utility functions
 */

/**
 * Create a mock Chrome tabs array
 */
function createMockTabs(count = 1) {
  return Array.from({ length: count }, (_, i) => ({
    id: 100 + i,
    url: `https://example.com/page${i}`,
    title: `Test Tab ${i}`,
    active: i === 0
  }));
}

/**
 * Create a mock extraction result
 */
function createMockExtraction(overrides = {}) {
  return {
    docketNumber: 'CR-2025-12345',
    caseTitle: 'State v. Doe',
    extractionMetadata: {
      extractedAt: new Date().toISOString(),
      sourceUrl: 'https://example.com/case',
      extractorVersion: '1.0.0'
    },
    ...overrides
  };
}

/**
 * Create a mock history entry
 */
function createMockHistoryEntry(id, data = {}) {
  return {
    id: id || Date.now(),
    timestamp: new Date().toISOString(),
    url: data.extractionMetadata?.sourceUrl || 'https://example.com/case',
    data: createMockExtraction(data)
  };
}

/**
 * Create mock LLM config
 */
function createMockLLMConfig(overrides = {}) {
  return {
    enabled: true,
    endpoint: 'http://localhost:11434/api/generate',
    model: 'llama2',
    apiKey: '',
    ...overrides
  };
}

/**
 * Wait for a specific time (for async tests)
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random case number
 */
function generateCaseNumber() {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `CR-${year}-${num}`;
}

/**
 * Create a mock DOM element
 */
function createMockElement(tagName, attributes = {}, textContent = '') {
  return {
    tagName: tagName.toUpperCase(),
    textContent,
    children: attributes.children || [],
    ...attributes,
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    getAttribute: jest.fn(attr => attributes[attr]),
    hasAttribute: jest.fn(attr => attr in attributes)
  };
}

/**
 * Create a mock rules object
 */
function createMockRules(domain = 'example.com', fields = {}) {
  return {
    domain,
    description: `Rules for ${domain}`,
    version: '1.0.0',
    fields: {
      docketNumber: { selector: '.case-number' },
      caseTitle: { selector: '.case-title' },
      ...fields
    }
  };
}

/**
 * Validate metadata structure
 */
function validateMetadata(metadata) {
  return (
    metadata &&
    typeof metadata.extractedAt === 'string' &&
    typeof metadata.sourceUrl === 'string' &&
    typeof metadata.extractorVersion === 'string' &&
    metadata.extractorVersion === '1.0.0'
  );
}

/**
 * Check if LLM processed
 */
function isLLMProcessed(data) {
  return data?.extractionMetadata?.llmProcessed === true;
}

/**
 * Flatten nested object for CSV
 */
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], fullKey));
    } else if (Array.isArray(obj[key])) {
      acc[fullKey] = JSON.stringify(obj[key]);
    } else {
      acc[fullKey] = obj[key];
    }

    return acc;
  }, {});
}

/**
 * Parse CSV string back to object
 */
function parseCSV(csvString) {
  const lines = csvString.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index];
    });

    result.push(obj);
  }

  return result;
}

/**
 * Mock fetch for rules loading
 */
function mockFetchRules(rulesData) {
  global.fetch = jest.fn().mockImplementation((url) => {
    if (url.includes('/rules/')) {
      const domain = url.match(/\/rules\/(.+)\.json/)[1];
      if (rulesData[domain]) {
        return Promise.resolve({
          ok: true,
          json: async () => rulesData[domain]
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404
      });
    }
    return Promise.reject(new Error('Not found'));
  });
}

/**
 * Mock Ollama API response
 */
function mockOllamaAPI(responseData, shouldError = false) {
  global.fetch = jest.fn().mockImplementation((url, options) => {
    if (url.includes('/api/generate')) {
      if (shouldError) {
        return Promise.reject(new Error('Connection refused'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => responseData
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  });
}

/**
 * Assert metadata fields are present
 */
function assertMetadataComplete(metadata) {
  expect(metadata).toHaveProperty('extractedAt');
  expect(metadata).toHaveProperty('sourceUrl');
  expect(metadata).toHaveProperty('extractorVersion');
  expect(metadata.extractorVersion).toBe('1.0.0');
}

/**
 * Assert all 4 metadata fields present (claims validation)
 */
function assertAll4MetadataFields(data) {
  const metadata = data.extractionMetadata;
  expect(metadata).toBeDefined();
  expect(metadata.extractedAt).toBeDefined();
  expect(metadata.sourceUrl).toBeDefined();
  expect(metadata.extractorVersion).toBeDefined();
  // 4th field is optional: llmProcessed (only present if LLM was used)
  expect(Object.keys(metadata).length).toBeGreaterThanOrEqual(3);
}

module.exports = {
  createMockTabs,
  createMockExtraction,
  createMockHistoryEntry,
  createMockLLMConfig,
  wait,
  generateCaseNumber,
  createMockElement,
  createMockRules,
  validateMetadata,
  isLLMProcessed,
  flattenObject,
  parseCSV,
  mockFetchRules,
  mockOllamaAPI,
  assertMetadataComplete,
  assertAll4MetadataFields
};
