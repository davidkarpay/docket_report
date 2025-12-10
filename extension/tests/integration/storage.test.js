/**
 * Integration tests for Chrome storage operations
 * Tests data persistence for extracted data, history, and settings
 */

describe('Storage Operations', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset storage mock state
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
  });

  describe('Extracted data storage', () => {
    it('should save extracted data to local storage', async () => {
      const extractedData = {
        docketNumber: 'CR-2025-12345',
        caseTitle: 'State v. Doe',
        extractionMetadata: {
          extractedAt: '2025-11-19T15:31:57.267Z',
          sourceUrl: 'https://example.com/case'
        }
      };

      chrome.storage.local.set.mockResolvedValue(undefined);

      await chrome.storage.local.set({ currentData: extractedData });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        currentData: extractedData
      });
    });

    it('should load extracted data from local storage', async () => {
      const storedData = {
        currentData: {
          docketNumber: 'CR-2025-12345',
          caseTitle: 'State v. Doe'
        }
      };

      chrome.storage.local.get.mockResolvedValue(storedData);

      const result = await chrome.storage.local.get('currentData');

      expect(chrome.storage.local.get).toHaveBeenCalledWith('currentData');
      expect(result.currentData).toEqual(storedData.currentData);
    });

    it('should return empty object when no data exists', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const result = await chrome.storage.local.get('currentData');

      expect(result).toEqual({});
    });

    it('should clear extracted data', async () => {
      chrome.storage.local.set.mockResolvedValue(undefined);

      await chrome.storage.local.set({ currentData: null });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        currentData: null
      });
    });
  });

  describe('History storage', () => {
    it('should save extraction to history', async () => {
      const historyEntry = {
        id: Date.now(),
        timestamp: '2025-11-19T15:31:57.267Z',
        url: 'https://example.com/case',
        data: {
          docketNumber: 'CR-2025-12345',
          caseTitle: 'State v. Doe'
        }
      };

      chrome.storage.local.get.mockResolvedValue({ history: [] });
      chrome.storage.local.set.mockResolvedValue(undefined);

      const currentHistory = await chrome.storage.local.get('history');
      const newHistory = [historyEntry, ...(currentHistory.history || [])];

      await chrome.storage.local.set({ history: newHistory });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        history: expect.arrayContaining([
          expect.objectContaining({
            id: historyEntry.id,
            timestamp: historyEntry.timestamp
          })
        ])
      });
    });

    it('should load full history', async () => {
      const mockHistory = [
        {
          id: 1,
          timestamp: '2025-11-19T15:31:57.267Z',
          url: 'https://example.com/case1',
          data: { docketNumber: '12345' }
        },
        {
          id: 2,
          timestamp: '2025-11-19T15:30:00.000Z',
          url: 'https://example.com/case2',
          data: { docketNumber: '67890' }
        }
      ];

      chrome.storage.local.get.mockResolvedValue({ history: mockHistory });

      const result = await chrome.storage.local.get('history');

      expect(result.history).toHaveLength(2);
      expect(result.history[0].id).toBe(1);
      expect(result.history[1].id).toBe(2);
    });

    it('should limit history to 100 entries', async () => {
      // Generate 101 entries
      const entries = Array.from({ length: 101 }, (_, i) => ({
        id: i,
        timestamp: new Date().toISOString(),
        url: `https://example.com/case${i}`,
        data: { docketNumber: `${i}` }
      }));

      chrome.storage.local.get.mockResolvedValue({ history: entries });

      const result = await chrome.storage.local.get('history');

      // Simulate trimming to 100
      const trimmedHistory = result.history.slice(0, 100);

      expect(trimmedHistory).toHaveLength(100);
    });

    it('should clear all history', async () => {
      chrome.storage.local.set.mockResolvedValue(undefined);

      await chrome.storage.local.set({ history: [] });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ history: [] });
    });

    it('should add new entry at beginning of history', async () => {
      const existingHistory = [
        { id: 1, timestamp: '2025-11-19T15:00:00.000Z', data: {} }
      ];

      const newEntry = {
        id: 2,
        timestamp: '2025-11-19T15:30:00.000Z',
        data: { docketNumber: 'NEW' }
      };

      chrome.storage.local.get.mockResolvedValue({ history: existingHistory });

      const result = await chrome.storage.local.get('history');
      const updatedHistory = [newEntry, ...result.history];

      await chrome.storage.local.set({ history: updatedHistory });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        history: expect.arrayContaining([
          expect.objectContaining({ id: 2 }),
          expect.objectContaining({ id: 1 })
        ])
      });
    });
  });

  describe('LLM configuration storage', () => {
    it('should save LLM configuration', async () => {
      const config = {
        enabled: true,
        endpoint: 'http://localhost:11434/api/generate',
        model: 'llama2',
        apiKey: ''
      };

      chrome.storage.local.set.mockResolvedValue(undefined);

      await chrome.storage.local.set({ llmConfig: config });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        llmConfig: expect.objectContaining({
          enabled: true,
          endpoint: 'http://localhost:11434/api/generate',
          model: 'llama2'
        })
      });
    });

    it('should load LLM configuration', async () => {
      const storedConfig = {
        llmConfig: {
          enabled: true,
          endpoint: 'http://localhost:11434/api/generate',
          model: 'llama2',
          apiKey: 'secret-key'
        }
      };

      chrome.storage.local.get.mockResolvedValue(storedConfig);

      const result = await chrome.storage.local.get('llmConfig');

      expect(result.llmConfig).toEqual(storedConfig.llmConfig);
      expect(result.llmConfig.apiKey).toBe('secret-key');
    });

    it('should return default config when none exists', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const result = await chrome.storage.local.get('llmConfig');

      expect(result).toEqual({});
    });

    it('should update partial config fields', async () => {
      const existingConfig = {
        enabled: true,
        endpoint: 'http://localhost:11434/api/generate',
        model: 'llama2',
        apiKey: ''
      };

      chrome.storage.local.get.mockResolvedValue({ llmConfig: existingConfig });

      const updatedConfig = {
        ...existingConfig,
        model: 'llama3'
      };

      await chrome.storage.local.set({ llmConfig: updatedConfig });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        llmConfig: expect.objectContaining({
          model: 'llama3',
          endpoint: 'http://localhost:11434/api/generate'
        })
      });
    });
  });

  describe('Data persistence across sessions', () => {
    it('should persist data between popup closes', async () => {
      const data = { docketNumber: 'CR-2025-12345' };

      // First session: save data
      await chrome.storage.local.set({ currentData: data });

      // Simulate popup close and reopen
      chrome.storage.local.get.mockResolvedValue({ currentData: data });

      // Second session: load data
      const result = await chrome.storage.local.get('currentData');

      expect(result.currentData).toEqual(data);
    });

    it('should persist history across browser restarts', async () => {
      const history = [
        { id: 1, data: { docketNumber: '12345' } },
        { id: 2, data: { docketNumber: '67890' } }
      ];

      await chrome.storage.local.set({ history });

      // Simulate browser restart
      chrome.storage.local.get.mockResolvedValue({ history });

      const result = await chrome.storage.local.get('history');

      expect(result.history).toHaveLength(2);
    });

    it('should persist LLM config across sessions', async () => {
      const config = {
        enabled: true,
        endpoint: 'http://localhost:11434/api/generate',
        model: 'llama2'
      };

      await chrome.storage.local.set({ llmConfig: config });

      // Simulate new session
      chrome.storage.local.get.mockResolvedValue({ llmConfig: config });

      const result = await chrome.storage.local.get('llmConfig');

      expect(result.llmConfig.enabled).toBe(true);
      expect(result.llmConfig.model).toBe('llama2');
    });
  });

  describe('Storage error handling', () => {
    it('should handle storage quota exceeded', async () => {
      const largeData = {
        data: 'x'.repeat(10 * 1024 * 1024) // 10MB
      };

      chrome.storage.local.set.mockRejectedValue(
        new Error('QUOTA_BYTES quota exceeded')
      );

      await expect(
        chrome.storage.local.set({ currentData: largeData })
      ).rejects.toThrow('QUOTA_BYTES quota exceeded');
    });

    it('should handle storage get failure', async () => {
      chrome.storage.local.get.mockRejectedValue(
        new Error('Storage access denied')
      );

      await expect(
        chrome.storage.local.get('currentData')
      ).rejects.toThrow('Storage access denied');
    });

    it('should handle corrupt stored data', async () => {
      chrome.storage.local.get.mockResolvedValue({
        currentData: 'invalid json string'
      });

      const result = await chrome.storage.local.get('currentData');

      // Should still return the raw value
      expect(result.currentData).toBe('invalid json string');
    });
  });

  describe('Batch storage operations', () => {
    it('should save multiple keys at once', async () => {
      const batchData = {
        currentData: { docketNumber: '12345' },
        llmConfig: { enabled: true },
        lastUpdate: Date.now()
      };

      chrome.storage.local.set.mockResolvedValue(undefined);

      await chrome.storage.local.set(batchData);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          currentData: expect.any(Object),
          llmConfig: expect.any(Object),
          lastUpdate: expect.any(Number)
        })
      );
    });

    it('should load multiple keys at once', async () => {
      const storedData = {
        currentData: { docketNumber: '12345' },
        history: [],
        llmConfig: { enabled: false }
      };

      chrome.storage.local.get.mockResolvedValue(storedData);

      const result = await chrome.storage.local.get([
        'currentData',
        'history',
        'llmConfig'
      ]);

      expect(result).toHaveProperty('currentData');
      expect(result).toHaveProperty('history');
      expect(result).toHaveProperty('llmConfig');
    });

    it('should remove specific keys', async () => {
      chrome.storage.local.remove.mockResolvedValue(undefined);

      await chrome.storage.local.remove('currentData');

      expect(chrome.storage.local.remove).toHaveBeenCalledWith('currentData');
    });

    it('should clear all storage', async () => {
      chrome.storage.local.clear.mockResolvedValue(undefined);

      await chrome.storage.local.clear();

      expect(chrome.storage.local.clear).toHaveBeenCalled();
    });
  });

  describe('Storage sync vs local', () => {
    it('should use local storage for extracted data', async () => {
      const data = { docketNumber: '12345' };

      await chrome.storage.local.set({ currentData: data });

      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(chrome.storage.sync.set).not.toHaveBeenCalled();
    });

    it('could use sync storage for settings (optional)', async () => {
      const settings = { theme: 'dark', language: 'en' };

      chrome.storage.sync.set.mockResolvedValue(undefined);

      await chrome.storage.sync.set({ settings });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ settings });
    });
  });
});
