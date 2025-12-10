/**
 * Unit tests for Field Patterns
 */

const { FIELD_PATTERNS } = require('../../src/content/field-patterns.js');

describe('FIELD_PATTERNS', () => {

  describe('Structure validation', () => {
    it('should have all expected field types', () => {
      const expectedFields = [
        'docketNumber', 'caseTitle', 'judgeName', 'filingDate',
        'defendantName', 'plaintiffName', 'courtName', 'charge',
        'bondAmount', 'attorneyName', 'caseType', 'status', 'division'
      ];

      expectedFields.forEach(field => {
        expect(FIELD_PATTERNS).toHaveProperty(field);
      });
    });

    it('should have proper structure for each field', () => {
      Object.keys(FIELD_PATTERNS).forEach(fieldName => {
        const field = FIELD_PATTERNS[fieldName];
        expect(field).toHaveProperty('labels');
        expect(field).toHaveProperty('valuePatterns');
        expect(field).toHaveProperty('weights');
        expect(field).toHaveProperty('category');
        expect(Array.isArray(field.labels)).toBe(true);
        expect(Array.isArray(field.valuePatterns)).toBe(true);
      });
    });

    it('should have weight properties for each field', () => {
      Object.keys(FIELD_PATTERNS).forEach(fieldName => {
        const weights = FIELD_PATTERNS[fieldName].weights;
        expect(weights).toHaveProperty('exactLabelMatch');
        expect(weights).toHaveProperty('partialLabelMatch');
        expect(weights).toHaveProperty('valuePatternMatch');
        expect(weights).toHaveProperty('position');
      });
    });

    it('should have valid category values', () => {
      const validCategories = [
        'case_identification', 'court_details', 'parties',
        'dates', 'charges', 'bond'
      ];

      Object.keys(FIELD_PATTERNS).forEach(fieldName => {
        const category = FIELD_PATTERNS[fieldName].category;
        expect(validCategories).toContain(category);
      });
    });
  });

  describe('docketNumber patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.docketNumber;

    it('should match Palm Beach format', () => {
      const palmBeachFormat = '50-2025-MM-008893-AXXX-MB';
      const matches = valuePatterns.some(pattern => pattern.test(palmBeachFormat));
      expect(matches).toBe(true);
    });

    it('should match CR-YYYY-NNNNN format', () => {
      expect(valuePatterns.some(p => p.test('CR-2025-12345'))).toBe(true);
      expect(valuePatterns.some(p => p.test('CF-2024-123456'))).toBe(true);
    });

    it('should match YYYY-XXX-NNNNN format', () => {
      expect(valuePatterns.some(p => p.test('2025-CF-12345'))).toBe(true);
      expect(valuePatterns.some(p => p.test('2024-MM-98765'))).toBe(true);
    });

    it('should match 8-digit format', () => {
      expect(valuePatterns.some(p => p.test('12345678'))).toBe(true);
    });

    it('should match A-prefix format', () => {
      expect(valuePatterns.some(p => p.test('A1234567'))).toBe(true);
    });

    it('should match compact format 25CR12345', () => {
      expect(valuePatterns.some(p => p.test('25CR12345'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.docketNumber.labels;
      expect(labels).toContain('case number');
      expect(labels).toContain('docket number');
    });
  });

  describe('caseTitle patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.caseTitle;

    it('should match "v." format', () => {
      expect(valuePatterns.some(p => p.test('State v. Doe'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Smith v Jones'))).toBe(true);
    });

    it('should match "vs." format', () => {
      expect(valuePatterns.some(p => p.test('State vs. Doe'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Smith vs Jones'))).toBe(true);
    });

    it('should match case insensitive', () => {
      expect(valuePatterns.some(p => p.test('STATE V. DOE'))).toBe(true);
      expect(valuePatterns.some(p => p.test('state v. doe'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.caseTitle.labels;
      expect(labels).toContain('case title');
      expect(labels).toContain('case caption');
    });
  });

  describe('judgeName patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.judgeName;

    it('should match "Hon. First Last" format', () => {
      expect(valuePatterns.some(p => p.test('Hon. Jane Smith'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Hon John Doe'))).toBe(true);
    });

    it('should match "Judge First Last" format', () => {
      expect(valuePatterns.some(p => p.test('Judge Jane Smith'))).toBe(true);
      expect(valuePatterns.some(p => p.test('judge john doe'))).toBe(true);
    });

    it('should match "Last, First" format', () => {
      expect(valuePatterns.some(p => p.test('Smith, Jane'))).toBe(true);
    });

    it('should match all caps format', () => {
      expect(valuePatterns.some(p => p.test('JANE SMITH'))).toBe(true);
      expect(valuePatterns.some(p => p.test('J. SMITH'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.judgeName.labels;
      expect(labels).toContain('judge');
      expect(labels).toContain('assigned judge');
    });
  });

  describe('filingDate patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.filingDate;

    it('should match MM/DD/YYYY format', () => {
      expect(valuePatterns.some(p => p.test('01/15/2025'))).toBe(true);
      expect(valuePatterns.some(p => p.test('1/5/25'))).toBe(true);
    });

    it('should match YYYY-MM-DD format', () => {
      expect(valuePatterns.some(p => p.test('2025-01-15'))).toBe(true);
    });

    it('should match "Month DD, YYYY" format', () => {
      expect(valuePatterns.some(p => p.test('Jan 15, 2025'))).toBe(true);
      expect(valuePatterns.some(p => p.test('December 1, 2024'))).toBe(true);
    });

    it('should match abbreviated months', () => {
      expect(valuePatterns.some(p => p.test('Feb 1 2025'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Oct 31, 2024'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.filingDate.labels;
      expect(labels).toContain('filing date');
      expect(labels).toContain('date filed');
    });
  });

  describe('defendantName patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.defendantName;

    it('should match "Last, First" format', () => {
      expect(valuePatterns.some(p => p.test('Doe, John'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Smith, Jane M.'))).toBe(true);
    });

    it('should match "First Last" format', () => {
      expect(valuePatterns.some(p => p.test('John Doe'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Jane Smith'))).toBe(true);
    });

    it('should match all caps format', () => {
      expect(valuePatterns.some(p => p.test('DOE, JOHN'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.defendantName.labels;
      expect(labels).toContain('defendant');
      expect(labels).toContain('accused');
    });
  });

  describe('plaintiffName patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.plaintiffName;

    it('should match name formats', () => {
      expect(valuePatterns.some(p => p.test('Smith, Jane'))).toBe(true);
      expect(valuePatterns.some(p => p.test('John Doe'))).toBe(true);
    });

    it('should match "State of X" format', () => {
      expect(valuePatterns.some(p => p.test('State of Florida'))).toBe(true);
      expect(valuePatterns.some(p => p.test('County of Miami'))).toBe(true);
      expect(valuePatterns.some(p => p.test('City of Tampa'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.plaintiffName.labels;
      expect(labels).toContain('plaintiff');
      expect(labels).toContain('petitioner');
    });
  });

  describe('courtName patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.courtName;

    it('should match court type patterns', () => {
      expect(valuePatterns.some(p => p.test('15th Circuit Court'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Palm Beach County Court'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Federal District Court'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Miami Superior Court'))).toBe(true);
    });

    it('should match "Court of X" format', () => {
      expect(valuePatterns.some(p => p.test('Court of Appeals'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Court of Common Pleas'))).toBe(true);
    });

    it('should match clerk references', () => {
      expect(valuePatterns.some(p => p.test('Miami-Dade Clerk'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.courtName.labels;
      expect(labels).toContain('court');
      expect(labels).toContain('court name');
    });
  });

  describe('charge patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.charge;

    it('should match statute number format', () => {
      expect(valuePatterns.some(p => p.test('893.13.6'))).toBe(true);
      expect(valuePatterns.some(p => p.test('316.193.1'))).toBe(true);
    });

    it('should match "FS ###" format', () => {
      expect(valuePatterns.some(p => p.test('FS 316.193'))).toBe(true);
      expect(valuePatterns.some(p => p.test('FL 893.13'))).toBe(true);
    });

    it('should match statute with subsections', () => {
      expect(valuePatterns.some(p => p.test('893(a)(1)'))).toBe(true);
      expect(valuePatterns.some(p => p.test('316(b)(2)'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.charge.labels;
      expect(labels).toContain('charge');
      expect(labels).toContain('statute');
    });
  });

  describe('bondAmount patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.bondAmount;

    it('should match dollar format with commas', () => {
      expect(valuePatterns.some(p => p.test('$1,000.00'))).toBe(true);
      expect(valuePatterns.some(p => p.test('$50,000.00'))).toBe(true);
    });

    it('should match decimal format', () => {
      expect(valuePatterns.some(p => p.test('1000.00'))).toBe(true);
      expect(valuePatterns.some(p => p.test('25000.50'))).toBe(true);
    });

    it('should match integer format with commas', () => {
      expect(valuePatterns.some(p => p.test('1,000'))).toBe(true);
      expect(valuePatterns.some(p => p.test('50,000'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.bondAmount.labels;
      expect(labels).toContain('bond');
      expect(labels).toContain('bail');
    });
  });

  describe('attorneyName patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.attorneyName;

    it('should match "Last, First Esq." format', () => {
      expect(valuePatterns.some(p => p.test('Smith, John Esq.'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Doe, Jane M. Esq'))).toBe(true);
    });

    it('should match "First Last Esq." format', () => {
      expect(valuePatterns.some(p => p.test('John Smith Esq.'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Jane Doe Esq'))).toBe(true);
    });

    it('should match names without Esq.', () => {
      expect(valuePatterns.some(p => p.test('Smith, John'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Jane Doe'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.attorneyName.labels;
      expect(labels).toContain('attorney');
      expect(labels).toContain('counsel');
    });
  });

  describe('caseType patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.caseType;

    it('should match case type keywords', () => {
      expect(valuePatterns.some(p => p.test('criminal'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Civil'))).toBe(true);
      expect(valuePatterns.some(p => p.test('FAMILY'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Probate'))).toBe(true);
      expect(valuePatterns.some(p => p.test('juvenile'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Traffic'))).toBe(true);
    });

    it('should match within longer strings', () => {
      expect(valuePatterns.some(p => p.test('Criminal - Felony'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Civil Action'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.caseType.labels;
      expect(labels).toContain('case type');
      expect(labels).toContain('type');
    });
  });

  describe('status patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.status;

    it('should match status keywords', () => {
      expect(valuePatterns.some(p => p.test('active'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Pending'))).toBe(true);
      expect(valuePatterns.some(p => p.test('CLOSED'))).toBe(true);
      expect(valuePatterns.some(p => p.test('disposed'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Open'))).toBe(true);
      expect(valuePatterns.some(p => p.test('terminated'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Dismissed'))).toBe(true);
    });

    it('should match within longer strings', () => {
      expect(valuePatterns.some(p => p.test('Status: Active'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Case is pending'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.status.labels;
      expect(labels).toContain('status');
      expect(labels).toContain('case status');
    });
  });

  describe('division patterns', () => {
    const { valuePatterns } = FIELD_PATTERNS.division;

    it('should match division text', () => {
      expect(valuePatterns.some(p => p.test('Division A'))).toBe(true);
      expect(valuePatterns.some(p => p.test('division 3'))).toBe(true);
    });

    it('should match department abbreviations', () => {
      expect(valuePatterns.some(p => p.test('Dept. 5'))).toBe(true);
      expect(valuePatterns.some(p => p.test('Dept A'))).toBe(true);
    });

    it('should match single/double letter codes', () => {
      expect(valuePatterns.some(p => p.test('A'))).toBe(true);
      expect(valuePatterns.some(p => p.test('CR'))).toBe(true);
    });

    it('should have relevant labels', () => {
      const labels = FIELD_PATTERNS.division.labels;
      expect(labels).toContain('division');
      expect(labels).toContain('department');
    });
  });

  describe('Category grouping', () => {
    it('should group case_identification fields', () => {
      expect(FIELD_PATTERNS.docketNumber.category).toBe('case_identification');
      expect(FIELD_PATTERNS.caseTitle.category).toBe('case_identification');
      expect(FIELD_PATTERNS.caseType.category).toBe('case_identification');
      expect(FIELD_PATTERNS.status.category).toBe('case_identification');
    });

    it('should group court_details fields', () => {
      expect(FIELD_PATTERNS.judgeName.category).toBe('court_details');
      expect(FIELD_PATTERNS.courtName.category).toBe('court_details');
      expect(FIELD_PATTERNS.division.category).toBe('court_details');
    });

    it('should group parties fields', () => {
      expect(FIELD_PATTERNS.defendantName.category).toBe('parties');
      expect(FIELD_PATTERNS.plaintiffName.category).toBe('parties');
      expect(FIELD_PATTERNS.attorneyName.category).toBe('parties');
    });

    it('should group dates fields', () => {
      expect(FIELD_PATTERNS.filingDate.category).toBe('dates');
    });

    it('should group charges fields', () => {
      expect(FIELD_PATTERNS.charge.category).toBe('charges');
    });

    it('should group bond fields', () => {
      expect(FIELD_PATTERNS.bondAmount.category).toBe('bond');
    });
  });

  describe('Confidence weights', () => {
    it('should have weights between 0 and 1', () => {
      Object.keys(FIELD_PATTERNS).forEach(fieldName => {
        const weights = FIELD_PATTERNS[fieldName].weights;
        Object.keys(weights).forEach(weightKey => {
          const weight = weights[weightKey];
          expect(weight).toBeGreaterThanOrEqual(0);
          expect(weight).toBeLessThanOrEqual(1);
        });
      });
    });

    it('should have higher exactLabelMatch than partialLabelMatch', () => {
      Object.keys(FIELD_PATTERNS).forEach(fieldName => {
        const weights = FIELD_PATTERNS[fieldName].weights;
        expect(weights.exactLabelMatch).toBeGreaterThan(weights.partialLabelMatch);
      });
    });
  });
});
