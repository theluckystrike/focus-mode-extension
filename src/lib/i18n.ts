/**
 * i18n helper utilities for Chrome Extension.
 * Provides shorthand functions for chrome.i18n API usage in React components.
 */

/**
 * Shorthand for chrome.i18n.getMessage().
 * Returns the localized string for the given key, or the key itself as fallback.
 */
export function t(key: string, substitutions?: string | string[]): string {
  try {
    const message = chrome.i18n.getMessage(key, substitutions);
    if (!message) {
      console.warn(`[i18n] Missing translation for key: "${key}"`);
      return key;
    }
    return message;
  } catch {
    // Fallback for contexts where chrome.i18n is unavailable (tests, etc.)
    return key;
  }
}

/**
 * Format a date according to the user's locale.
 */
export function tDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const locale = getCurrentLocale();
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return String(date);
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', ...options }).format(dateObj);
  } catch {
    return dateObj.toLocaleDateString(locale);
  }
}

/**
 * Format a number according to the user's locale.
 */
export function tNumber(num: number, options?: Intl.NumberFormatOptions): string {
  const locale = getCurrentLocale();
  if (typeof num !== 'number' || isNaN(num)) return String(num);
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch {
    return num.toLocaleString(locale);
  }
}

/**
 * Format a relative time (e.g., "3 minutes ago").
 */
export function tRelativeTime(date: Date | string | number, style: 'long' | 'short' | 'narrow' = 'long'): string {
  const locale = getCurrentLocale();
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { style });
    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
    return rtf.format(diffDay, 'day');
  } catch {
    return tDate(dateObj);
  }
}

/**
 * Get current UI locale in BCP 47 format.
 */
export function getCurrentLocale(): string {
  try {
    return chrome.i18n.getUILanguage().replace('_', '-');
  } catch {
    return 'en';
  }
}

/**
 * Check if current locale is RTL.
 */
export function isRtl(): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  try {
    const locale = chrome.i18n.getUILanguage();
    return rtlLocales.some((rtl) => locale.startsWith(rtl));
  } catch {
    return false;
  }
}
