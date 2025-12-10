/**
 * Mock LLM responses for testing
 */

module.exports = {
  // Successful LLM response with enhanced data
  successResponse: {
    model: 'llama2',
    created_at: '2025-11-19T15:31:57.267Z',
    response: JSON.stringify({
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
        chargesAndStatutes: [
          {
            count: 1,
            statute: 'FS 893.13.6',
            description: 'Possession of Controlled Substance',
            degree: 'Felony 3rd Degree'
          }
        ],
        bondInformation: {
          bondType: 'Surety Bond',
          amount: 50000,
          status: 'Posted'
        },
        courtAndJudgeDetails: {
          courtName: 'Example County',
          judgeName: 'Hon. Jane Smith',
          division: 'Criminal Division 3'
        }
      }
    }),
    done: true
  },

  // Error response - CORS error
  corsError: {
    error: 'Failed to fetch',
    message: 'CORS policy blocked the request'
  },

  // Error response - Model not found
  modelNotFound: {
    error: 'model not found',
    message: 'The requested model does not exist'
  },

  // Error response - Connection refused
  connectionRefused: {
    error: 'Connection refused',
    message: 'Could not connect to Ollama server'
  },

  // Malformed JSON response
  malformedResponse: {
    model: 'llama2',
    response: 'This is not valid JSON {broken',
    done: true
  },

  // Empty response
  emptyResponse: {
    model: 'llama2',
    response: '{}',
    done: true
  },

  // Partial response (streaming)
  streamingResponses: [
    {
      model: 'llama2',
      response: '{"docket',
      done: false
    },
    {
      model: 'llama2',
      response: 'Number": "CR-2025-12345",',
      done: false
    },
    {
      model: 'llama2',
      response: '"caseTitle": "State v. Doe"}',
      done: true
    }
  ],

  // Complex enhanced response
  complexEnhancedResponse: {
    model: 'llama2',
    response: JSON.stringify({
      docketNumber: '50-2025-MM-008893-AXXX-MB',
      caseTitle: 'STATE OF FLORIDA vs. DOE, JOHN',
      caseType: 'Criminal - Misdemeanor',
      filingDate: '2025-01-15T05:00:00.000Z',
      status: 'PENDING',
      court: {
        courtName: 'Palm Beach County Criminal Division 3',
        judgeName: 'SMITH, JANE M.',
        division: 'Division 3'
      },
      caseInfo: {
        partyNamesAndRoles: [
          { name: 'STATE OF FLORIDA', role: 'Plaintiff' },
          { name: 'DOE, JOHN', role: 'Defendant' }
        ],
        dates: {
          filingDate: '2025-01-15T05:00:00.000Z',
          hearings: [
            { date: '2025-01-16T05:00:00.000Z', event: 'First Appearance' },
            { date: '2025-02-01T14:00:00.000Z', event: 'Arraignment' }
          ],
          deadlines: null
        },
        chargesAndStatutes: [
          {
            count: 1,
            statute: 'FS 893.13.6',
            description: 'Possession of Controlled Substance',
            degree: 'Felony 3rd Degree'
          },
          {
            count: 2,
            statute: 'FS 316.193',
            description: 'DUI - First Offense',
            degree: 'Misdemeanor'
          }
        ],
        bondInformation: {
          bondType: 'Surety Bond',
          amount: 50000,
          status: 'Posted',
          dateSet: '2025-01-16T05:00:00.000Z'
        },
        courtAndJudgeDetails: {
          courtName: 'Palm Beach County Criminal Division 3',
          judgeName: 'SMITH, JANE M.',
          division: 'Division 3'
        },
        parties: [
          {
            name: 'STATE OF FLORIDA',
            type: 'Plaintiff',
            attorney: {
              name: 'JONES, ROBERT',
              role: 'State Attorney'
            }
          },
          {
            name: 'DOE, JOHN',
            type: 'Defendant',
            attorney: {
              name: 'WILLIAMS, SARAH ESQ.',
              role: 'Public Defender'
            }
          }
        ]
      }
    }),
    done: true
  }
};
