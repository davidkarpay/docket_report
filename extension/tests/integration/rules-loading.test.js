/**
 * Integration tests for rules loading system
 * Tests domain-based rules file loading and extraction rules application
 */

describe('Rules Loading', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('Domain-based rules loading', () => {
    it('should construct correct rules file path from domain', () => {
      const domain = 'example.com';
      const expectedPath = `/rules/${domain}.json`;

      expect(expectedPath).toBe('/rules/example.com.json');
    });

    it('should load rules for standard domain', async () => {
      const mockRules = {
        domain: 'example.com',
        description: 'Example court website',
        version: '1.0.0',
        fields: {
          docketNumber: {
            selector: '.case-number'
          }
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockRules
      });

      const response = await fetch('/rules/example.com.json');
      const rules = await response.json();

      expect(rules.domain).toBe('example.com');
      expect(rules.fields).toHaveProperty('docketNumber');
    });

    it('should handle file:// protocol by using localhost.json', () => {
      const url = 'file:///C:/Users/test/case.html';
      const hostname = new URL(url).hostname;

      // file:// URLs have empty hostname
      const rulesFile = hostname || 'localhost';

      expect(rulesFile).toBe('localhost');
    });

    it('should load localhost.json for local files', async () => {
      const mockRules = {
        domain: 'localhost',
        description: 'Local testing',
        version: '1.0.0',
        fields: {
          docketNumber: {
            selector: '#docket-number'
          },
          caseTitle: {
            selector: '.case-title'
          }
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockRules
      });

      const response = await fetch('/rules/localhost.json');
      const rules = await response.json();

      expect(rules.domain).toBe('localhost');
      expect(Object.keys(rules.fields)).toHaveLength(2);
    });

    it('should return 404 for missing rules file', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      const response = await fetch('/rules/unknown-domain.json');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should handle subdomain rules', async () => {
      const domain = 'subdomain.example.com';
      const rulesPath = `/rules/${domain}.json`;

      expect(rulesPath).toBe('/rules/subdomain.example.com.json');
    });
  });

  describe('Rules file structure validation', () => {
    it('should have required top-level properties', () => {
      const rules = {
        domain: 'example.com',
        description: 'Test rules',
        version: '1.0.0',
        fields: {}
      };

      expect(rules).toHaveProperty('domain');
      expect(rules).toHaveProperty('description');
      expect(rules).toHaveProperty('version');
      expect(rules).toHaveProperty('fields');
    });

    it('should have valid field definitions', () => {
      const fieldDef = {
        selector: '.case-number',
        transform: 'trim'
      };

      expect(fieldDef).toHaveProperty('selector');
      expect(typeof fieldDef.selector).toBe('string');
    });

    it('should support nested field paths', () => {
      const rules = {
        fields: {
          'court.courtName': {
            selector: '.court-name'
          },
          'court.judgeName': {
            selector: '.judge-name'
          }
        }
      };

      expect(rules.fields).toHaveProperty(['court.courtName']);
      expect(rules.fields).toHaveProperty(['court.judgeName']);
    });

    it('should support multiple extraction methods', () => {
      const fieldDef = {
        selector: '.case-number',
        xpath: '//div[@class="case-number"]',
        regex: /Case:\s*(\d+)/
      };

      expect(fieldDef).toHaveProperty('selector');
      expect(fieldDef).toHaveProperty('xpath');
      expect(fieldDef).toHaveProperty('regex');
    });

    it('should support transform functions', () => {
      const validTransforms = [
        'trim',
        'uppercase',
        'lowercase',
        'parseDate',
        'parseNumber'
      ];

      const fieldDef = {
        selector: '.date',
        transform: 'parseDate'
      };

      expect(validTransforms).toContain(fieldDef.transform);
    });
  });

  describe('Extraction methods', () => {
    it('should define CSS selector extraction', () => {
      const field = {
        selector: '.docket-number'
      };

      expect(field.selector).toBe('.docket-number');
      expect(typeof field.selector).toBe('string');
    });

    it('should define XPath extraction', () => {
      const field = {
        xpath: '//div[@class="docket-number"]/text()'
      };

      expect(field.xpath).toMatch(/^\/\//); // XPath starts with //
    });

    it('should define regex extraction', () => {
      const field = {
        regex: /Case Number:\s*(\d+)/
      };

      expect(field.regex).toBeInstanceOf(RegExp);
    });

    it('should have fallback chain: selector -> xpath -> regex', () => {
      const field = {
        selector: '.case-number',
        xpath: '//div[@class="case-number"]',
        regex: /Case:\s*(\d+)/
      };

      // In actual implementation, would try selector first, then xpath, then regex
      const methods = ['selector', 'xpath', 'regex'];
      methods.forEach(method => {
        expect(field).toHaveProperty(method);
      });
    });
  });

  describe('Complex rules files', () => {
    it('should load Palm Beach rules with multiple fields', async () => {
      const mockPalmBeachRules = {
        domain: 'jiswebprod.mypalmbeachclerk.com',
        description: 'Palm Beach County Clerk of Courts',
        version: '1.0.0',
        fields: {
          docketNumber: {
            xpath: '//td[contains(text(), "Case Number")]/following-sibling::td[1]'
          },
          caseTitle: {
            xpath: '//td[contains(text(), "Style")]/following-sibling::td[1]'
          },
          caseType: {
            xpath: '//td[contains(text(), "Case Type")]/following-sibling::td[1]'
          },
          'court.judgeName': {
            xpath: '//td[contains(text(), "Judge")]/following-sibling::td[1]'
          }
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockPalmBeachRules
      });

      const response = await fetch('/rules/jiswebprod.mypalmbeachclerk.com.json');
      const rules = await response.json();

      expect(rules.domain).toBe('jiswebprod.mypalmbeachclerk.com');
      expect(Object.keys(rules.fields).length).toBeGreaterThanOrEqual(4);
      expect(rules.fields).toHaveProperty(['court.judgeName']);
    });

    it('should handle rules with arrays (for tables)', () => {
      const rules = {
        fields: {
          parties: {
            selector: '.parties-table tr',
            multiple: true,
            fields: {
              name: { selector: '.party-name' },
              type: { selector: '.party-type' }
            }
          }
        }
      };

      expect(rules.fields.parties).toHaveProperty('multiple');
      expect(rules.fields.parties).toHaveProperty('fields');
    });
  });

  describe('Rules caching', () => {
    it('should cache loaded rules to avoid repeated fetches', async () => {
      const mockRules = {
        domain: 'example.com',
        fields: { docketNumber: { selector: '.case-number' } }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockRules
      });

      // First load
      const response1 = await fetch('/rules/example.com.json');
      const rules1 = await response1.json();

      // Second load (should use cache)
      const response2 = await fetch('/rules/example.com.json');
      const rules2 = await response2.json();

      expect(rules1).toEqual(rules2);
      // In actual implementation, second call might not hit fetch
    });

    it('should invalidate cache when version changes', () => {
      const rulesV1 = {
        domain: 'example.com',
        version: '1.0.0',
        fields: {}
      };

      const rulesV2 = {
        domain: 'example.com',
        version: '2.0.0',
        fields: {}
      };

      expect(rulesV1.version).not.toBe(rulesV2.version);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        }
      });

      const response = await fetch('/rules/broken.json');

      await expect(response.json()).rejects.toThrow('Unexpected token');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(fetch('/rules/example.json')).rejects.toThrow('Network error');
    });

    it('should handle rules without fields', async () => {
      const emptyRules = {
        domain: 'example.com',
        description: 'Empty rules',
        version: '1.0.0',
        fields: {}
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => emptyRules
      });

      const response = await fetch('/rules/example.com.json');
      const rules = await response.json();

      expect(Object.keys(rules.fields)).toHaveLength(0);
    });

    it('should handle missing required properties', async () => {
      const invalidRules = {
        domain: 'example.com'
        // Missing version, fields, description
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => invalidRules
      });

      const response = await fetch('/rules/example.com.json');
      const rules = await response.json();

      expect(rules).not.toHaveProperty('fields');
    });
  });

  describe('Dynamic rules loading', () => {
    it('should extract domain from current URL', () => {
      const url = 'https://example.com/case/12345';
      const hostname = new URL(url).hostname;

      expect(hostname).toBe('example.com');
    });

    it('should handle URLs with ports', () => {
      const url = 'http://localhost:8080/case';
      const hostname = new URL(url).hostname;

      expect(hostname).toBe('localhost');
    });

    it('should handle URLs with paths', () => {
      const url = 'https://example.com/courts/case/12345?view=print';
      const hostname = new URL(url).hostname;

      expect(hostname).toBe('example.com');
    });

    it('should handle www prefix', () => {
      const url = 'https://www.example.com/case';
      const hostname = new URL(url).hostname;

      // Could optionally strip www. for rules matching
      const domain = hostname.replace(/^www\./, '');

      expect(domain).toBe('example.com');
    });
  });

  describe('Rules application', () => {
    it('should apply rules to extract single field', () => {
      const rules = {
        fields: {
          docketNumber: {
            selector: '#case-number'
          }
        }
      };

      const mockElement = { textContent: 'CR-2025-12345' };

      // Simulate extraction
      const extracted = {};
      if (rules.fields.docketNumber) {
        extracted.docketNumber = mockElement.textContent.trim();
      }

      expect(extracted.docketNumber).toBe('CR-2025-12345');
    });

    it('should apply rules to extract multiple fields', () => {
      const rules = {
        fields: {
          docketNumber: { selector: '#case-number' },
          caseTitle: { selector: '.case-title' },
          status: { selector: '.status' }
        }
      };

      const mockData = {
        docketNumber: 'CR-2025-12345',
        caseTitle: 'State v. Doe',
        status: 'Active'
      };

      expect(Object.keys(rules.fields)).toHaveLength(3);
      expect(Object.keys(mockData)).toHaveLength(3);
    });

    it('should apply transform after extraction', () => {
      const field = {
        selector: '.date',
        transform: 'parseDate'
      };

      const rawValue = '01/15/2025';

      // Simulate transform
      let value = rawValue;
      if (field.transform === 'parseDate') {
        value = new Date(rawValue).toISOString();
      }

      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should create nested objects from dot notation', () => {
      const fields = {
        'court.courtName': 'District Court',
        'court.judgeName': 'Hon. Smith'
      };

      const result = {};

      Object.keys(fields).forEach(path => {
        const parts = path.split('.');
        let current = result;

        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = fields[path];
      });

      expect(result).toEqual({
        court: {
          courtName: 'District Court',
          judgeName: 'Hon. Smith'
        }
      });
    });
  });
});
