/**
 * Focus Mode Pro - Content Script
 * Handles SPA route changes and focus state broadcasts.
 * Traditional navigation blocking is handled by the background service worker.
 */

interface Message {
  action: string;
  payload?: unknown;
}

interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UrlCheckResult {
  blocked: boolean;
  reason?: string;
  matchedRule?: string;
}

// Track URL for SPA change detection
let lastUrl = location.href;

/**
 * Check if the current URL is blocked and redirect if so
 */
async function checkAndRedirect(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'CHECK_URL',
      payload: { url: location.href },
    }) as MessageResponse<UrlCheckResult>;

    if (response?.success && response.data?.blocked) {
      const blockedUrl = chrome.runtime.getURL('blocked.html');
      const params = new URLSearchParams({
        url: encodeURIComponent(location.href),
        reason: response.data.reason ?? '',
        rule: response.data.matchedRule ?? '',
      });
      location.href = `${blockedUrl}?${params.toString()}`;
    }
  } catch {
    // Extension context may be invalidated, ignore
  }
}

// Listen for messages from the background (e.g., focus mode started)
chrome.runtime.onMessage.addListener(
  (message: Message, _sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
    if (message.action === 'GET_FOCUS_STATE') {
      checkAndRedirect()
        .then(() => sendResponse({ success: true }))
        .catch(() => sendResponse({ success: false }));
      return true; // async response
    }
    if (message.action === 'PING') {
      sendResponse({ success: true, data: 'pong' });
      return false;
    }
    return false;
  }
);

// Intercept History API for SPA route changes
const originalPushState = history.pushState.bind(history);
const originalReplaceState = history.replaceState.bind(history);

history.pushState = function (...args: Parameters<typeof history.pushState>) {
  originalPushState(...args);
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkAndRedirect();
  }
};

history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
  originalReplaceState(...args);
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkAndRedirect();
  }
};

// Handle back/forward navigation in SPAs
window.addEventListener('popstate', () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkAndRedirect();
  }
});
