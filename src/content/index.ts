/**
 * Focus Mode Pro - Content Script
 * Handles page-level blocking and overlay display
 */

import type { Message, MessageResponse, TimerState, UrlCheckResult } from '../lib/types';

// ============================================================================
// State
// ============================================================================

let overlayElement: HTMLDivElement | null = null;
let isBlocked = false;

// ============================================================================
// Message Handler
// ============================================================================

chrome.runtime.onMessage.addListener(
  (
    message: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error: Error) => {
        console.error('Content script error:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to keep the message channel open
    return true;
  }
);

/**
 * Handle incoming messages
 */
async function handleMessage(message: Message): Promise<MessageResponse> {
  const { action } = message;

  switch (action) {
    case 'PING':
      return { success: true, data: 'pong' };

    case 'GET_FOCUS_STATE':
      // Recheck if current URL should be blocked
      await checkCurrentPage();
      return { success: true };

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

// ============================================================================
// Page Blocking
// ============================================================================

/**
 * Check if current page should be blocked
 */
async function checkCurrentPage(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage<Message, MessageResponse<UrlCheckResult>>({
      action: 'CHECK_URL',
      payload: { url: window.location.href },
    });

    if (response.success && response.data?.blocked) {
      showBlockedOverlay();
    } else {
      hideBlockedOverlay();
    }
  } catch (error) {
    // Extension might not be ready yet
    console.debug('Could not check URL:', error);
  }
}

/**
 * Show blocked page overlay
 */
function showBlockedOverlay(): void {
  if (overlayElement) return;
  isBlocked = true;

  // Redirect to blocked page instead of overlay
  const blockedUrl = chrome.runtime.getURL('blocked.html');
  const params = new URLSearchParams({
    url: encodeURIComponent(window.location.href),
    reason: 'content_script',
  });

  window.location.href = `${blockedUrl}?${params.toString()}`;
}

/**
 * Hide blocked overlay
 */
function hideBlockedOverlay(): void {
  if (!overlayElement) return;

  overlayElement.remove();
  overlayElement = null;
  isBlocked = false;
}

// ============================================================================
// Initialization
// ============================================================================

// Check page on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkCurrentPage);
} else {
  checkCurrentPage();
}

// Log when content script loads
console.debug('Focus Mode Pro content script loaded');

