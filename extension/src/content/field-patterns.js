/**
 * Field Pattern Library
 * Contains patterns for detecting common legal case fields
 */

const FIELD_PATTERNS = {
  docketNumber: {
    // Label variations
    labels: [
      'case number', 'case no', 'case #', 'case num',
      'docket number', 'docket no', 'docket #',
      'cause number', 'cause no',
      'file number', 'file no',
      'case id', 'cause id'
    ],

    // Value patterns (regex)
    valuePatterns: [
      /^\d{2}-\d{4}-[A-Z]{2}-\d{6}-[A-Z]{4}-[A-Z]{2}$/i,  // 50-2025-MM-008893-AXXX-MB (Palm Beach format)
      /^[A-Z]{2}-\d{4}-\d{5,6}$/i,                         // CR-2025-12345
      /^\d{4}-[A-Z]+-\d{5}$/i,                             // 2025-CF-12345
      /^\d{8}$/,                                            // 12345678
      /^[A-Z]\d{7}$/i,                                      // A1234567
      /^\d{2}[A-Z]{2}\d{5}$/i                               // 25CR12345
    ],

    // Confidence weights
    weights: {
      exactLabelMatch: 0.9,
      partialLabelMatch: 0.6,
      valuePatternMatch: 0.8,
      position: 0.7
    },

    category: 'case_identification'
  },

  caseTitle: {
    labels: [
      'case title', 'case name', 'case caption',
      'style', 'caption', 'title',
      'case style', 'parties', 'style of case'
    ],

    valuePatterns: [
      /.*\s+v\.?\s+.*/i,    // "State v. Doe" or "Smith v. Jones"
      /.*\s+vs\.?\s+.*/i    // "State vs. Doe"
    ],

    weights: {
      exactLabelMatch: 0.85,
      partialLabelMatch: 0.5,
      valuePatternMatch: 0.75,
      position: 0.6
    },

    category: 'case_identification'
  },

  judgeName: {
    labels: [
      'judge', 'assigned judge', 'presiding judge',
      'judicial officer', 'judge assigned', 'judge name',
      'honorable', 'hon.', 'magistrate', 'court officer'
    ],

    valuePatterns: [
      /^(Hon\.?\s+)?[A-Z][a-z]+(\s+[A-Z]\.?)?(\s+[A-Z][a-z]+)+$/,  // Hon. Jane Smith
      /^Judge\s+[A-Z][a-z]+/i,                                      // Judge Smith
      /^[A-Z][a-z]+,\s+[A-Z][a-z]+/,                                // Smith, Jane
      /^[A-Z\s\.]+$/                                                 // SMITH or J. SMITH
    ],

    weights: {
      exactLabelMatch: 0.85,
      partialLabelMatch: 0.65,
      valuePatternMatch: 0.7,
      position: 0.5
    },

    category: 'court_details'
  },

  filingDate: {
    labels: [
      'filing date', 'filed date', 'date filed',
      'file date', 'filed on', 'filed',
      'submission date', 'date of filing',
      'opened', 'date opened'
    ],

    valuePatterns: [
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,                    // 01/15/2025
      /^\d{4}-\d{2}-\d{2}$/,                            // 2025-01-15
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i,  // Jan 15, 2025
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i  // December 1, 2024
    ],

    weights: {
      exactLabelMatch: 0.9,
      partialLabelMatch: 0.7,
      valuePatternMatch: 0.85,
      position: 0.6
    },

    category: 'dates'
  },

  defendantName: {
    labels: [
      'defendant', 'defendant name', 'accused',
      'respondent', 'def name', 'def.', 'def'
    ],

    valuePatterns: [
      /^[A-Z][a-z]+,\s+[A-Z][a-z]+(\s+[A-Z]\.?)?$/,    // Last, First M.
      /^[A-Z][a-z]+\s+[A-Z][a-z]+$/,                    // First Last
      /^[A-Z]+,\s+[A-Z]+$/                              // LAST, FIRST
    ],

    weights: {
      exactLabelMatch: 0.85,
      partialLabelMatch: 0.65,
      valuePatternMatch: 0.6,
      position: 0.5
    },

    category: 'parties'
  },

  plaintiffName: {
    labels: [
      'plaintiff', 'plaintiff name', 'petitioner',
      'appellant', 'complainant', 'plf', 'plt'
    ],

    valuePatterns: [
      /^[A-Z][a-z]+,\s+[A-Z][a-z]+(\s+[A-Z]\.?)?$/,
      /^[A-Z][a-z]+\s+[A-Z][a-z]+$/,
      /^[A-Z]+,\s+[A-Z]+$/,
      /^(State|County|City)\s+of\s+[A-Z][a-z]+/i
    ],

    weights: {
      exactLabelMatch: 0.85,
      partialLabelMatch: 0.65,
      valuePatternMatch: 0.6,
      position: 0.5
    },

    category: 'parties'
  },

  courtName: {
    labels: [
      'court', 'court name', 'tribunal',
      'jurisdiction', 'venue', 'court location'
    ],

    valuePatterns: [
      /.*\s+(Circuit|District|Superior|County|Municipal)\s+Court.*/i,
      /Court\s+of\s+.*/i,
      /.*\s+Clerk.*/i
    ],

    weights: {
      exactLabelMatch: 0.8,
      partialLabelMatch: 0.6,
      valuePatternMatch: 0.75,
      position: 0.5
    },

    category: 'court_details'
  },

  charge: {
    labels: [
      'charge', 'charges', 'offense', 'offenses',
      'count', 'counts', 'violation', 'statute',
      'crime', 'criminal charge'
    ],

    valuePatterns: [
      /\d+\.\d+\.\d+/,         // Statute number like 893.13.6
      /[A-Z]{2,}\s+\d+/i,      // FS 316.193
      /\d+\([a-z]\)\(\d+\)/i   // 893(a)(1)
    ],

    weights: {
      exactLabelMatch: 0.85,
      partialLabelMatch: 0.65,
      valuePatternMatch: 0.7,
      position: 0.4
    },

    category: 'charges'
  },

  bondAmount: {
    labels: [
      'bond', 'bail', 'bond amount', 'bail amount',
      'bond set', 'bail set', 'bond/bail'
    ],

    valuePatterns: [
      /^\$[\d,]+(\.\d{2})?$/,  // $1,000.00
      /^\d+\.\d{2}$/,           // 1000.00
      /^[\d,]+$/                // 1,000
    ],

    weights: {
      exactLabelMatch: 0.9,
      partialLabelMatch: 0.7,
      valuePatternMatch: 0.85,
      position: 0.5
    },

    category: 'bond'
  },

  attorneyName: {
    labels: [
      'attorney', 'lawyer', 'counsel', 'atty',
      'attorney name', 'defense attorney', 'prosecutor',
      'atty name', 'attorney for', 'represented by'
    ],

    valuePatterns: [
      /^[A-Z][a-z]+,\s+[A-Z][a-z]+(\s+[A-Z]\.?)?(\s+Esq\.?)?$/,  // Last, First M. Esq.
      /^[A-Z][a-z]+\s+[A-Z][a-z]+(\s+Esq\.?)?$/                   // First Last Esq.
    ],

    weights: {
      exactLabelMatch: 0.85,
      partialLabelMatch: 0.65,
      valuePatternMatch: 0.65,
      position: 0.4
    },

    category: 'parties'
  },

  caseType: {
    labels: [
      'case type', 'type', 'case category',
      'category', 'classification', 'docket type'
    ],

    valuePatterns: [
      /(criminal|civil|family|probate|juvenile|traffic)/i
    ],

    weights: {
      exactLabelMatch: 0.85,
      partialLabelMatch: 0.6,
      valuePatternMatch: 0.8,
      position: 0.6
    },

    category: 'case_identification'
  },

  status: {
    labels: [
      'status', 'case status', 'disposition',
      'current status', 'state', 'case state'
    ],

    valuePatterns: [
      /(active|pending|closed|disposed|open|terminated|dismissed)/i
    ],

    weights: {
      exactLabelMatch: 0.85,
      partialLabelMatch: 0.65,
      valuePatternMatch: 0.75,
      position: 0.5
    },

    category: 'case_identification'
  },

  division: {
    labels: [
      'division', 'department', 'court division',
      'section', 'branch'
    ],

    valuePatterns: [
      /division\s+\w+/i,
      /dept\.?\s+\w+/i,
      /^[A-Z]{1,2}$/  // Division codes like "A", "CR", etc.
    ],

    weights: {
      exactLabelMatch: 0.8,
      partialLabelMatch: 0.6,
      valuePatternMatch: 0.7,
      position: 0.4
    },

    category: 'court_details'
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIELD_PATTERNS };
}
