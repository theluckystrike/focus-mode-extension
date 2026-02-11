/**
 * Jest setup file
 * Add global mocks and configuration here
 */

import '@testing-library/jest-dom';

// Mock chrome API
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path: string) => `chrome-extension://mock-id/${path}`),
    getManifest: jest.fn(() => ({
      version: '1.0.0',
      name: 'Focus Mode Pro',
    })),
    onInstalled: {
      addListener: jest.fn(),
    },
    openOptionsPage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
    onChanged: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
  notifications: {
    create: jest.fn(),
  },
  webNavigation: {
    onBeforeNavigate: {
      addListener: jest.fn(),
    },
    onCommitted: {
      addListener: jest.fn(),
    },
  },
  commands: {
    onCommand: {
      addListener: jest.fn(),
    },
  },
};

(global as unknown as { chrome: typeof mockChrome }).chrome = mockChrome;

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
