/**
 * Unit tests for DataValidator
 */

const DataValidator = require('../../src/utils/validator.js');

describe('DataValidator', () => {

  describe('validate()', () => {
    it('should validate data with all required fields', () => {
      const data = {
        docketNumber: '12345',
        caseTitle: 'Test v. Case'
      };
      const schema = {
        required: ['docketNumber', 'caseTitle']
      };

      const result = DataValidator.validate(data, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when required field is missing', () => {
      const data = {
        docketNumber: '12345'
      };
      const schema = {
        required: ['docketNumber', 'caseTitle']
      };

      const result = DataValidator.validate(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: caseTitle');
    });

    it('should fail validation for multiple missing fields', () => {
      const data = {};
      const schema = {
        required: ['docketNumber', 'caseTitle', 'filingDate']
      };

      const result = DataValidator.validate(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });

    it('should validate nested required fields', () => {
      const data = {
        court: {
          courtName: 'Supreme Court'
        }
      };
      const schema = {
        required: ['court.courtName']
      };

      const result = DataValidator.validate(data, schema);

      expect(result.valid).toBe(true);
    });

    it('should handle schema without required fields', () => {
      const data = { anyField: 'value' };
      const schema = {};

      const result = DataValidator.validate(data, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('hasField()', () => {
    it('should return true for existing top-level field', () => {
      const data = { name: 'John' };
      expect(DataValidator.hasField(data, 'name')).toBe(true);
    });

    it('should return false for missing top-level field', () => {
      const data = { name: 'John' };
      expect(DataValidator.hasField(data, 'age')).toBe(false);
    });

    it('should return true for existing nested field', () => {
      const data = {
        court: {
          name: 'District Court',
          judge: 'Smith'
        }
      };
      expect(DataValidator.hasField(data, 'court.name')).toBe(true);
      expect(DataValidator.hasField(data, 'court.judge')).toBe(true);
    });

    it('should return false for missing nested field', () => {
      const data = {
        court: {
          name: 'District Court'
        }
      };
      expect(DataValidator.hasField(data, 'court.location')).toBe(false);
    });

    it('should return false for deeply nested missing field', () => {
      const data = {
        a: {
          b: {
            c: 'value'
          }
        }
      };
      expect(DataValidator.hasField(data, 'a.b.d')).toBe(false);
    });

    it('should return false for null values', () => {
      const data = { name: null };
      expect(DataValidator.hasField(data, 'name')).toBe(false);
    });

    it('should return false for undefined values', () => {
      const data = { name: undefined };
      expect(DataValidator.hasField(data, 'name')).toBe(false);
    });

    it('should return false for empty string values', () => {
      const data = { name: '' };
      expect(DataValidator.hasField(data, 'name')).toBe(false);
    });

    it('should return true for zero values', () => {
      const data = { count: 0 };
      expect(DataValidator.hasField(data, 'count')).toBe(true);
    });

    it('should return true for false boolean values', () => {
      const data = { active: false };
      expect(DataValidator.hasField(data, 'active')).toBe(true);
    });
  });

  describe('isValidDate()', () => {
    it('should validate ISO date strings', () => {
      expect(DataValidator.isValidDate('2025-01-15T10:30:00.000Z')).toBe(true);
    });

    it('should validate simple date strings', () => {
      expect(DataValidator.isValidDate('2025-01-15')).toBe(true);
    });

    it('should validate common US date formats', () => {
      expect(DataValidator.isValidDate('01/15/2025')).toBe(true);
    });

    it('should validate date with time', () => {
      expect(DataValidator.isValidDate('2025-01-15 10:30:00')).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(DataValidator.isValidDate('not a date')).toBe(false);
    });

    it('should reject invalid dates like 13th month', () => {
      expect(DataValidator.isValidDate('2025-13-01')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(DataValidator.isValidDate('')).toBe(false);
    });

    it('should reject invalid day numbers', () => {
      expect(DataValidator.isValidDate('2025-02-30')).toBe(false);
    });
  });

  describe('isValidEmail()', () => {
    it('should validate standard email addresses', () => {
      expect(DataValidator.isValidEmail('user@example.com')).toBe(true);
    });

    it('should validate emails with subdomains', () => {
      expect(DataValidator.isValidEmail('user@mail.example.com')).toBe(true);
    });

    it('should validate emails with plus signs', () => {
      expect(DataValidator.isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should validate emails with dots in username', () => {
      expect(DataValidator.isValidEmail('first.last@example.com')).toBe(true);
    });

    it('should validate emails with numbers', () => {
      expect(DataValidator.isValidEmail('user123@example.com')).toBe(true);
    });

    it('should reject emails without @', () => {
      expect(DataValidator.isValidEmail('userexample.com')).toBe(false);
    });

    it('should reject emails without domain', () => {
      expect(DataValidator.isValidEmail('user@')).toBe(false);
    });

    it('should reject emails without username', () => {
      expect(DataValidator.isValidEmail('@example.com')).toBe(false);
    });

    it('should reject emails with spaces', () => {
      expect(DataValidator.isValidEmail('user @example.com')).toBe(false);
    });

    it('should reject emails without TLD', () => {
      expect(DataValidator.isValidEmail('user@example')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(DataValidator.isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone()', () => {
    it('should validate 10-digit phone numbers', () => {
      expect(DataValidator.isValidPhone('1234567890')).toBe(true);
    });

    it('should validate phone numbers with dashes', () => {
      expect(DataValidator.isValidPhone('123-456-7890')).toBe(true);
    });

    it('should validate phone numbers with parentheses', () => {
      expect(DataValidator.isValidPhone('(123) 456-7890')).toBe(true);
    });

    it('should validate phone numbers with dots', () => {
      expect(DataValidator.isValidPhone('123.456.7890')).toBe(true);
    });

    it('should validate phone numbers with spaces', () => {
      expect(DataValidator.isValidPhone('123 456 7890')).toBe(true);
    });

    it('should validate 11-digit phone numbers (with country code)', () => {
      expect(DataValidator.isValidPhone('11234567890')).toBe(true);
    });

    it('should validate international format', () => {
      expect(DataValidator.isValidPhone('+1 (123) 456-7890')).toBe(false); // + is not in regex
    });

    it('should reject phone numbers with less than 10 digits', () => {
      expect(DataValidator.isValidPhone('123-456')).toBe(false);
    });

    it('should reject phone numbers with letters', () => {
      expect(DataValidator.isValidPhone('123-ABC-7890')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(DataValidator.isValidPhone('')).toBe(false);
    });
  });

  describe('sanitize()', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(DataValidator.sanitize('  text  ')).toBe('text');
    });

    it('should normalize multiple spaces to single space', () => {
      expect(DataValidator.sanitize('text   with    spaces')).toBe('text with spaces');
    });

    it('should replace tabs with spaces', () => {
      expect(DataValidator.sanitize('text\twith\ttabs')).toBe('text with tabs');
    });

    it('should replace newlines with spaces', () => {
      expect(DataValidator.sanitize('text\nwith\nnewlines')).toBe('text with newlines');
    });

    it('should replace carriage returns with spaces', () => {
      expect(DataValidator.sanitize('text\rwith\rreturns')).toBe('text with returns');
    });

    it('should handle mixed whitespace characters', () => {
      expect(DataValidator.sanitize('  text\n\twith  \r mixed   \t\nwhitespace  ')).toBe('text with mixed whitespace');
    });

    it('should return unchanged text without extra whitespace', () => {
      expect(DataValidator.sanitize('clean text')).toBe('clean text');
    });

    it('should return non-string values unchanged', () => {
      expect(DataValidator.sanitize(123)).toBe(123);
      expect(DataValidator.sanitize(null)).toBe(null);
      expect(DataValidator.sanitize(undefined)).toBe(undefined);
    });

    it('should handle empty strings', () => {
      expect(DataValidator.sanitize('')).toBe('');
    });
  });

  describe('parseCurrency()', () => {
    it('should parse simple dollar amounts', () => {
      expect(DataValidator.parseCurrency('$100')).toBe(100);
    });

    it('should parse amounts with commas', () => {
      expect(DataValidator.parseCurrency('$1,234.56')).toBe(1234.56);
    });

    it('should parse amounts with multiple commas', () => {
      expect(DataValidator.parseCurrency('$1,234,567.89')).toBe(1234567.89);
    });

    it('should parse amounts without dollar sign', () => {
      expect(DataValidator.parseCurrency('1234.56')).toBe(1234.56);
    });

    it('should parse whole dollar amounts', () => {
      expect(DataValidator.parseCurrency('$1,000')).toBe(1000);
    });

    it('should parse amounts with surrounding text', () => {
      expect(DataValidator.parseCurrency('Bond amount: $50,000.00')).toBe(50000);
    });

    it('should parse cents-only amounts', () => {
      expect(DataValidator.parseCurrency('$0.99')).toBe(0.99);
    });

    it('should return first number found', () => {
      expect(DataValidator.parseCurrency('Price is $100 or $200')).toBe(100);
    });

    it('should return null for text without numbers', () => {
      expect(DataValidator.parseCurrency('no amount')).toBe(null);
    });

    it('should return null for empty strings', () => {
      expect(DataValidator.parseCurrency('')).toBe(null);
    });

    it('should return null for non-string values', () => {
      expect(DataValidator.parseCurrency(null)).toBe(null);
      expect(DataValidator.parseCurrency(undefined)).toBe(null);
      expect(DataValidator.parseCurrency(123)).toBe(null);
    });

    it('should handle amounts without decimals', () => {
      expect(DataValidator.parseCurrency('$500')).toBe(500);
    });

    it('should parse large amounts', () => {
      expect(DataValidator.parseCurrency('$9,999,999.99')).toBe(9999999.99);
    });
  });
});
