/**
 * Data validation utilities
 */

class DataValidator {
  /**
   * Validate extracted data against schema
   */
  static validate(data, schema) {
    const errors = [];

    // Check required fields
    if (schema.required) {
      schema.required.forEach(field => {
        if (!this.hasField(data, field)) {
          errors.push(`Missing required field: ${field}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Check if data has a field (supports nested paths)
   */
  static hasField(data, path) {
    const parts = path.split('.');
    let current = data;

    for (const part of parts) {
      if (!current || !current.hasOwnProperty(part)) {
        return false;
      }
      current = current[part];
    }

    return current !== null && current !== undefined && current !== '';
  }

  /**
   * Validate date format
   */
  static isValidDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return false;
    }

    // Additional validation: check if parsed date matches input
    // This catches invalid dates like "2025-02-30" that JS auto-corrects
    const isoString = date.toISOString().split('T')[0];

    // Extract date part from input (handle both 'T' and space separators)
    const inputNormalized = dateString.split(/[T\s]/)[0];

    // If input is in YYYY-MM-DD format, verify it matches the parsed date
    if (/^\d{4}-\d{2}-\d{2}/.test(inputNormalized)) {
      return isoString === inputNormalized;
    }

    return true;
  }

  /**
   * Validate email
   */
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validate phone number
   */
  static isValidPhone(phone) {
    const regex = /^[\d\s\-\(\)\.]+$/;
    return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Sanitize text
   */
  static sanitize(text) {
    if (typeof text !== 'string') return text;

    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ');
  }

  /**
   * Parse currency amount
   */
  static parseCurrency(text) {
    if (typeof text !== 'string') return null;

    const match = text.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return null;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataValidator;
}
