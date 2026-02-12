/**
 * Focus Mode Pro - Payment & License Integration
 * Connects to Zovo unified payment system
 */

// =============================================================================
// Constants
// =============================================================================

const ZOVO_API_BASE = 'https://xggdjlurppfcytxqoozs.supabase.co/functions/v1';
const EXTENSION_ID = 'focus_mode_blocker';
const CACHE_DURATION_MS = 5 * 60 * 1000;           // 5 minutes in-memory
const STORAGE_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours storage
const OFFLINE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LICENSE_KEY_REGEX = /^ZOVO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const MAX_ANALYTICS_QUEUE_SIZE = 100;

// =============================================================================
// Types
// =============================================================================

export interface LicenseData {
  valid: boolean;
  tier: 'free' | 'pro' | 'lifetime' | 'team';
  email: string | null;
  features: string[];
  cachedAt: number;
  lastVerifiedAt: number | null;
  expiresAt: number | null;
}

export interface StoreLicenseResult {
  success: boolean;
  data?: LicenseData;
  error?: string;
}

interface AnalyticsEvent {
  event: string;
  data: Record<string, unknown>;
  extensionId: string;
  sessionId: string;
  timestamp: number;
  version: string;
}

// =============================================================================
// In-Memory Cache (Level 1)
// =============================================================================

let _memoryCache: LicenseData | null = null;
let _memoryCacheTimestamp = 0;

function getMemoryCache(): LicenseData | null {
  if (!_memoryCache) return null;
  if (Date.now() - _memoryCacheTimestamp > CACHE_DURATION_MS) {
    _memoryCache = null;
    _memoryCacheTimestamp = 0;
    return null;
  }
  return _memoryCache;
}

function setMemoryCache(data: LicenseData): void {
  _memoryCache = data;
  _memoryCacheTimestamp = Date.now();
}

// =============================================================================
// Utility Functions
// =============================================================================

export function isValidLicenseFormat(key: string): boolean {
  if (typeof key !== 'string') return false;
  return LICENSE_KEY_REGEX.test(key.trim().toUpperCase());
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function freeTierData(): LicenseData {
  return {
    valid: false,
    tier: 'free',
    email: null,
    features: [],
    cachedAt: Date.now(),
    lastVerifiedAt: null,
    expiresAt: null,
  };
}

// =============================================================================
// Fetch with Retry (Exponential Backoff)
// =============================================================================

const FETCH_TIMEOUT_MS = 15000; // 15 seconds per attempt

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.pow(2, i) * 1000;
        await delay(waitMs);
        continue;
      }

      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000);
    }
  }

  throw new Error('fetchWithRetry: all retries exhausted');
}

// =============================================================================
// Storage Cache (Level 2) - chrome.storage.local
// =============================================================================

async function getStorageCache(): Promise<LicenseData | null> {
  try {
    const result = await chrome.storage.local.get('zovoLicense');
    const cached = result.zovoLicense as LicenseData | undefined;

    if (!cached) return null;

    const now = Date.now();

    if (now - cached.cachedAt <= STORAGE_CACHE_DURATION_MS) {
      return cached;
    }

    if (
      cached.lastVerifiedAt &&
      now - cached.lastVerifiedAt <= OFFLINE_GRACE_PERIOD_MS
    ) {
      return cached;
    }

    return null;
  } catch (error) {
    console.warn('[Payments] Failed to read storage cache:', error);
    return null;
  }
}

async function setStorageCache(data: LicenseData): Promise<void> {
  try {
    const cacheEntry = {
      ...data,
      cachedAt: Date.now(),
    };
    await chrome.storage.local.set({ zovoLicense: cacheEntry });
  } catch (error) {
    console.warn('[Payments] Failed to write storage cache:', error);
  }
}

async function clearStorageCacheInternal(): Promise<void> {
  try {
    await chrome.storage.local.remove('zovoLicense');
  } catch (error) {
    console.warn('[Payments] Failed to clear storage cache:', error);
  }
}

// =============================================================================
// Core License Functions
// =============================================================================

export async function verifyLicense(licenseKey: string, forceRefresh = false): Promise<LicenseData> {
  if (!licenseKey || !isValidLicenseFormat(licenseKey)) {
    return freeTierData();
  }

  const normalizedKey = licenseKey.trim().toUpperCase();

  // Level 1: In-memory cache
  if (!forceRefresh) {
    const memCached = getMemoryCache();
    if (memCached && memCached.valid) {
      return memCached;
    }
  }

  // Level 2: Storage cache
  if (!forceRefresh) {
    const storageCached = await getStorageCache();
    if (storageCached && storageCached.valid) {
      setMemoryCache(storageCached);
      return storageCached;
    }
  }

  // Level 3: API call
  if (!isOnline()) {
    return await handleOfflineFallback();
  }

  try {
    const response = await fetchWithRetry(
      `${ZOVO_API_BASE}/verify-extension-license`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: normalizedKey,
          extensionId: EXTENSION_ID,
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      const licenseData: LicenseData = {
        valid: result.valid === true,
        tier: result.tier || 'free',
        email: result.email || null,
        features: Array.isArray(result.features) ? result.features : [],
        cachedAt: Date.now(),
        lastVerifiedAt: Date.now(),
        expiresAt: result.expiresAt || null,
      };

      setMemoryCache(licenseData);
      await setStorageCache(licenseData);
      return licenseData;
    }

    if (response.status === 401) {
      const freeData = freeTierData();
      setMemoryCache(freeData);
      await setStorageCache(freeData);
      return freeData;
    }

    if (response.status === 429 || response.status >= 500) {
      return await handleOfflineFallback();
    }

    return freeTierData();
  } catch {
    return await handleOfflineFallback();
  }
}

async function handleOfflineFallback(): Promise<LicenseData> {
  try {
    const result = await chrome.storage.local.get('zovoLicense');
    const cached = result.zovoLicense as LicenseData | undefined;

    if (!cached || !cached.lastVerifiedAt) {
      return freeTierData();
    }

    if (Date.now() - cached.lastVerifiedAt <= OFFLINE_GRACE_PERIOD_MS) {
      setMemoryCache(cached);
      return cached;
    }

    const freeData = freeTierData();
    setMemoryCache(freeData);
    return freeData;
  } catch {
    return freeTierData();
  }
}

export async function isPro(): Promise<boolean> {
  const key = await getLicenseKey();
  if (!key) return false;

  const result = await verifyLicense(key);
  return result.valid && result.tier !== 'free';
}

export async function getTier(): Promise<string> {
  const key = await getLicenseKey();
  if (!key) return 'free';

  const result = await verifyLicense(key);
  return result.tier || 'free';
}

export async function hasFeature(featureName: string): Promise<boolean> {
  if (!featureName) return false;

  const key = await getLicenseKey();
  if (!key) return false;

  const result = await verifyLicense(key);
  if (!result.valid || !Array.isArray(result.features)) return false;

  return result.features.includes(featureName);
}

export async function getFeatures(): Promise<string[]> {
  const key = await getLicenseKey();
  if (!key) return [];

  const result = await verifyLicense(key);
  return Array.isArray(result.features) ? result.features : [];
}

// =============================================================================
// License Management
// =============================================================================

export async function storeLicenseKey(licenseKey: string): Promise<StoreLicenseResult> {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { success: false, error: 'License key is required.' };
  }

  const normalizedKey = licenseKey.trim().toUpperCase();

  if (!isValidLicenseFormat(normalizedKey)) {
    return {
      success: false,
      error: 'Invalid license key format. Expected: ZOVO-XXXX-XXXX-XXXX-XXXX',
    };
  }

  const verification = await verifyLicense(normalizedKey, true);

  if (!verification.valid) {
    return {
      success: false,
      error: 'License key could not be verified. Please check the key and try again.',
    };
  }

  try {
    await chrome.storage.sync.set({ licenseKey: normalizedKey });
  } catch {
    return { success: false, error: 'Failed to save license key to storage.' };
  }

  await trackEvent('license_activated', { tier: verification.tier });

  return { success: true, data: verification };
}

export async function getLicenseKey(): Promise<string | null> {
  try {
    const result = await chrome.storage.sync.get('licenseKey');
    return result.licenseKey || null;
  } catch {
    return null;
  }
}

export async function clearLicenseCache(): Promise<void> {
  _memoryCache = null;
  _memoryCacheTimestamp = 0;
  await clearStorageCacheInternal();
}

export async function removeLicense(): Promise<void> {
  try {
    await trackEvent('license_deactivated', {
      tier: _memoryCache?.tier || 'unknown',
    });
  } catch {
    // Best effort
  }

  try {
    await chrome.storage.sync.remove('licenseKey');
  } catch {
    // Best effort
  }

  await clearLicenseCache();

  try {
    await chrome.storage.session.remove('zovoSessionId');
  } catch {
    // Session storage may not be available
  }
}

// =============================================================================
// Upgrade Navigation
// =============================================================================

export async function openUpgradePage(source = 'popup'): Promise<void> {
  const upgradeUrl = new URL('https://zovo.one/upgrade');
  upgradeUrl.searchParams.set('ext', EXTENSION_ID);
  upgradeUrl.searchParams.set('ref', source);

  const key = await getLicenseKey();
  if (key) {
    upgradeUrl.searchParams.set('key', key);
  }

  await trackEvent('upgrade_page_opened', { source });

  try {
    await chrome.tabs.create({ url: upgradeUrl.toString() });
  } catch {
    if (typeof window !== 'undefined') {
      window.open(upgradeUrl.toString(), '_blank');
    }
  }
}

// =============================================================================
// Analytics
// =============================================================================

async function getSessionId(): Promise<string> {
  try {
    const result = await chrome.storage.session.get('zovoSessionId');
    if (result.zovoSessionId) {
      return result.zovoSessionId as string;
    }
  } catch {
    // Session storage may not be available
  }

  const sessionId = crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

  try {
    await chrome.storage.session.set({ zovoSessionId: sessionId });
  } catch {
    // Best effort
  }

  return sessionId;
}

export async function trackEvent(eventName: string, eventData: Record<string, unknown> = {}): Promise<void> {
  if (!eventName) return;

  const sessionId = await getSessionId();
  const event: AnalyticsEvent = {
    event: eventName,
    data: eventData,
    extensionId: EXTENSION_ID,
    sessionId,
    timestamp: Date.now(),
    version: chrome.runtime?.getManifest?.()?.version || 'unknown',
  };

  if (!isOnline()) {
    await queueAnalyticsEvent(event);
    return;
  }

  try {
    await fetchWithRetry(
      `${ZOVO_API_BASE}/track-event`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      },
      1
    );
  } catch {
    await queueAnalyticsEvent(event);
  }
}

async function queueAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const result = await chrome.storage.local.get('zovoAnalyticsQueue');
    let queue = Array.isArray(result.zovoAnalyticsQueue)
      ? result.zovoAnalyticsQueue
      : [];

    queue.push(event);

    if (queue.length > MAX_ANALYTICS_QUEUE_SIZE) {
      queue = queue.slice(queue.length - MAX_ANALYTICS_QUEUE_SIZE);
    }

    await chrome.storage.local.set({ zovoAnalyticsQueue: queue });
  } catch {
    // Best effort
  }
}

export async function flushAnalyticsQueue(): Promise<{ sent: number; failed: number }> {
  if (!isOnline()) {
    return { sent: 0, failed: 0 };
  }

  let queue: AnalyticsEvent[];
  try {
    const result = await chrome.storage.local.get('zovoAnalyticsQueue');
    queue = Array.isArray(result.zovoAnalyticsQueue)
      ? result.zovoAnalyticsQueue
      : [];
  } catch {
    return { sent: 0, failed: 0 };
  }

  if (queue.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  const failedEvents: AnalyticsEvent[] = [];

  for (const event of queue) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(`${ZOVO_API_BASE}/track-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok || response.status === 400) {
        sent++;
      } else if (response.status === 429) {
        failedEvents.push(event);
        const currentIndex = queue.indexOf(event);
        failedEvents.push(...queue.slice(currentIndex + 1));
        break;
      } else {
        failedEvents.push(event);
      }
    } catch {
      failedEvents.push(event);
      const currentIndex = queue.indexOf(event);
      if (currentIndex < queue.length - 1) {
        failedEvents.push(...queue.slice(currentIndex + 1));
      }
      break;
    }
  }

  try {
    await chrome.storage.local.set({ zovoAnalyticsQueue: failedEvents });
  } catch {
    // Best effort
  }

  return { sent, failed: failedEvents.length };
}
