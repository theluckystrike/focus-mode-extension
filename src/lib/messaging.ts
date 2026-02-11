/**
 * Focus Mode Pro - Message Passing Utilities
 * Handles communication between background, content, and popup scripts
 */

import type { Message, MessageAction, MessageResponse } from './types';

// ============================================================================
// Message Sending
// ============================================================================

/**
 * Send a message to the background script and wait for response
 */
export async function sendMessage<T = unknown, R = unknown>(
  action: MessageAction,
  payload?: T
): Promise<MessageResponse<R>> {
  try {
    const message: Message<T> = { action };
    if (payload !== undefined) {
      message.payload = payload;
    }
    const response = await chrome.runtime.sendMessage<Message<T>, MessageResponse<R>>(message);
    return response ?? { success: false, error: 'No response received' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle common errors gracefully
    if (errorMessage.includes('Extension context invalidated')) {
      return { success: false, error: 'Extension was updated. Please refresh the page.' };
    }
    if (errorMessage.includes('Could not establish connection')) {
      return { success: false, error: 'Extension not ready. Please try again.' };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Send a message to a specific tab's content script
 */
export async function sendMessageToTab<T = unknown, R = unknown>(
  tabId: number,
  action: MessageAction,
  payload?: T
): Promise<MessageResponse<R>> {
  try {
    const message: Message<T> = { action };
    if (payload !== undefined) {
      message.payload = payload;
    }
    const response = await chrome.tabs.sendMessage<Message<T>, MessageResponse<R>>(tabId, message);
    return response ?? { success: false, error: 'No response received' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Receiving end does not exist')) {
      return { success: false, error: 'Content script not loaded on this page' };
    }
    if (errorMessage.includes('Cannot access')) {
      return { success: false, error: 'Cannot access this page' };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Send a message to the currently active tab
 */
export async function sendMessageToActiveTab<T = unknown, R = unknown>(
  action: MessageAction,
  payload?: T
): Promise<MessageResponse<R>> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      return { success: false, error: 'No active tab found' };
    }

    return sendMessageToTab(tab.id, action, payload);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Broadcast a message to all tabs
 */
export async function broadcastMessage<T = unknown>(
  action: MessageAction,
  payload?: T
): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        // Don't wait for responses, just send
        sendMessageToTab(tab.id, action, payload).catch(() => {
          // Ignore errors for tabs that can't receive messages
        });
      }
    }
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}

// ============================================================================
// Message Listening
// ============================================================================

/**
 * Type-safe message handler function
 */
export type MessageHandler<T = unknown, R = unknown> = (
  payload: T,
  sender: chrome.runtime.MessageSender
) => Promise<R> | R;

/**
 * Map of message actions to their handlers
 */
export type MessageHandlers = Partial<Record<MessageAction | string, MessageHandler>>;

/**
 * Create a message listener with typed handlers
 */
export function createMessageListener(handlers: MessageHandlers): void {
  chrome.runtime.onMessage.addListener(
    (
      message: Message,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: MessageResponse) => void
    ) => {
      const handler = handlers[message.action];

      if (!handler) {
        return false;
      }

      Promise.resolve(handler(message.payload, sender))
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((error: Error) => {
          console.error(`Handler error for ${message.action}:`, error);
          sendResponse({ success: false, error: error.message });
        });

      return true;
    }
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the current active tab
 */
export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the current active tab ID
 */
export async function getActiveTabId(): Promise<number | null> {
  const tab = await getActiveTab();
  return tab?.id ?? null;
}

/**
 * Check if content script is loaded in a tab
 */
export async function isContentScriptLoaded(tabId: number): Promise<boolean> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
    return response?.success === true;
  } catch {
    return false;
  }
}

/**
 * Get all tabs
 */
export async function getAllTabs(): Promise<chrome.tabs.Tab[]> {
  try {
    return await chrome.tabs.query({});
  } catch {
    return [];
  }
}

// ============================================================================
// Export Messaging Object
// ============================================================================

export const messaging = {
  send: sendMessage,
  sendToTab: sendMessageToTab,
  sendToActiveTab: sendMessageToActiveTab,
  broadcast: broadcastMessage,
  createListener: createMessageListener,
  getActiveTab,
  getActiveTabId,
  isContentScriptLoaded,
  getAllTabs,
};

export default messaging;
