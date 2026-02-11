/**
 * Tests for messaging utilities
 */

import {
  sendMessage,
  sendMessageToTab,
  sendMessageToActiveTab,
  createMessageListener,
  getActiveTab,
  getActiveTabId,
  isContentScriptLoaded,
} from '../messaging';

describe('sendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send message to background and return response', async () => {
    const mockResponse = { success: true, data: { test: 'value' } };
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

    const result = await sendMessage('GET_SETTINGS');

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'GET_SETTINGS' });
    expect(result).toEqual(mockResponse);
  });

  it('should include payload when provided', async () => {
    const mockResponse = { success: true };
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

    await sendMessage('UPDATE_SETTINGS', { theme: 'dark' });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'UPDATE_SETTINGS',
      payload: { theme: 'dark' },
    });
  });

  it('should handle no response', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(null);

    const result = await sendMessage('PING');

    expect(result).toEqual({ success: false, error: 'No response received' });
  });

  it('should handle extension context invalidated error', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue(
      new Error('Extension context invalidated')
    );

    const result = await sendMessage('PING');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Extension was updated');
  });

  it('should handle connection error', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue(
      new Error('Could not establish connection')
    );

    const result = await sendMessage('PING');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Extension not ready');
  });
});

describe('sendMessageToTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send message to specific tab', async () => {
    const mockResponse = { success: true };
    (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

    const result = await sendMessageToTab(123, 'PING');

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, { action: 'PING' });
    expect(result).toEqual(mockResponse);
  });

  it('should handle receiving end not existing', async () => {
    (chrome.tabs.sendMessage as jest.Mock).mockRejectedValue(
      new Error('Receiving end does not exist')
    );

    const result = await sendMessageToTab(123, 'PING');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Content script not loaded');
  });
});

describe('sendMessageToActiveTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send message to active tab', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 456 }]);
    (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });

    const result = await sendMessageToActiveTab('PING');

    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(456, { action: 'PING' });
    expect(result.success).toBe(true);
  });

  it('should handle no active tab', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([]);

    const result = await sendMessageToActiveTab('PING');

    expect(result.success).toBe(false);
    expect(result.error).toContain('No active tab');
  });
});

describe('createMessageListener', () => {
  it('should set up message listener', () => {
    const handlers = {
      GET_SETTINGS: jest.fn().mockResolvedValue({ theme: 'dark' }),
    };

    createMessageListener(handlers);

    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });
});

describe('getActiveTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return active tab', async () => {
    const mockTab = { id: 123, url: 'https://example.com' };
    (chrome.tabs.query as jest.Mock).mockResolvedValue([mockTab]);

    const result = await getActiveTab();

    expect(result).toEqual(mockTab);
  });

  it('should return null when no tabs', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([]);

    const result = await getActiveTab();

    expect(result).toBeNull();
  });

  it('should handle errors', async () => {
    (chrome.tabs.query as jest.Mock).mockRejectedValue(new Error('Query failed'));

    const result = await getActiveTab();

    expect(result).toBeNull();
  });
});

describe('getActiveTabId', () => {
  it('should return active tab id', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 789 }]);

    const result = await getActiveTabId();

    expect(result).toBe(789);
  });

  it('should return null when no active tab', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([]);

    const result = await getActiveTabId();

    expect(result).toBeNull();
  });
});

describe('isContentScriptLoaded', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when content script responds', async () => {
    (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });

    const result = await isContentScriptLoaded(123);

    expect(result).toBe(true);
  });

  it('should return false when content script does not respond', async () => {
    (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: false });

    const result = await isContentScriptLoaded(123);

    expect(result).toBe(false);
  });

  it('should return false on error', async () => {
    (chrome.tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('No response'));

    const result = await isContentScriptLoaded(123);

    expect(result).toBe(false);
  });
});
