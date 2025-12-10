/**
 * Sample extracted data for testing
 */

module.exports = {
  // Simple extraction (before LLM processing)
  simpleExtraction: {
    docketNumber: 'CR-2025-12345',
    caseTitle: 'State of Example v. John Doe',
    caseType: 'Criminal - Felony',
    filingDate: '01/15/2025',
    status: 'Active',
    'court.courtName': '15th Judicial Circuit Court',
    'court.judgeName': 'Hon. Jane Smith',
    extractionMetadata: {
      extractedAt: '2025-11-19T15:31:57.267Z',
      sourceUrl: 'file:///C:/Showcase_Scraper/test-page.html',
      extractorVersion: '1.0.0'
    }
  },

  // After LLM processing (with llmProcessed flag)
  llmProcessedExtraction: {
    docketNumber: 'CR-2025-12345',
    caseTitle: 'State of Example v. John Doe',
    caseType: 'Criminal - Felony',
    filingDate: '2025-01-15T05:00:00.000Z',
    status: 'Active',
    court: {
      courtName: 'Example County',
      judgeName: 'Hon. Jane Smith',
      division: 'Criminal Division 3'
    },
    caseInfo: {
      partyNamesAndRoles: [
        { name: 'State of Example', role: 'Plaintiff' },
        { name: 'John Doe', role: 'Defendant' }
      ],
      dates: {
        filingDate: '2025-01-15T05:00:00.000Z',
        hearings: null,
        deadlines: null
      },
      chargesAndStatutes: [],
      bondInformation: null,
      courtAndJudgeDetails: {
        courtName: 'Example County',
        judgeName: 'Hon. Jane Smith',
        division: 'Criminal Division 3'
      }
    },
    extractionMetadata: {
      extractedAt: '2025-11-19T15:31:57.267Z',
      sourceUrl: 'file:///C:/Showcase_Scraper/test-page.html',
      extractorVersion: '1.0.0',
      llmProcessed: true
    }
  },

  // Complex extraction with all fields
  complexExtraction: {
    docketNumber: '50-2025-MM-008893-AXXX-MB',
    caseTitle: 'STATE OF FLORIDA vs. DOE, JOHN',
    caseType: 'Criminal - Misdemeanor',
    filingDate: 'January 15, 2025',
    status: 'PENDING',
    'court.courtName': 'Palm Beach County Criminal Division 3',
    'court.judgeName': 'SMITH, JANE M.',
    defendantName: 'DOE, JOHN',
    plaintiffName: 'STATE OF FLORIDA',
    charge: 'FS 893.13.6',
    bondAmount: '$50,000.00',
    extractionMetadata: {
      extractedAt: '2025-11-19T15:31:57.267Z',
      sourceUrl: 'https://jiswebprod.mypalmbeachclerk.com/case/12345',
      extractorVersion: '1.0.0'
    }
  },

  // Extraction with nested objects already structured
  nestedExtraction: {
    docketNumber: 'CR-2025-12345',
    caseTitle: 'State v. Doe',
    court: {
      courtName: 'District Court',
      judgeName: 'Hon. Smith',
      division: 'Criminal'
    },
    parties: [
      {
        name: 'State of Florida',
        type: 'Plaintiff',
        attorney: { name: 'Jones, Robert', role: 'Prosecutor' }
      },
      {
        name: 'Doe, John',
        type: 'Defendant',
        attorney: { name: 'Williams, Sarah', role: 'Public Defender' }
      }
    ],
    extractionMetadata: {
      extractedAt: '2025-11-19T15:31:57.267Z',
      sourceUrl: 'https://example.com/case',
      extractorVersion: '1.0.0'
    }
  },

  // Minimal extraction (only required fields)
  minimalExtraction: {
    docketNumber: 'CR-2025-12345',
    caseTitle: 'State v. Doe',
    extractionMetadata: {
      extractedAt: '2025-11-19T15:31:57.267Z',
      sourceUrl: 'https://example.com/case',
      extractorVersion: '1.0.0'
    }
  },

  // Extraction with special characters
  specialCharsExtraction: {
    docketNumber: 'CR-2025-12345',
    caseTitle: 'State v. O\'Brien "The Case"',
    defendant: 'José García-López',
    charge: 'Section §123.45(a)(2)',
    bondAmount: '$1,234,567.89',
    notes: 'Contains quotes "here", commas, and unicode: café',
    extractionMetadata: {
      extractedAt: '2025-11-19T15:31:57.267Z',
      sourceUrl: 'https://example.com/case',
      extractorVersion: '1.0.0'
    }
  },

  // Empty/null value extraction
  emptyValuesExtraction: {
    docketNumber: 'CR-2025-12345',
    caseTitle: 'State v. Doe',
    status: '',
    bondAmount: null,
    notes: undefined,
    count: 0,
    dismissed: false,
    extractionMetadata: {
      extractedAt: '2025-11-19T15:31:57.267Z',
      sourceUrl: 'https://example.com/case',
      extractorVersion: '1.0.0'
    }
  },

  // History entries
  historyEntries: [
    {
      id: 1732032717267,
      timestamp: '2025-11-19T15:31:57.267Z',
      url: 'https://example.com/case/1',
      data: {
        docketNumber: 'CR-2025-12345',
        caseTitle: 'State v. Doe',
        extractionMetadata: {
          extractedAt: '2025-11-19T15:31:57.267Z',
          sourceUrl: 'https://example.com/case/1',
          extractorVersion: '1.0.0'
        }
      }
    },
    {
      id: 1732032700000,
      timestamp: '2025-11-19T15:31:40.000Z',
      url: 'https://example.com/case/2',
      data: {
        docketNumber: 'CR-2025-67890',
        caseTitle: 'State v. Smith',
        extractionMetadata: {
          extractedAt: '2025-11-19T15:31:40.000Z',
          sourceUrl: 'https://example.com/case/2',
          extractorVersion: '1.0.0'
        }
      }
    },
    {
      id: 1732032680000,
      timestamp: '2025-11-19T15:31:20.000Z',
      url: 'file:///C:/test/local-case.html',
      data: {
        docketNumber: 'CR-2025-11111',
        caseTitle: 'State v. Jones',
        extractionMetadata: {
          extractedAt: '2025-11-19T15:31:20.000Z',
          sourceUrl: 'file:///C:/test/local-case.html',
          extractorVersion: '1.0.0'
        }
      }
    }
  ]
};
