/**
 * Focus Mode Pro - Content Script
 * Handles SPA route changes and focus state broadcasts.
 * Traditional navigation blocking is handled by the background service worker.
 *
 * NOTE: Content scripts run in an isolated world. They cannot intercept
 * page-world calls to history.pushState/replaceState directly. Instead we
 * poll for URL changes, which reliably catches all SPA navigations
 * (pushState, replaceState, hashchange, popstate) regardless of framework.
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

// ============================================================================
// Safe Message Passing
// ============================================================================

/**
 * Safely send a message to the background script.
 * Guards against invalidated extension context and handles chrome.runtime.lastError.
 */
function safeSendMessage(message: unknown): Promise<unknown> {
  if (!chrome.runtime?.id) return Promise.resolve(null);
  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        console.warn('[Focus Mode Pro]', chrome.runtime.lastError.message);
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

// ============================================================================
// Blocking Logic
// ============================================================================

// Track URL for SPA change detection
let lastUrl = location.href;

/**
 * Check if the current URL is blocked and redirect if so.
 */
async function checkAndRedirect(): Promise<void> {
  const response = await safeSendMessage({
    action: 'CHECK_URL',
    payload: { url: location.href },
  }) as MessageResponse<UrlCheckResult> | null;

  if (response?.success && response.data?.blocked) {
    // Guard: chrome.runtime may have been invalidated between the check above
    // and now. getURL will throw if that happened.
    if (!chrome.runtime?.id) return;
    const blockedUrl = chrome.runtime.getURL('blocked.html');
    const params = new URLSearchParams({
      url: encodeURIComponent(location.href),
      reason: response.data.reason ?? '',
      rule: response.data.matchedRule ?? '',
    });
    location.href = `${blockedUrl}?${params.toString()}`;
  }
}

// ============================================================================
// Message Listener
// ============================================================================

// Listen for messages from the background (e.g., focus mode toggled)
chrome.runtime.onMessage.addListener(
  (message: Message, _sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
    if (message.action === 'GET_FOCUS_STATE') {
      checkAndRedirect()
        .then(() => sendResponse({ success: true }))
        .catch(() => sendResponse({ success: false }));
      return true; // keep message channel open for async response
    }
    if (message.action === 'PING') {
      sendResponse({ success: true, data: 'pong' });
      return false;
    }
    return false;
  }
);

// ============================================================================
// SPA Navigation Detection
// ============================================================================

/**
 * Detect SPA navigations by polling for URL changes.
 *
 * Content scripts run in an isolated world and cannot intercept page-world
 * History API calls (pushState/replaceState). Overriding history.pushState
 * in the content script only affects the content script's own calls, not
 * the page's. A polling approach reliably detects all URL changes regardless
 * of how they were triggered (pushState, replaceState, hashchange, popstate,
 * framework router, etc.).
 *
 * The interval is short enough (1 second) to catch navigations promptly
 * without meaningful performance cost.
 */
let urlPollTimer: ReturnType<typeof setInterval> | null = null;

function startUrlPolling(): void {
  if (urlPollTimer !== null) return;

  urlPollTimer = setInterval(() => {
    // Stop polling if the extension context has been invalidated
    if (!chrome.runtime?.id) {
      stopUrlPolling();
      return;
    }

    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      checkAndRedirect();
    }
  }, 1000);
}

function stopUrlPolling(): void {
  if (urlPollTimer !== null) {
    clearInterval(urlPollTimer);
    urlPollTimer = null;
  }
}

// Also listen to popstate for immediate back/forward detection
// (supplements polling so the user doesn't wait up to 1 second)
window.addEventListener('popstate', () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkAndRedirect();
  }
});

// Also listen to hashchange for immediate hash-based routing detection
window.addEventListener('hashchange', () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkAndRedirect();
  }
});

// ============================================================================
// Initialization
// ============================================================================

// Start polling for SPA URL changes
startUrlPolling();

// Perform an initial check on page load (run_at: document_start means the
// DOM isn't ready yet, but we only need the URL which is already available)
checkAndRedirect();
