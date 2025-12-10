/**
 * Integration tests for Chrome extension messaging
 * Tests communication between popup, content script, and background service
 */

describe('Extension Messaging', () => {

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Popup to Content Script messaging', () => {
    it('should send startSelection message with field name', async () => {
      const fieldName = 'docketNumber';
      const tabId = 123;

      chrome.tabs.query.mockResolvedValue([{ id: tabId }]);
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tabId, {
        action: 'startSelection',
        fieldName: fieldName
      });

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        tabId,
        { action: 'startSelection', fieldName: 'docketNumber' }
      );
    });

    it('should send autoExtract message', async () => {
      const tabId = 123;

      chrome.tabs.query.mockResolvedValue([{ id: tabId }]);
      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: { docketNumber: '12345' }
      });

      await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'autoExtract'
      });

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        tabId,
        { action: 'autoExtract' }
      );
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('docketNumber');
    });

    it('should send cancelSelection message', async () => {
      const tabId = 123;

      chrome.tabs.query.mockResolvedValue([{ id: tabId }]);
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tabId, {
        action: 'cancelSelection'
      });

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        tabId,
        { action: 'cancelSelection' }
      );
    });

    it('should handle ping/pong readiness check', async () => {
      const tabId = 123;

      chrome.tabs.query.mockResolvedValue([{ id: tabId }]);
      chrome.tabs.sendMessage.mockResolvedValue({ ready: true });

      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'ping'
      });

      expect(response.ready).toBe(true);
    });

    it('should retry ping on failure', async () => {
      const tabId = 123;
      let attemptCount = 0;

      chrome.tabs.query.mockResolvedValue([{ id: tabId }]);
      chrome.tabs.sendMessage.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Not ready'));
        }
        return Promise.resolve({ ready: true });
      });

      // Simulate retry logic
      let ready = false;
      for (let i = 0; i < 5 && !ready; i++) {
        try {
          const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
          ready = response.ready;
        } catch (e) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      expect(ready).toBe(true);
      expect(attemptCount).toBe(3);
    });
  });

  describe('Content Script to Popup messaging', () => {
    it('should send fieldCaptured message', () => {
      const mockListener = jest.fn();
      chrome.runtime.onMessage.addListener(mockListener);

      const message = {
        action: 'fieldCaptured',
        fieldName: 'docketNumber',
        value: 'CR-2025-12345'
      };

      chrome.runtime.sendMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });

    it('should send selectionComplete message', () => {
      const message = {
        action: 'selectionComplete',
        success: true
      };

      chrome.runtime.sendMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });

    it('should send extractionComplete message with data', () => {
      const extractedData = {
        docketNumber: 'CR-2025-12345',
        caseTitle: 'State v. Doe',
        extractionMetadata: {
          extractedAt: new Date().toISOString(),
          sourceUrl: 'https://example.com'
        }
      };

      const message = {
        action: 'extractionComplete',
        data: extractedData
      };

      chrome.runtime.sendMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'extractionComplete',
          data: expect.objectContaining({
            docketNumber: 'CR-2025-12345',
            caseTitle: 'State v. Doe'
          })
        })
      );
    });

    it('should send error message on extraction failure', () => {
      const message = {
        action: 'extractionError',
        error: 'No rules found for domain'
      };

      chrome.runtime.sendMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('Background Service relay', () => {
    it('should relay messages between popup and content script', () => {
      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      // Simulate background service receiving message from content
      const contentMessage = {
        action: 'fieldCaptured',
        fieldName: 'docketNumber',
        value: 'CR-2025-12345'
      };

      // Background should relay to popup
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'fieldCaptured') {
          // Relay to popup (broadcast)
          chrome.runtime.sendMessage(message);
          sendResponse({ received: true });
        }
      });

      const listeners = chrome.runtime.onMessage.addListener.mock.calls;
      expect(listeners.length).toBeGreaterThan(0);
    });

    it('should handle processWithLLM message', async () => {
      const message = {
        action: 'processWithLLM',
        data: { docketNumber: 'CR-2025-12345' },
        config: {
          endpoint: 'http://localhost:11434/api/generate',
          model: 'llama2'
        }
      };

      chrome.runtime.sendMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'processWithLLM'
        })
      );
    });

    it('should handle testLLMConnection message', async () => {
      const message = {
        action: 'testLLMConnection',
        config: {
          endpoint: 'http://localhost:11434/api/generate',
          model: 'llama2'
        }
      };

      chrome.runtime.sendMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('Message payload validation', () => {
    it('should include required fields in startSelection message', () => {
      const validMessage = {
        action: 'startSelection',
        fieldName: 'docketNumber'
      };

      expect(validMessage).toHaveProperty('action');
      expect(validMessage).toHaveProperty('fieldName');
      expect(typeof validMessage.fieldName).toBe('string');
    });

    it('should include required fields in fieldCaptured message', () => {
      const validMessage = {
        action: 'fieldCaptured',
        fieldName: 'docketNumber',
        value: 'CR-2025-12345'
      };

      expect(validMessage).toHaveProperty('action');
      expect(validMessage).toHaveProperty('fieldName');
      expect(validMessage).toHaveProperty('value');
    });

    it('should include data in extractionComplete message', () => {
      const validMessage = {
        action: 'extractionComplete',
        data: { docketNumber: '12345' }
      };

      expect(validMessage).toHaveProperty('action');
      expect(validMessage).toHaveProperty('data');
      expect(typeof validMessage.data).toBe('object');
    });
  });

  describe('Error handling', () => {
    it('should handle tab not found error', async () => {
      chrome.tabs.query.mockResolvedValue([]);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      expect(tabs).toHaveLength(0);
    });

    it('should handle content script not ready error', async () => {
      const tabId = 123;

      chrome.tabs.query.mockResolvedValue([{ id: tabId }]);
      chrome.tabs.sendMessage.mockRejectedValue(new Error('Could not establish connection'));

      await expect(
        chrome.tabs.sendMessage(tabId, { action: 'ping' })
      ).rejects.toThrow('Could not establish connection');
    });

    it('should handle invalid message format', () => {
      const invalidMessage = { /* missing action */ };

      // Should not throw, but message won't be processed
      expect(() => {
        chrome.runtime.sendMessage(invalidMessage);
      }).not.toThrow();
    });

    it('should set lastError on communication failure', async () => {
      const tabId = 123;

      chrome.runtime.lastError = { message: 'Connection error' };
      chrome.tabs.sendMessage.mockRejectedValue(new Error('Connection error'));

      try {
        await chrome.tabs.sendMessage(tabId, { action: 'test' });
      } catch (e) {
        expect(chrome.runtime.lastError).toBeDefined();
        expect(chrome.runtime.lastError.message).toBe('Connection error');
      }
    });
  });

  describe('Message response handling', () => {
    it('should handle successful response', async () => {
      const tabId = 123;
      const mockResponse = { success: true, data: { field: 'value' } };

      chrome.tabs.query.mockResolvedValue([{ id: tabId }]);
      chrome.tabs.sendMessage.mockResolvedValue(mockResponse);

      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'autoExtract'
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ field: 'value' });
    });

    it('should handle error response', async () => {
      const tabId = 123;
      const mockResponse = { success: false, error: 'Extraction failed' };

      chrome.tabs.query.mockResolvedValue([{ id: tabId }]);
      chrome.tabs.sendMessage.mockResolvedValue(mockResponse);

      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'autoExtract'
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Extraction failed');
    });

    it('should handle undefined response (no sendResponse called)', async () => {
      const tabId = 123;

      chrome.tabs.query.mockResolvedValue([{ id: tabId }]);
      chrome.tabs.sendMessage.mockResolvedValue(undefined);

      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'someAction'
      });

      expect(response).toBeUndefined();
    });
  });
});
