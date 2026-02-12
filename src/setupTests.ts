/// <reference types="node" />
/**
 * Jest setup file
 * Add global mocks and configuration here
 */

import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for jsdom
if (typeof globalThis.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextEncoder: TE, TextDecoder: TD } = require('util');
  (globalThis as unknown as Record<string, unknown>).TextEncoder = TE;
  (globalThis as unknown as Record<string, unknown>).TextDecoder = TD;
}

// Polyfill crypto.subtle for jsdom
if (typeof globalThis.crypto?.subtle === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { webcrypto } = require('crypto');
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

// Load English i18n messages for test mocking
// eslint-disable-next-line @typescript-eslint/no-require-imports
const i18nMessages: Record<string, { message: string; placeholders?: Record<string, { content: string }> }> =
  require('../public/_locales/en/messages.json');

function mockGetMessage(key: string, substitutions?: string | string[]): string {
  const entry = i18nMessages[key];
  if (!entry) return '';
  let msg = entry.message;
  // Handle placeholder substitution ($1, $2, etc. mapped via placeholders object)
  if (substitutions && entry.placeholders) {
    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    for (const [, ph] of Object.entries(entry.placeholders)) {
      const idx = parseInt(ph.content.replace(/\$/g, ''), 10) - 1;
      if (idx >= 0 && idx < subs.length) {
        // Replace $PLACEHOLDER_NAME$ in the message with the substitution value
        const regex = new RegExp(`\\$[A-Z_]+\\$`);
        msg = msg.replace(regex, subs[idx] ?? '');
      }
    }
  }
  return msg;
}

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
  i18n: {
    getMessage: jest.fn(mockGetMessage),
    getUILanguage: jest.fn(() => 'en'),
  },
};

(globalThis as unknown as { chrome: typeof mockChrome }).chrome = mockChrome;

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
