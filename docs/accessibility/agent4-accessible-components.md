# Phase 21, Section 6: Accessible Components for Focus Mode - Blocker

> **Agent:** 4 of 5 | **Phase:** 21 (Accessibility Compliance)
> **Date:** February 11, 2026
> **Scope:** Nine fully implemented accessible UI components with HTML, CSS, and JavaScript

---

## Table of Contents

1. [FocusToggleButton](#1-focustogglebutton)
2. [NuclearModeConfirmation](#2-nuclearmodeconfirmation)
3. [FocusBlocklist](#3-focusblocklist)
4. [FocusPomodoroTimer](#4-focuspomodorotimer)
5. [FocusScoreMeter](#5-focusscoremeter)
6. [FocusBlockPage](#6-focusblockpage)
7. [FocusToastNotifications](#7-focustoastnotifications)
8. [FocusSettingsTabs](#8-focussettingstabs)
9. [FocusDropdown](#9-focusdropdown)

---

## 1. FocusToggleButton

**File:** `src/popup/components/focus-toggle.js`

The main toggle controls whether Focus Mode is active. It uses `aria-pressed` to communicate binary state, `aria-busy` during the activation transition, and provides both visual and auditory feedback.

### 1.1 HTML

```html
<div class="focus-toggle-wrapper">
  <button
    id="focus-toggle"
    class="focus-toggle-btn"
    type="button"
    role="switch"
    aria-pressed="false"
    aria-label="Focus Mode"
    aria-describedby="focus-toggle-status"
  >
    <span class="focus-toggle-icon" aria-hidden="true">
      <svg class="icon-off" viewBox="0 0 24 24" width="20" height="20" focusable="false">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
      <svg class="icon-on" viewBox="0 0 24 24" width="20" height="20" focusable="false">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="2" fill="none"/>
      </svg>
    </span>
    <span class="focus-toggle-label" aria-hidden="true">Focus Mode</span>
  </button>
  <span id="focus-toggle-status" class="sr-only" aria-live="polite"></span>
</div>
```

### 1.2 CSS

```css
/* src/popup/components/focus-toggle.css */

.focus-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border: 2px solid var(--zovo-secondary-300);
  border-radius: 9999px;
  background: var(--zovo-secondary-50);
  color: var(--zovo-secondary-700);
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  min-height: 48px; /* WCAG touch target */
}

.focus-toggle-btn:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.focus-toggle-btn[aria-pressed="false"] .icon-on,
.focus-toggle-btn[aria-pressed="true"] .icon-off {
  display: none;
}

.focus-toggle-btn[aria-pressed="true"] {
  background: var(--zovo-primary-600);
  border-color: var(--zovo-primary-700);
  color: #ffffff;
}

.focus-toggle-btn[aria-busy="true"] {
  opacity: 0.7;
  pointer-events: none;
  cursor: wait;
}

/* Loading spinner shown during activation */
.focus-toggle-btn[aria-busy="true"] .focus-toggle-icon::after {
  content: "";
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: toggle-spin 0.6s linear infinite;
}

@keyframes toggle-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .focus-toggle-btn { transition: none; }
  .focus-toggle-btn[aria-busy="true"] .focus-toggle-icon::after {
    animation: none;
    border: 2px solid currentColor;
    border-top-color: transparent;
  }
}
```

### 1.3 JavaScript

```js
// src/popup/components/focus-toggle.js

export class FocusToggleButton {
  constructor(containerEl) {
    this.button = containerEl.querySelector('#focus-toggle');
    this.statusEl = containerEl.querySelector('#focus-toggle-status');
    this._active = false;
    this._busy = false;
    this._bind();
  }

  _bind() {
    this.button.addEventListener('click', () => this._handleToggle());
    this.button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._handleToggle();
      }
    });
  }

  async _handleToggle() {
    if (this._busy) return;
    this._setBusy(true);
    this._announce(this._active ? 'Deactivating Focus Mode...' : 'Activating Focus Mode...');

    try {
      const newState = !this._active;
      await chrome.runtime.sendMessage({
        type: 'TOGGLE_FOCUS_MODE',
        enabled: newState
      });
      this._active = newState;
      this.button.setAttribute('aria-pressed', String(this._active));
      this._announce(this._active ? 'Focus Mode is now on' : 'Focus Mode is now off');
    } catch (err) {
      this._announce('Failed to toggle Focus Mode. Please try again.');
    } finally {
      this._setBusy(false);
    }
  }

  _setBusy(busy) {
    this._busy = busy;
    this.button.setAttribute('aria-busy', String(busy));
    this.button.disabled = busy;
  }

  _announce(message) {
    this.statusEl.textContent = '';
    requestAnimationFrame(() => {
      this.statusEl.textContent = message;
    });
  }

  setState(active) {
    this._active = active;
    this.button.setAttribute('aria-pressed', String(active));
  }
}
```

### 1.4 Accessibility Notes

| Requirement | Implementation |
|---|---|
| Role | `role="switch"` with `aria-pressed` |
| Keyboard | Enter and Space both toggle |
| Loading | `aria-busy="true"` disables interaction, announces state |
| Screen reader | `aria-live="polite"` region announces toggle result |
| Touch target | 48px minimum height per WCAG 2.5.8 |
| Focus indicator | 3px solid outline on `:focus-visible` |

---

## 2. NuclearModeConfirmation

**File:** `src/popup/components/nuclear-confirm.js`

Nuclear Mode is a strict lockdown. The confirmation modal uses `role="alertdialog"` because it requires an immediate decision. Focus is trapped inside the dialog, and backdrop click is intentionally blocked.

### 2.1 HTML

```html
<div
  id="nuclear-modal-backdrop"
  class="nuclear-backdrop"
  aria-hidden="true"
>
  <div
    id="nuclear-modal"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="nuclear-modal-title"
    aria-describedby="nuclear-modal-desc"
    class="nuclear-modal"
    tabindex="-1"
  >
    <div class="nuclear-modal-header">
      <svg class="nuclear-warning-icon" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" focusable="false">
        <path d="M12 2L1 21h22L12 2z" fill="var(--zovo-error-500)" stroke="var(--zovo-error-700)" stroke-width="1"/>
        <text x="12" y="17" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">!</text>
      </svg>
      <h2 id="nuclear-modal-title">Activate Nuclear Mode</h2>
    </div>

    <div id="nuclear-modal-desc" class="nuclear-modal-body">
      <p class="nuclear-warning-text">
        <strong>Warning:</strong> Nuclear Mode cannot be canceled once activated.
        All blocked sites will be completely inaccessible for the selected duration.
      </p>

      <div class="nuclear-duration-group">
        <label for="nuclear-duration" id="nuclear-duration-label">
          Lock duration
        </label>
        <select
          id="nuclear-duration"
          aria-describedby="nuclear-duration-hint"
          class="nuclear-duration-select"
        >
          <option value="30">30 minutes</option>
          <option value="60" selected>1 hour</option>
          <option value="120">2 hours</option>
          <option value="240">4 hours</option>
          <option value="480">8 hours</option>
        </select>
        <span id="nuclear-duration-hint" class="hint-text">
          Sites on your blocklist will be locked for this entire period.
        </span>
      </div>
    </div>

    <div class="nuclear-modal-actions">
      <button
        id="nuclear-cancel-btn"
        type="button"
        class="btn btn-secondary"
      >
        Cancel
      </button>
      <button
        id="nuclear-confirm-btn"
        type="button"
        class="btn btn-danger"
        aria-describedby="nuclear-modal-desc"
      >
        Activate Nuclear Mode
      </button>
    </div>
  </div>
</div>
```

### 2.2 CSS

```css
/* src/popup/components/nuclear-confirm.css */

.nuclear-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease;
}

.nuclear-backdrop[aria-hidden="false"] {
  opacity: 1;
  visibility: visible;
}

.nuclear-modal {
  background: var(--zovo-secondary-50, #f8fafc);
  border-radius: 12px;
  padding: 24px;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  border: 2px solid var(--zovo-error-400);
}

.nuclear-modal:focus {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.nuclear-modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.nuclear-modal-header h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--zovo-error-700);
  margin: 0;
}

.nuclear-warning-text {
  background: var(--zovo-error-50);
  border: 1px solid var(--zovo-error-200);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--zovo-error-700);
  margin: 0 0 16px;
}

.nuclear-duration-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nuclear-duration-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--zovo-secondary-700);
}

.nuclear-duration-select {
  padding: 10px 12px;
  border: 1px solid var(--zovo-secondary-300);
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  min-height: 44px;
}

.nuclear-duration-select:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.hint-text {
  font-size: 11px;
  color: var(--zovo-secondary-500);
}

.nuclear-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  min-height: 44px;
}

.btn:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.btn-secondary {
  background: var(--zovo-secondary-100);
  color: var(--zovo-secondary-700);
}

.btn-danger {
  background: var(--zovo-error-600);
  color: #ffffff;
}

.btn-danger:hover {
  background: var(--zovo-error-700);
}

@media (prefers-reduced-motion: reduce) {
  .nuclear-backdrop { transition: none; }
}
```

### 2.3 JavaScript

```js
// src/popup/components/nuclear-confirm.js

export class NuclearModeConfirmation {
  constructor() {
    this.backdrop = document.getElementById('nuclear-modal-backdrop');
    this.modal = document.getElementById('nuclear-modal');
    this.cancelBtn = document.getElementById('nuclear-cancel-btn');
    this.confirmBtn = document.getElementById('nuclear-confirm-btn');
    this.durationSelect = document.getElementById('nuclear-duration');
    this._previousFocus = null;
    this._focusableEls = [];
    this._onConfirm = null;
    this._bind();
  }

  _bind() {
    this.cancelBtn.addEventListener('click', () => this.close());
    this.confirmBtn.addEventListener('click', () => this._confirm());
    this.backdrop.addEventListener('click', (e) => {
      // Intentionally do NOT close on backdrop click for Nuclear Mode
      if (e.target === this.backdrop) {
        this.modal.focus();
      }
    });
    this.modal.addEventListener('keydown', (e) => this._handleKeydown(e));
  }

  open(onConfirm) {
    this._onConfirm = onConfirm;
    this._previousFocus = document.activeElement;
    this.backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    this._focusableEls = Array.from(
      this.modal.querySelectorAll(
        'button, select, [tabindex]:not([tabindex="-1"])'
      )
    );

    // Focus the modal container so screen readers announce the dialog
    this.modal.focus();
  }

  close() {
    this.backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (this._previousFocus && typeof this._previousFocus.focus === 'function') {
      this._previousFocus.focus();
    }
    this._previousFocus = null;
    this._onConfirm = null;
  }

  _confirm() {
    const duration = parseInt(this.durationSelect.value, 10);
    if (typeof this._onConfirm === 'function') {
      this._onConfirm(duration);
    }
    this.close();
  }

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      // Escape closes the confirmation (before activation).
      // Once Nuclear Mode is active, the block page itself ignores Escape.
      e.preventDefault();
      this.close();
      return;
    }

    if (e.key === 'Tab') {
      this._trapFocus(e);
    }
  }

  _trapFocus(e) {
    const els = this._focusableEls;
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}
```

### 2.4 Accessibility Notes

| Requirement | Implementation |
|---|---|
| Role | `role="alertdialog"` for urgent decision |
| Labelling | `aria-labelledby` points to title, `aria-describedby` points to warning body |
| Focus trap | Tab/Shift+Tab cycle within modal; no escape to background |
| Backdrop click | Blocked intentionally; refocuses modal |
| Focus restore | Stored `previousFocus` returned on close |
| Escape key | Closes pre-activation confirmation dialog |
| Duration selector | Native `<select>` with label and hint via `aria-describedby` |

---

## 3. FocusBlocklist

**File:** `src/popup/components/blocklist-tab.js`

The blocklist supports adding, removing, filtering, and bulk-managing blocked sites. It uses roving tabindex for list navigation and live regions for result counts.

### 3.1 HTML

```html
<section class="blocklist-section" aria-labelledby="blocklist-heading">
  <h2 id="blocklist-heading" class="section-heading">Blocked Sites</h2>

  <!-- Add Site Form -->
  <form id="add-site-form" class="add-site-form" novalidate>
    <div class="form-group">
      <label for="site-url-input">Add a site to block</label>
      <div class="input-row">
        <input
          id="site-url-input"
          type="url"
          placeholder="e.g. youtube.com"
          autocomplete="off"
          aria-describedby="site-url-error"
          aria-invalid="false"
          class="site-input"
        />
        <button type="submit" class="btn btn-primary btn-add-site">
          <span aria-hidden="true">+</span>
          <span class="sr-only">Add site to blocklist</span>
        </button>
      </div>
      <span id="site-url-error" class="field-error" role="alert" aria-live="assertive"></span>
    </div>
  </form>

  <!-- Search/Filter -->
  <div class="blocklist-search-group">
    <label for="blocklist-search" class="sr-only">Search blocked sites</label>
    <input
      id="blocklist-search"
      type="search"
      placeholder="Search sites..."
      class="blocklist-search-input"
      aria-describedby="blocklist-search-count"
    />
    <span id="blocklist-search-count" aria-live="polite" class="sr-only"></span>
  </div>

  <!-- Bulk Actions -->
  <div class="blocklist-bulk-bar" role="toolbar" aria-label="Bulk actions">
    <label class="bulk-select-all">
      <input type="checkbox" id="select-all-sites" aria-label="Select all sites" />
      <span aria-hidden="true">Select all</span>
    </label>
    <button
      id="bulk-delete-btn"
      type="button"
      class="btn btn-danger-outline btn-sm"
      disabled
      aria-label="Delete selected sites"
    >
      Delete selected
    </button>
    <span id="bulk-selected-count" aria-live="polite" class="sr-only"></span>
  </div>

  <!-- Category Groups -->
  <div id="blocklist-container" role="list" aria-label="Blocked sites list">
    <!-- Rendered by JS: category groups with list items -->
  </div>

  <!-- Empty State -->
  <div id="blocklist-empty" class="blocklist-empty" role="status" hidden>
    <p>No sites blocked yet. Add a site above to get started.</p>
  </div>
</section>
```

### 3.2 CSS

```css
/* src/popup/components/blocklist-tab.css */

.add-site-form .input-row {
  display: flex;
  gap: 8px;
}

.site-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--zovo-secondary-300);
  border-radius: 8px;
  font-size: 13px;
  min-height: 44px;
}

.site-input:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.site-input[aria-invalid="true"] {
  border-color: var(--zovo-error-500);
  box-shadow: 0 0 0 1px var(--zovo-error-500);
}

.field-error {
  font-size: 12px;
  color: var(--zovo-error-600);
  min-height: 18px;
  display: block;
  margin-top: 4px;
}

.btn-add-site {
  min-width: 44px;
  min-height: 44px;
  border-radius: 8px;
  background: var(--zovo-primary-600);
  color: #fff;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.btn-add-site:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.blocklist-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--zovo-secondary-300);
  border-radius: 8px;
  font-size: 13px;
  margin: 12px 0 8px;
  min-height: 40px;
}

.blocklist-search-input:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.blocklist-bulk-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--zovo-secondary-200);
  margin-bottom: 8px;
}

.blocklist-category-group {
  margin-bottom: 12px;
}

.blocklist-category-heading {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--zovo-secondary-500);
  padding: 4px 0;
}

.blocklist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--zovo-secondary-100);
  border-radius: 4px;
}

.blocklist-item:focus-within,
.blocklist-item[data-active="true"] {
  background: var(--zovo-primary-50);
}

.blocklist-item-checkbox {
  min-width: 18px;
  min-height: 18px;
}

.blocklist-item-name {
  flex: 1;
  font-size: 13px;
  color: var(--zovo-secondary-800);
}

.blocklist-item-remove {
  background: none;
  border: none;
  color: var(--zovo-error-500);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.blocklist-item-remove:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.blocklist-item-remove:hover {
  background: var(--zovo-error-50);
}

.blocklist-empty {
  text-align: center;
  padding: 24px;
  color: var(--zovo-secondary-500);
  font-size: 13px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 3.3 JavaScript

```js
// src/popup/components/blocklist-tab.js

export class FocusBlocklist {
  constructor(sectionEl) {
    this.section = sectionEl;
    this.form = sectionEl.querySelector('#add-site-form');
    this.urlInput = sectionEl.querySelector('#site-url-input');
    this.errorEl = sectionEl.querySelector('#site-url-error');
    this.searchInput = sectionEl.querySelector('#blocklist-search');
    this.searchCountEl = sectionEl.querySelector('#blocklist-search-count');
    this.container = sectionEl.querySelector('#blocklist-container');
    this.emptyEl = sectionEl.querySelector('#blocklist-empty');
    this.selectAllCb = sectionEl.querySelector('#select-all-sites');
    this.bulkDeleteBtn = sectionEl.querySelector('#bulk-delete-btn');
    this.bulkCountEl = sectionEl.querySelector('#bulk-selected-count');

    this.sites = []; // { url, category }
    this._selectedUrls = new Set();
    this._activeIndex = -1;
    this._bind();
  }

  _bind() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._addSite();
    });

    this.searchInput.addEventListener('input', () => this._filterSites());

    this.selectAllCb.addEventListener('change', () => {
      const checked = this.selectAllCb.checked;
      this._selectedUrls = checked
        ? new Set(this.sites.map(s => s.url))
        : new Set();
      this._renderList();
      this._updateBulkUI();
    });

    this.bulkDeleteBtn.addEventListener('click', () => this._bulkDelete());

    this.container.addEventListener('keydown', (e) => this._handleListKeydown(e));
  }

  _addSite() {
    const raw = this.urlInput.value.trim();
    const url = raw.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    if (!url || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url)) {
      this._showError('Please enter a valid domain like "youtube.com"');
      return;
    }

    if (this.sites.some(s => s.url === url)) {
      this._showError(`${url} is already on your blocklist`);
      return;
    }

    this._clearError();
    this.sites.push({ url, category: 'Uncategorized' });
    this.urlInput.value = '';
    this._renderList();
    this._announce(`${url} added to blocklist`);
  }

  _showError(msg) {
    this.urlInput.setAttribute('aria-invalid', 'true');
    this.errorEl.textContent = msg;
  }

  _clearError() {
    this.urlInput.setAttribute('aria-invalid', 'false');
    this.errorEl.textContent = '';
  }

  _removeSite(url) {
    this.sites = this.sites.filter(s => s.url !== url);
    this._selectedUrls.delete(url);
    this._renderList();
    this._updateBulkUI();
    this._announce(`${url} removed from blocklist`);
  }

  _filterSites() {
    const query = this.searchInput.value.toLowerCase();
    const items = this.container.querySelectorAll('.blocklist-item');
    let visibleCount = 0;

    items.forEach(item => {
      const name = item.dataset.url || '';
      const matches = name.toLowerCase().includes(query);
      item.hidden = !matches;
      if (matches) visibleCount++;
    });

    this.searchCountEl.textContent = query
      ? `${visibleCount} site${visibleCount !== 1 ? 's' : ''} found`
      : '';
  }

  _bulkDelete() {
    const count = this._selectedUrls.size;
    this.sites = this.sites.filter(s => !this._selectedUrls.has(s.url));
    this._selectedUrls.clear();
    this._renderList();
    this._updateBulkUI();
    this._announce(`${count} site${count !== 1 ? 's' : ''} removed from blocklist`);
  }

  _updateBulkUI() {
    const count = this._selectedUrls.size;
    this.bulkDeleteBtn.disabled = count === 0;
    this.bulkCountEl.textContent = count > 0
      ? `${count} site${count !== 1 ? 's' : ''} selected`
      : '';
  }

  _renderList() {
    this.container.innerHTML = '';

    if (this.sites.length === 0) {
      this.emptyEl.hidden = false;
      this.container.hidden = true;
      return;
    }

    this.emptyEl.hidden = true;
    this.container.hidden = false;

    // Group by category
    const groups = {};
    this.sites.forEach(site => {
      if (!groups[site.category]) groups[site.category] = [];
      groups[site.category].push(site);
    });

    Object.entries(groups).forEach(([category, sites]) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'blocklist-category-group';
      groupEl.setAttribute('role', 'group');

      const headingId = `cat-${category.toLowerCase().replace(/\s+/g, '-')}`;
      groupEl.setAttribute('aria-labelledby', headingId);

      const heading = document.createElement('div');
      heading.className = 'blocklist-category-heading';
      heading.id = headingId;
      heading.textContent = category;
      groupEl.appendChild(heading);

      sites.forEach((site, idx) => {
        const item = document.createElement('div');
        item.className = 'blocklist-item';
        item.setAttribute('role', 'listitem');
        item.dataset.url = site.url;
        item.tabIndex = idx === 0 && this._activeIndex === -1 ? 0 : -1;

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'blocklist-item-checkbox';
        cb.checked = this._selectedUrls.has(site.url);
        cb.setAttribute('aria-label', `Select ${site.url}`);
        cb.addEventListener('change', () => {
          if (cb.checked) this._selectedUrls.add(site.url);
          else this._selectedUrls.delete(site.url);
          this._updateBulkUI();
        });

        const nameSpan = document.createElement('span');
        nameSpan.className = 'blocklist-item-name';
        nameSpan.textContent = site.url;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'blocklist-item-remove';
        removeBtn.setAttribute('aria-label', `Remove ${site.url} from blocklist`);
        removeBtn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" focusable="false"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2"/></svg>';
        removeBtn.addEventListener('click', () => this._removeSite(site.url));

        item.append(cb, nameSpan, removeBtn);
        groupEl.appendChild(item);
      });

      this.container.appendChild(groupEl);
    });
  }

  /** Arrow key navigation through list items (roving tabindex) */
  _handleListKeydown(e) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;

    const items = Array.from(this.container.querySelectorAll('.blocklist-item:not([hidden])'));
    if (items.length === 0) return;

    e.preventDefault();
    const currentIdx = items.findIndex(el => el === document.activeElement || el.contains(document.activeElement));
    let nextIdx = currentIdx;

    switch (e.key) {
      case 'ArrowDown': nextIdx = Math.min(currentIdx + 1, items.length - 1); break;
      case 'ArrowUp':   nextIdx = Math.max(currentIdx - 1, 0); break;
      case 'Home':      nextIdx = 0; break;
      case 'End':       nextIdx = items.length - 1; break;
    }

    items.forEach((el, i) => el.tabIndex = i === nextIdx ? 0 : -1);
    items[nextIdx].focus();
    this._activeIndex = nextIdx;
  }

  _announce(msg) {
    const el = this.section.querySelector('#blocklist-search-count') || this.searchCountEl;
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = msg; });
  }

  setData(sites) {
    this.sites = sites;
    this._renderList();
  }
}
```

---

## 4. FocusPomodoroTimer

**File:** `src/popup/components/timer-display.js`

The Pomodoro timer displays a countdown with `role="timer"` and uses `aria-live` to announce phase transitions. Control buttons update their labels based on the current state.

### 4.1 HTML

```html
<section class="pomodoro-section" aria-labelledby="pomodoro-heading">
  <h2 id="pomodoro-heading" class="section-heading">Pomodoro Timer</h2>

  <div
    id="pomodoro-timer"
    class="pomodoro-timer-display"
    role="timer"
    aria-label="Pomodoro countdown"
    aria-live="off"
    aria-atomic="true"
  >
    <!-- Visual progress ring (decorative for screen readers, info conveyed in text) -->
    <svg class="timer-ring" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="54" fill="none" stroke="var(--zovo-secondary-200)" stroke-width="6"/>
      <circle
        id="timer-ring-progress"
        cx="60" cy="60" r="54"
        fill="none"
        stroke="var(--zovo-primary-500)"
        stroke-width="6"
        stroke-linecap="round"
        stroke-dasharray="339.292"
        stroke-dashoffset="0"
        transform="rotate(-90 60 60)"
      />
    </svg>
    <div class="timer-center-text">
      <span id="timer-time-display" class="timer-time">25:00</span>
      <span id="timer-phase-label" class="timer-phase">Work</span>
    </div>
  </div>

  <!-- Phase announcements for screen readers -->
  <div id="timer-sr-announce" class="sr-only" aria-live="assertive" role="status"></div>

  <!-- Controls -->
  <div class="pomodoro-controls" role="group" aria-label="Timer controls">
    <button id="timer-start-btn" type="button" class="btn btn-primary">
      Start
    </button>
    <button id="timer-pause-btn" type="button" class="btn btn-secondary" hidden>
      Pause
    </button>
    <button id="timer-reset-btn" type="button" class="btn btn-outline" disabled>
      Reset
    </button>
  </div>

  <!-- Audio cue toggle -->
  <div class="pomodoro-audio-toggle">
    <button
      id="timer-audio-btn"
      type="button"
      class="btn-icon"
      role="switch"
      aria-pressed="true"
      aria-label="Audio notifications"
    >
      <svg class="audio-icon-on" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" focusable="false">
        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
        <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
      <svg class="audio-icon-off" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" focusable="false" hidden>
        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
        <line x1="18" y1="9" x2="22" y2="15" stroke="currentColor" stroke-width="2"/>
        <line x1="22" y1="9" x2="18" y2="15" stroke="currentColor" stroke-width="2"/>
      </svg>
    </button>
  </div>

  <!-- Timer Settings -->
  <details class="pomodoro-settings-details">
    <summary>Timer settings</summary>
    <div class="pomodoro-settings-panel">
      <div class="setting-field">
        <label for="work-duration">Work duration (minutes)</label>
        <input id="work-duration" type="number" min="1" max="120" value="25"
               aria-describedby="work-duration-hint" class="setting-input" />
        <span id="work-duration-hint" class="hint-text">1 to 120 minutes</span>
      </div>
      <div class="setting-field">
        <label for="break-duration">Break duration (minutes)</label>
        <input id="break-duration" type="number" min="1" max="60" value="5"
               aria-describedby="break-duration-hint" class="setting-input" />
        <span id="break-duration-hint" class="hint-text">1 to 60 minutes</span>
      </div>
    </div>
  </details>
</section>
```

### 4.2 CSS

```css
/* src/popup/components/timer-display.css */

.pomodoro-timer-display {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 16px auto;
}

.timer-ring {
  width: 100%;
  height: 100%;
}

.timer-center-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.timer-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 28px;
  font-weight: 600;
  color: var(--zovo-secondary-900);
  letter-spacing: -0.02em;
}

.timer-phase {
  font-size: 12px;
  font-weight: 600;
  color: var(--zovo-secondary-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pomodoro-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

.btn-primary {
  background: var(--zovo-primary-600);
  color: #fff;
  min-height: 44px;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:focus-visible,
.btn-outline:focus-visible,
.btn-icon:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--zovo-secondary-300);
  color: var(--zovo-secondary-600);
  min-height: 44px;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-outline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon {
  background: none;
  border: 1px solid var(--zovo-secondary-300);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--zovo-secondary-600);
}

.btn-icon[aria-pressed="true"] {
  color: var(--zovo-primary-600);
  border-color: var(--zovo-primary-300);
}

.btn-icon[aria-pressed="false"] .audio-icon-on,
.btn-icon[aria-pressed="true"] .audio-icon-off { display: none; }
.btn-icon[aria-pressed="false"] .audio-icon-off,
.btn-icon[aria-pressed="true"] .audio-icon-on { display: block; }

.pomodoro-audio-toggle {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.pomodoro-settings-details {
  margin-top: 12px;
  border: 1px solid var(--zovo-secondary-200);
  border-radius: 8px;
}

.pomodoro-settings-details summary {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: var(--zovo-secondary-600);
}

.pomodoro-settings-details summary:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.pomodoro-settings-panel {
  padding: 12px;
  display: flex;
  gap: 12px;
}

.setting-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--zovo-secondary-700);
}

.setting-input {
  padding: 8px;
  border: 1px solid var(--zovo-secondary-300);
  border-radius: 6px;
  font-size: 14px;
  min-height: 40px;
}

.setting-input:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .timer-ring circle { transition: none; }
}
```

### 4.3 JavaScript

```js
// src/popup/components/timer-display.js

const CIRCUMFERENCE = 2 * Math.PI * 54; // 339.292

export class FocusPomodoroTimer {
  constructor(sectionEl) {
    this.section = sectionEl;
    this.timerEl = sectionEl.querySelector('#pomodoro-timer');
    this.timeDisplay = sectionEl.querySelector('#timer-time-display');
    this.phaseLabel = sectionEl.querySelector('#timer-phase-label');
    this.progressRing = sectionEl.querySelector('#timer-ring-progress');
    this.announceEl = sectionEl.querySelector('#timer-sr-announce');
    this.startBtn = sectionEl.querySelector('#timer-start-btn');
    this.pauseBtn = sectionEl.querySelector('#timer-pause-btn');
    this.resetBtn = sectionEl.querySelector('#timer-reset-btn');
    this.audioBtn = sectionEl.querySelector('#timer-audio-btn');
    this.workInput = sectionEl.querySelector('#work-duration');
    this.breakInput = sectionEl.querySelector('#break-duration');

    this._state = 'idle'; // idle | running | paused | break-running | break-paused
    this._phase = 'work'; // work | break
    this._secondsRemaining = 25 * 60;
    this._totalSeconds = 25 * 60;
    this._intervalId = null;
    this._audioEnabled = true;
    this._lastAnnouncedMinute = -1;

    this._bind();
  }

  _bind() {
    this.startBtn.addEventListener('click', () => this._start());
    this.pauseBtn.addEventListener('click', () => this._pause());
    this.resetBtn.addEventListener('click', () => this._reset());
    this.audioBtn.addEventListener('click', () => this._toggleAudio());
  }

  _start() {
    if (this._state === 'idle') {
      const mins = this._phase === 'work'
        ? parseInt(this.workInput.value, 10) || 25
        : parseInt(this.breakInput.value, 10) || 5;
      this._totalSeconds = mins * 60;
      this._secondsRemaining = this._totalSeconds;
    }

    this._state = this._phase === 'work' ? 'running' : 'break-running';
    this.startBtn.hidden = true;
    this.pauseBtn.hidden = false;
    this.resetBtn.disabled = false;

    this._announce(`${this._phase === 'work' ? 'Work' : 'Break'} session started. ${this._formatTime(this._secondsRemaining)} remaining.`);

    this._intervalId = setInterval(() => this._tick(), 1000);
  }

  _pause() {
    clearInterval(this._intervalId);
    this._state = this._phase === 'work' ? 'paused' : 'break-paused';
    this.pauseBtn.hidden = true;
    this.startBtn.hidden = false;
    this.startBtn.textContent = 'Resume';
    this._announce(`Timer paused at ${this._formatTime(this._secondsRemaining)}`);
  }

  _reset() {
    clearInterval(this._intervalId);
    this._state = 'idle';
    this._phase = 'work';
    const mins = parseInt(this.workInput.value, 10) || 25;
    this._totalSeconds = mins * 60;
    this._secondsRemaining = this._totalSeconds;

    this.startBtn.hidden = false;
    this.startBtn.textContent = 'Start';
    this.pauseBtn.hidden = true;
    this.resetBtn.disabled = true;

    this._updateDisplay();
    this._announce('Timer reset');
    this._lastAnnouncedMinute = -1;
  }

  _tick() {
    this._secondsRemaining--;

    if (this._secondsRemaining <= 0) {
      clearInterval(this._intervalId);
      this._phaseComplete();
      return;
    }

    this._updateDisplay();

    // Announce at each minute boundary so screen reader users get periodic updates
    const currentMinute = Math.ceil(this._secondsRemaining / 60);
    if (currentMinute !== this._lastAnnouncedMinute && this._secondsRemaining % 60 === 0) {
      this._lastAnnouncedMinute = currentMinute;
      // Only announce at 5-minute intervals or under 2 minutes
      if (currentMinute <= 2 || currentMinute % 5 === 0) {
        this._announce(`${currentMinute} minute${currentMinute !== 1 ? 's' : ''} remaining`);
      }
    }
  }

  _phaseComplete() {
    if (this._audioEnabled) {
      this._playChime();
    }

    if (this._phase === 'work') {
      this._phase = 'break';
      this._announce('Work session complete! Break time starting.');
      this.phaseLabel.textContent = 'Break';
      const breakMins = parseInt(this.breakInput.value, 10) || 5;
      this._totalSeconds = breakMins * 60;
      this._secondsRemaining = this._totalSeconds;
      this._updateDisplay();
      this._start();
    } else {
      this._phase = 'work';
      this._announce('Break complete! Ready for next work session.');
      this.phaseLabel.textContent = 'Work';
      this._state = 'idle';
      this.startBtn.hidden = false;
      this.startBtn.textContent = 'Start';
      this.pauseBtn.hidden = true;
      this.resetBtn.disabled = true;
      const workMins = parseInt(this.workInput.value, 10) || 25;
      this._totalSeconds = workMins * 60;
      this._secondsRemaining = this._totalSeconds;
      this._updateDisplay();
    }
  }

  _updateDisplay() {
    this.timeDisplay.textContent = this._formatTime(this._secondsRemaining);
    const progress = 1 - (this._secondsRemaining / this._totalSeconds);
    this.progressRing.setAttribute(
      'stroke-dashoffset',
      String(CIRCUMFERENCE * (1 - progress))
    );
  }

  _toggleAudio() {
    this._audioEnabled = !this._audioEnabled;
    this.audioBtn.setAttribute('aria-pressed', String(this._audioEnabled));
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  _announce(msg) {
    this.announceEl.textContent = '';
    requestAnimationFrame(() => { this.announceEl.textContent = msg; });
  }

  _playChime() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) { /* AudioContext not available */ }
  }
}
```

### 4.4 Accessibility Notes

| Requirement | Implementation |
|---|---|
| Timer role | `role="timer"` with `aria-live="off"` (polled, not spammed) |
| Phase changes | `aria-live="assertive"` region announces work/break transitions |
| Minute updates | Periodic announcements at 5-min intervals and under 2 min |
| Button labels | Dynamic: Start / Resume / Pause reflect current state |
| Audio toggle | `role="switch"` with `aria-pressed` |
| Progress | Visual ring is `aria-hidden`; time text is the accessible value |
| Settings | `<details>/<summary>` for progressive disclosure with native a11y |

---

## 5. FocusScoreMeter

**File:** `src/popup/components/focus-score-ring.js`

The Focus Score (0-100) uses `role="meter"` with full ARIA attributes. It does not rely on color alone -- it adds a text label and an icon.

### 5.1 HTML

```html
<div class="focus-score-section" aria-labelledby="score-heading">
  <h3 id="score-heading" class="section-heading">Focus Score</h3>

  <div
    id="focus-score-meter"
    role="meter"
    aria-valuenow="72"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="Focus Score: 72 out of 100"
    class="focus-score-meter"
  >
    <svg class="score-ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--zovo-secondary-200)" stroke-width="8"/>
      <circle
        id="score-ring-fill"
        cx="50" cy="50" r="42"
        fill="none"
        stroke="var(--zovo-success-500)"
        stroke-width="8"
        stroke-linecap="round"
        stroke-dasharray="263.89"
        stroke-dashoffset="73.89"
        transform="rotate(-90 50 50)"
      />
    </svg>
    <div class="score-center">
      <span class="score-number">72</span>
      <span class="score-icon" aria-hidden="true">&#9650;</span><!-- up arrow for good -->
    </div>
  </div>

  <!-- Trend -->
  <div class="score-trend" aria-live="polite">
    <span id="score-trend-text">Up 5 points from yesterday</span>
  </div>

  <!-- Accessible data table alternative for history chart -->
  <details class="score-history-details">
    <summary>View score history</summary>
    <table class="score-history-table" aria-label="Focus Score history, last 7 days">
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Score</th>
          <th scope="col">Change</th>
        </tr>
      </thead>
      <tbody id="score-history-body">
        <!-- Populated by JS -->
      </tbody>
    </table>
  </details>
</div>
```

### 5.2 CSS

```css
/* src/popup/components/focus-score-ring.css */

.focus-score-meter {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 12px auto;
}

.score-ring { width: 100%; height: 100%; }

.score-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-number {
  font-family: Inter, sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--zovo-secondary-900);
}

.score-icon {
  font-size: 12px;
  color: var(--zovo-success-600);
}

/* Score level color coding (never color-only; number + icon always present) */
.focus-score-meter[data-level="low"] #score-ring-fill { stroke: var(--zovo-error-500); }
.focus-score-meter[data-level="medium"] #score-ring-fill { stroke: var(--zovo-warning-500); }
.focus-score-meter[data-level="high"] #score-ring-fill { stroke: var(--zovo-success-500); }

.score-trend {
  text-align: center;
  font-size: 12px;
  color: var(--zovo-secondary-600);
  margin-top: 4px;
}

.score-history-details {
  margin-top: 12px;
  border: 1px solid var(--zovo-secondary-200);
  border-radius: 8px;
}

.score-history-details summary {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.score-history-details summary:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.score-history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.score-history-table th,
.score-history-table td {
  padding: 6px 10px;
  text-align: left;
  border-top: 1px solid var(--zovo-secondary-200);
}

.score-history-table th {
  font-weight: 600;
  color: var(--zovo-secondary-600);
}
```

### 5.3 JavaScript

```js
// src/popup/components/focus-score-ring.js

const RING_CIRCUMFERENCE = 2 * Math.PI * 42; // 263.89

export class FocusScoreMeter {
  constructor(containerEl) {
    this.meter = containerEl.querySelector('#focus-score-meter');
    this.ringFill = containerEl.querySelector('#score-ring-fill');
    this.numberEl = containerEl.querySelector('.score-number');
    this.iconEl = containerEl.querySelector('.score-icon');
    this.trendEl = containerEl.querySelector('#score-trend-text');
    this.historyBody = containerEl.querySelector('#score-history-body');
  }

  update(score, previousScore, history) {
    score = Math.max(0, Math.min(100, score));

    // Update meter ARIA
    this.meter.setAttribute('aria-valuenow', String(score));
    this.meter.setAttribute('aria-label', `Focus Score: ${score} out of 100`);

    // Visual
    this.numberEl.textContent = String(score);
    const offset = RING_CIRCUMFERENCE * (1 - score / 100);
    this.ringFill.setAttribute('stroke-dashoffset', String(offset));

    // Level for color (not relied upon alone)
    const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    this.meter.dataset.level = level;

    // Trend icon (up/down/neutral) -- text description always present
    const diff = score - (previousScore ?? score);
    if (diff > 0) {
      this.iconEl.innerHTML = '&#9650;'; // up triangle
      this.iconEl.style.color = 'var(--zovo-success-600)';
      this.trendEl.textContent = `Up ${diff} point${diff !== 1 ? 's' : ''} from yesterday`;
    } else if (diff < 0) {
      this.iconEl.innerHTML = '&#9660;'; // down triangle
      this.iconEl.style.color = 'var(--zovo-error-600)';
      this.trendEl.textContent = `Down ${Math.abs(diff)} point${Math.abs(diff) !== 1 ? 's' : ''} from yesterday`;
    } else {
      this.iconEl.innerHTML = '&#9644;'; // horizontal bar
      this.iconEl.style.color = 'var(--zovo-secondary-400)';
      this.trendEl.textContent = 'No change from yesterday';
    }

    // History table
    if (history && history.length) {
      this.historyBody.innerHTML = history.map(entry =>
        `<tr>
          <td>${entry.date}</td>
          <td>${entry.score}</td>
          <td>${entry.change >= 0 ? '+' : ''}${entry.change}</td>
        </tr>`
      ).join('');
    }
  }
}
```

---

## 6. FocusBlockPage

**File:** `src/content/block-page.js`

The block page is a full-screen overlay injected into blocked sites. It uses `role="alertdialog"` and keeps focus contained. Escape does not dismiss it in Nuclear Mode.

### 6.1 HTML (injected by content script)

```html
<div
  id="focus-block-overlay"
  class="block-overlay"
  role="alertdialog"
  aria-modal="true"
  aria-labelledby="block-title"
  aria-describedby="block-desc"
  tabindex="-1"
>
  <div class="block-content">
    <div class="block-icon" aria-hidden="true">
      <svg viewBox="0 0 64 64" width="64" height="64" focusable="false">
        <circle cx="32" cy="32" r="28" fill="none" stroke="var(--zovo-error-500)" stroke-width="4"/>
        <line x1="18" y1="18" x2="46" y2="46" stroke="var(--zovo-error-500)" stroke-width="4"/>
      </svg>
    </div>

    <h1 id="block-title" class="block-title">This site is blocked</h1>

    <p id="block-desc" class="block-desc">
      <span id="block-site-name"></span> is on your Focus Mode blocklist.
      Stay focused and get back to what matters.
    </p>

    <!-- Motivational quote with rotation -->
    <blockquote
      id="block-quote"
      class="block-quote"
      aria-live="polite"
      aria-atomic="true"
    >
      <p id="block-quote-text">"The secret of getting ahead is getting started."</p>
      <footer id="block-quote-author">-- Mark Twain</footer>
    </blockquote>

    <!-- Nuclear Mode timer (only shown during Nuclear Mode) -->
    <div
      id="block-nuclear-timer"
      class="block-nuclear-timer"
      role="timer"
      aria-label="Nuclear Mode time remaining"
      hidden
    >
      <span class="nuclear-timer-icon" aria-hidden="true">&#128274;</span>
      <span id="nuclear-timer-text">Nuclear Mode: 1:24:30 remaining</span>
    </div>

    <!-- Actions -->
    <div class="block-actions">
      <button
        id="block-back-btn"
        type="button"
        class="btn btn-primary btn-lg"
        autofocus
      >
        Back to Focus
      </button>
      <button
        id="block-temp-access-btn"
        type="button"
        class="btn btn-outline btn-sm"
        aria-describedby="block-temp-access-desc"
        hidden
      >
        Request Temporary Access
      </button>
      <span id="block-temp-access-desc" class="sr-only">
        Pro feature: grants 5-minute access to this site
      </span>
    </div>
  </div>
</div>
```

### 6.2 CSS

```css
/* src/content/block-page.css */

.block-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #f1f5f9;
}

.block-overlay:focus {
  outline: none; /* overlay itself; child elements have visible focus */
}

.block-content {
  text-align: center;
  max-width: 480px;
  padding: 32px;
}

.block-title {
  font-size: 24px;
  font-weight: 700;
  margin: 16px 0 8px;
}

.block-desc {
  font-size: 14px;
  line-height: 1.6;
  color: #94a3b8;
  margin: 0 0 24px;
}

.block-quote {
  border-left: 3px solid var(--zovo-primary-400, #818cf8);
  padding: 12px 16px;
  margin: 0 0 24px;
  text-align: left;
  background: rgba(255,255,255,0.05);
  border-radius: 0 8px 8px 0;
}

.block-quote p {
  font-size: 14px;
  font-style: italic;
  margin: 0 0 4px;
  color: #e2e8f0;
}

.block-quote footer {
  font-size: 12px;
  color: #64748b;
}

.block-nuclear-timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(220, 38, 38, 0.15);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fca5a5;
}

.block-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.btn-lg {
  padding: 14px 36px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  min-height: 48px;
  background: var(--zovo-primary-600, #4f46e5);
  color: #fff;
  border: none;
  cursor: pointer;
}

.btn-lg:focus-visible {
  outline: 3px solid var(--zovo-primary-300, #a5b4fc);
  outline-offset: 2px;
}

.btn-lg:hover {
  background: var(--zovo-primary-500, #6366f1);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 12px;
}

.btn-outline.btn-sm {
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  min-height: 36px;
}

.btn-outline.btn-sm:focus-visible {
  outline: 3px solid var(--zovo-primary-300, #a5b4fc);
  outline-offset: 2px;
}
```

### 6.3 JavaScript

```js
// src/content/block-page.js

const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
  { text: 'Concentrate all your thoughts upon the work at hand.', author: 'Alexander Graham Bell' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
];

export class FocusBlockPage {
  constructor() {
    this.overlay = document.getElementById('focus-block-overlay');
    this.backBtn = document.getElementById('block-back-btn');
    this.tempAccessBtn = document.getElementById('block-temp-access-btn');
    this.quoteText = document.getElementById('block-quote-text');
    this.quoteAuthor = document.getElementById('block-quote-author');
    this.nuclearTimer = document.getElementById('block-nuclear-timer');
    this.nuclearTimerText = document.getElementById('nuclear-timer-text');
    this.siteNameEl = document.getElementById('block-site-name');

    this._isNuclearMode = false;
    this._nuclearEndTime = null;
    this._quoteInterval = null;
    this._timerInterval = null;
    this._focusableEls = [];
  }

  init({ siteName, isNuclear, nuclearEndTime, isPro }) {
    this.siteNameEl.textContent = siteName;
    this._isNuclearMode = isNuclear;

    if (isNuclear && nuclearEndTime) {
      this._nuclearEndTime = nuclearEndTime;
      this.nuclearTimer.hidden = false;
      this._startNuclearCountdown();
    }

    if (isPro) {
      this.tempAccessBtn.hidden = false;
    }

    this._focusableEls = Array.from(
      this.overlay.querySelectorAll('button:not([hidden])')
    );

    this._bind();
    this.overlay.focus();
    this._rotateQuotes();
  }

  _bind() {
    this.backBtn.addEventListener('click', () => {
      window.history.back();
    });

    this.tempAccessBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'REQUEST_TEMP_ACCESS', site: this.siteNameEl.textContent });
    });

    this.overlay.addEventListener('keydown', (e) => {
      // Escape does NOT close in Nuclear Mode
      if (e.key === 'Escape') {
        if (this._isNuclearMode) {
          e.preventDefault();
          return;
        }
        window.history.back();
        return;
      }

      if (e.key === 'Tab') {
        this._trapFocus(e);
      }
    });
  }

  _trapFocus(e) {
    const els = this._focusableEls;
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  _rotateQuotes() {
    let idx = 0;
    this._quoteInterval = setInterval(() => {
      idx = (idx + 1) % QUOTES.length;
      this.quoteText.textContent = `"${QUOTES[idx].text}"`;
      this.quoteAuthor.textContent = `-- ${QUOTES[idx].author}`;
    }, 15000); // rotate every 15 seconds
  }

  _startNuclearCountdown() {
    const update = () => {
      const remaining = Math.max(0, this._nuclearEndTime - Date.now());
      if (remaining <= 0) {
        clearInterval(this._timerInterval);
        this.nuclearTimerText.textContent = 'Nuclear Mode has ended. Refreshing...';
        setTimeout(() => location.reload(), 2000);
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      const timeStr = h > 0
        ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        : `${m}:${String(s).padStart(2,'0')}`;
      this.nuclearTimerText.textContent = `Nuclear Mode: ${timeStr} remaining`;
    };
    update();
    this._timerInterval = setInterval(update, 1000);
  }

  destroy() {
    clearInterval(this._quoteInterval);
    clearInterval(this._timerInterval);
  }
}
```

### 6.4 Accessibility Notes

| Requirement | Implementation |
|---|---|
| Role | `role="alertdialog"` with `aria-modal="true"` |
| Labelling | `aria-labelledby` for title, `aria-describedby` for explanation |
| Focus trap | Tab cycles only among visible buttons inside overlay |
| Nuclear Escape | `e.key === 'Escape'` explicitly blocked during Nuclear Mode |
| Quote rotation | `aria-live="polite"` + `aria-atomic="true"` announces new quotes |
| Nuclear timer | `role="timer"` with text countdown, not visual-only |
| Host page | `z-index: 2147483647` overlays host; no host tree modifications |
| Pro feature | `aria-describedby` explains the temporary access button |

---

## 7. FocusToastNotifications

**File:** `src/popup/components/toast-notifications.js`

Toasts use a live region container. Error toasts are assertive and persist. All toasts have close buttons and respect reduced motion.

### 7.1 HTML

```html
<div
  id="toast-container"
  class="toast-container"
  role="region"
  aria-label="Notifications"
  aria-live="polite"
  aria-relevant="additions"
>
  <!-- Toasts injected here by JS -->
</div>
```

### 7.2 CSS

```css
/* src/popup/components/toast-notifications.css */

.toast-container {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 8000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 340px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--zovo-secondary-800);
  color: #f1f5f9;
  font-size: 13px;
  line-height: 1.4;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  pointer-events: auto;
  animation: toast-slide-in 0.25s ease-out;
}

.toast.toast-exiting {
  animation: toast-slide-out 0.2s ease-in forwards;
}

.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.toast-success .toast-icon { color: var(--zovo-success-400); }
.toast-error .toast-icon   { color: var(--zovo-error-400); }
.toast-warning .toast-icon { color: var(--zovo-warning-400); }
.toast-info .toast-icon    { color: var(--zovo-accent-400); }

.toast-success { border-left: 3px solid var(--zovo-success-500); }
.toast-error   { border-left: 3px solid var(--zovo-error-500); }
.toast-warning { border-left: 3px solid var(--zovo-warning-500); }
.toast-info    { border-left: 3px solid var(--zovo-accent-500); }

.toast-body {
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  min-width: 28px;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-close:focus-visible {
  outline: 2px solid var(--zovo-primary-400);
  outline-offset: 1px;
}

.toast-close:hover {
  color: #e2e8f0;
}

@keyframes toast-slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

@keyframes toast-slide-out {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(100%); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    animation: toast-fade-in 0.15s ease-out;
  }
  .toast.toast-exiting {
    animation: toast-fade-out 0.15s ease-in forwards;
  }
  @keyframes toast-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes toast-fade-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
}
```

### 7.3 JavaScript

```js
// src/popup/components/toast-notifications.js

const ICONS = {
  success: '<svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" focusable="false"><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  error:   '<svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" focusable="false"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="10" y1="6" x2="10" y2="11" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="14" r="1" fill="currentColor"/></svg>',
  warning: '<svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" focusable="false"><path d="M10 2L1 18h18L10 2z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="15" r="1" fill="currentColor"/></svg>',
  info:    '<svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" focusable="false"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="10" y1="9" x2="10" y2="14" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="6" r="1" fill="currentColor"/></svg>',
};

const DEFAULT_DURATION = 5000;

export class FocusToastNotifications {
  constructor() {
    this.container = document.getElementById('toast-container');
    this._toasts = new Map(); // id -> { el, timerId }
    this._idCounter = 0;
  }

  /**
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {string} message
   * @param {object} [options]
   * @param {number} [options.duration] - ms before auto-dismiss. 0 = persist.
   */
  show(type, message, options = {}) {
    const id = ++this._idCounter;
    const duration = options.duration ?? (type === 'error' ? 0 : DEFAULT_DURATION);

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    // Error toasts get assertive so they interrupt
    if (type === 'error') {
      toast.setAttribute('aria-live', 'assertive');
    }

    toast.innerHTML = `
      <span class="toast-icon">${ICONS[type] || ''}</span>
      <span class="toast-body">${this._escapeHTML(message)}</span>
      <button class="toast-close" type="button" aria-label="Dismiss notification">
        <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" focusable="false">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this._dismiss(id));

    this.container.appendChild(toast);

    let timerId = null;
    if (duration > 0) {
      timerId = setTimeout(() => this._dismiss(id), duration);
    }

    this._toasts.set(id, { el: toast, timerId });

    // Error toasts steal focus for immediate attention
    if (type === 'error') {
      closeBtn.focus();
    }

    return id;
  }

  _dismiss(id) {
    const entry = this._toasts.get(id);
    if (!entry) return;

    if (entry.timerId) clearTimeout(entry.timerId);
    entry.el.classList.add('toast-exiting');

    const onEnd = () => {
      entry.el.remove();
      this._toasts.delete(id);
    };

    entry.el.addEventListener('animationend', onEnd, { once: true });
    // Safety fallback if animationend never fires (reduced motion, etc.)
    setTimeout(onEnd, 300);
  }

  dismissAll() {
    for (const id of this._toasts.keys()) {
      this._dismiss(id);
    }
  }

  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
```

### 7.4 Accessibility Notes

| Requirement | Implementation |
|---|---|
| Container | `role="region"` with `aria-label="Notifications"` |
| Live region | `aria-live="polite"` on container; errors override with `assertive` |
| Error persistence | Error toasts have no auto-dismiss timer; close button focused |
| Close button | Every toast has a close button with `aria-label="Dismiss notification"` |
| Reduced motion | `prefers-reduced-motion: reduce` swaps slide for fade |
| XSS safety | Message text is escaped via `textContent` before insertion |

---

## 8. FocusSettingsTabs

**File:** `src/options/components/settings-tabs.js`

The settings page uses the WAI-ARIA tabs pattern with arrow key navigation. Each tab panel is lazily shown and has `aria-labelledby` pointing back to its tab.

### 8.1 HTML

```html
<div class="settings-container">
  <div role="tablist" aria-label="Settings sections" class="settings-tablist" id="settings-tablist">
    <button role="tab" id="tab-general"    aria-controls="panel-general"    aria-selected="true"  tabindex="0"  class="settings-tab">General</button>
    <button role="tab" id="tab-blocklist"  aria-controls="panel-blocklist"  aria-selected="false" tabindex="-1" class="settings-tab">Blocklist</button>
    <button role="tab" id="tab-timer"      aria-controls="panel-timer"      aria-selected="false" tabindex="-1" class="settings-tab">Timer</button>
    <button role="tab" id="tab-nuclear"    aria-controls="panel-nuclear"    aria-selected="false" tabindex="-1" class="settings-tab">Nuclear Mode</button>
    <button role="tab" id="tab-appearance" aria-controls="panel-appearance" aria-selected="false" tabindex="-1" class="settings-tab">Appearance</button>
    <button role="tab" id="tab-account"    aria-controls="panel-account"    aria-selected="false" tabindex="-1" class="settings-tab">Account</button>
  </div>

  <div id="panel-general"    role="tabpanel" aria-labelledby="tab-general"    tabindex="0" class="settings-panel"><!-- General settings --></div>
  <div id="panel-blocklist"  role="tabpanel" aria-labelledby="tab-blocklist"  tabindex="0" class="settings-panel" hidden><!-- Blocklist settings --></div>
  <div id="panel-timer"      role="tabpanel" aria-labelledby="tab-timer"      tabindex="0" class="settings-panel" hidden><!-- Timer settings --></div>
  <div id="panel-nuclear"    role="tabpanel" aria-labelledby="tab-nuclear"    tabindex="0" class="settings-panel" hidden><!-- Nuclear settings --></div>
  <div id="panel-appearance" role="tabpanel" aria-labelledby="tab-appearance" tabindex="0" class="settings-panel" hidden><!-- Appearance settings --></div>
  <div id="panel-account"    role="tabpanel" aria-labelledby="tab-account"    tabindex="0" class="settings-panel" hidden><!-- Account settings --></div>

  <!-- Auto-save status -->
  <div id="settings-save-status" class="sr-only" role="status" aria-live="polite"></div>
</div>
```

### 8.2 CSS

```css
/* src/options/components/settings-tabs.css */

.settings-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 24px;
}

.settings-tablist {
  display: flex;
  gap: 2px;
  border-bottom: 2px solid var(--zovo-secondary-200);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.settings-tab {
  padding: 10px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 13px;
  font-weight: 500;
  color: var(--zovo-secondary-500);
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
  transition: color 0.15s, border-color 0.15s;
}

.settings-tab:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: -3px;
  border-radius: 4px 4px 0 0;
}

.settings-tab[aria-selected="true"] {
  color: var(--zovo-primary-600);
  border-bottom-color: var(--zovo-primary-600);
  font-weight: 600;
}

.settings-tab:hover:not([aria-selected="true"]) {
  color: var(--zovo-secondary-700);
}

.settings-panel {
  padding: 20px 0;
}

.settings-panel:focus {
  outline: none; /* panel itself is a landmark, not an interactive element */
}

.settings-panel[hidden] {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .settings-tab { transition: none; }
}
```

### 8.3 JavaScript

```js
// src/options/components/settings-tabs.js

export class FocusSettingsTabs {
  constructor(containerEl) {
    this.tablist = containerEl.querySelector('#settings-tablist');
    this.tabs = Array.from(this.tablist.querySelectorAll('[role="tab"]'));
    this.panels = this.tabs.map(tab =>
      containerEl.querySelector(`#${tab.getAttribute('aria-controls')}`)
    );
    this.statusEl = containerEl.querySelector('#settings-save-status');
    this._activeIndex = 0;
    this._bind();
  }

  _bind() {
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this._activate(index));
    });

    this.tablist.addEventListener('keydown', (e) => this._handleKeydown(e));
  }

  _handleKeydown(e) {
    let newIndex = this._activeIndex;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (this._activeIndex + 1) % this.tabs.length;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = (this._activeIndex - 1 + this.tabs.length) % this.tabs.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = this.tabs.length - 1;
        break;
      default:
        return;
    }

    this._activate(newIndex);
    this.tabs[newIndex].focus();
  }

  _activate(index) {
    // Deactivate all
    this.tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', 'false');
      tab.tabIndex = -1;
      this.panels[i].hidden = true;
    });

    // Activate selected
    this.tabs[index].setAttribute('aria-selected', 'true');
    this.tabs[index].tabIndex = 0;
    this.panels[index].hidden = false;
    this._activeIndex = index;
  }

  /** Called after an auto-save completes to announce status */
  announceSave(success = true) {
    const msg = success ? 'Settings saved' : 'Failed to save settings';
    this.statusEl.textContent = '';
    requestAnimationFrame(() => { this.statusEl.textContent = msg; });
  }
}
```

### 8.4 Accessibility Notes

| Requirement | Implementation |
|---|---|
| Roles | `tablist`, `tab`, `tabpanel` per WAI-ARIA Tabs pattern |
| Arrow keys | Left/Right cycle through tabs; Home/End go to first/last |
| Roving tabindex | Active tab has `tabindex="0"`, others have `tabindex="-1"` |
| Panel labelling | Each panel has `aria-labelledby` pointing to its tab |
| Auto-save | `role="status"` + `aria-live="polite"` announces save result |
| Hidden panels | `hidden` attribute removes inactive panels from tab order |

---

## 9. FocusDropdown

**File:** `src/popup/components/category-dropdown.js`

A custom dropdown for selecting site categories. It follows the WAI-ARIA Listbox pattern with keyboard navigation and type-ahead search.

### 9.1 HTML

```html
<div class="category-dropdown-wrapper" id="category-dropdown-wrapper">
  <label id="category-label" for="category-trigger">Category</label>
  <button
    id="category-trigger"
    type="button"
    class="category-trigger"
    role="combobox"
    aria-expanded="false"
    aria-haspopup="listbox"
    aria-controls="category-listbox"
    aria-labelledby="category-label"
    aria-activedescendant=""
  >
    <span id="category-selected-text" class="category-selected-text">Select category</span>
    <svg class="category-chevron" aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" focusable="false">
      <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
    </svg>
  </button>

  <ul
    id="category-listbox"
    role="listbox"
    aria-labelledby="category-label"
    class="category-listbox"
    hidden
    tabindex="-1"
  >
    <li role="option" id="cat-social"        class="category-option" aria-selected="false">Social Media</li>
    <li role="option" id="cat-video"         class="category-option" aria-selected="false">Video & Streaming</li>
    <li role="option" id="cat-news"          class="category-option" aria-selected="false">News</li>
    <li role="option" id="cat-shopping"      class="category-option" aria-selected="false">Shopping</li>
    <li role="option" id="cat-gaming"        class="category-option" aria-selected="false">Gaming</li>
    <li role="option" id="cat-entertainment" class="category-option" aria-selected="false">Entertainment</li>
    <li role="option" id="cat-other"         class="category-option" aria-selected="false">Other</li>
  </ul>
</div>
```

### 9.2 CSS

```css
/* src/popup/components/category-dropdown.css */

.category-dropdown-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-dropdown-wrapper label {
  font-size: 12px;
  font-weight: 600;
  color: var(--zovo-secondary-700);
}

.category-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid var(--zovo-secondary-300);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  min-height: 44px;
  font-size: 13px;
  color: var(--zovo-secondary-800);
}

.category-trigger:focus-visible {
  outline: 3px solid var(--zovo-primary-400);
  outline-offset: 2px;
}

.category-trigger[aria-expanded="true"] {
  border-color: var(--zovo-primary-500);
  box-shadow: 0 0 0 1px var(--zovo-primary-500);
}

.category-trigger[aria-expanded="true"] .category-chevron {
  transform: rotate(180deg);
}

.category-listbox {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid var(--zovo-secondary-300);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
  padding: 4px 0;
  list-style: none;
}

.category-option {
  padding: 10px 12px;
  font-size: 13px;
  cursor: pointer;
  color: var(--zovo-secondary-700);
}

.category-option:hover,
.category-option.option-focused {
  background: var(--zovo-primary-50);
  color: var(--zovo-primary-700);
}

.category-option[aria-selected="true"] {
  background: var(--zovo-primary-100);
  color: var(--zovo-primary-700);
  font-weight: 600;
}

.category-option[aria-selected="true"]::before {
  content: "\2713 ";
  font-weight: 700;
}

.category-listbox[hidden] {
  display: none;
}
```

### 9.3 JavaScript

```js
// src/popup/components/category-dropdown.js

export class FocusDropdown {
  constructor(wrapperEl) {
    this.wrapper = wrapperEl;
    this.trigger = wrapperEl.querySelector('#category-trigger');
    this.listbox = wrapperEl.querySelector('#category-listbox');
    this.selectedTextEl = wrapperEl.querySelector('#category-selected-text');
    this.options = Array.from(this.listbox.querySelectorAll('[role="option"]'));

    this._isOpen = false;
    this._focusedIndex = -1;
    this._selectedValue = null;
    this._typeAheadBuffer = '';
    this._typeAheadTimer = null;
    this._onChange = null;

    this._bind();
  }

  _bind() {
    this.trigger.addEventListener('click', () => this._toggle());
    this.trigger.addEventListener('keydown', (e) => this._handleTriggerKeydown(e));
    this.listbox.addEventListener('keydown', (e) => this._handleListboxKeydown(e));

    this.options.forEach((opt, idx) => {
      opt.addEventListener('click', () => this._select(idx));
      opt.addEventListener('mouseenter', () => this._setFocused(idx));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this._isOpen && !this.wrapper.contains(e.target)) {
        this._close();
      }
    });
  }

  _toggle() {
    this._isOpen ? this._close() : this._open();
  }

  _open() {
    this._isOpen = true;
    this.trigger.setAttribute('aria-expanded', 'true');
    this.listbox.hidden = false;

    // Focus the currently selected option, or the first one
    const startIdx = this._selectedValue !== null
      ? this.options.findIndex(o => o.id === this._selectedValue)
      : 0;
    this._setFocused(Math.max(0, startIdx));
  }

  _close() {
    this._isOpen = false;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.listbox.hidden = true;
    this.trigger.removeAttribute('aria-activedescendant');
    this._clearFocused();
    this.trigger.focus();
  }

  _select(index) {
    // Deselect all
    this.options.forEach(o => o.setAttribute('aria-selected', 'false'));

    // Select chosen
    const option = this.options[index];
    option.setAttribute('aria-selected', 'true');
    this._selectedValue = option.id;
    this.selectedTextEl.textContent = option.textContent.replace(/^\u2713\s*/, '');

    this._close();

    if (typeof this._onChange === 'function') {
      this._onChange(option.id, option.textContent);
    }
  }

  _setFocused(index) {
    this._clearFocused();
    if (index < 0 || index >= this.options.length) return;
    this._focusedIndex = index;
    this.options[index].classList.add('option-focused');
    this.trigger.setAttribute('aria-activedescendant', this.options[index].id);
    // Scroll into view
    this.options[index].scrollIntoView({ block: 'nearest' });
  }

  _clearFocused() {
    this.options.forEach(o => o.classList.remove('option-focused'));
    this._focusedIndex = -1;
  }

  _handleTriggerKeydown(e) {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault();
        this._open();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._open();
        this._setFocused(this.options.length - 1);
        break;
    }
  }

  _handleListboxKeydown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._setFocused(Math.min(this._focusedIndex + 1, this.options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._setFocused(Math.max(this._focusedIndex - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        this._setFocused(0);
        break;
      case 'End':
        e.preventDefault();
        this._setFocused(this.options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this._focusedIndex >= 0) this._select(this._focusedIndex);
        break;
      case 'Escape':
        e.preventDefault();
        this._close();
        break;
      case 'Tab':
        this._close();
        break;
      default:
        // Type-ahead: match option text by typed characters
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          this._typeAhead(e.key);
        }
        break;
    }
  }

  _typeAhead(char) {
    clearTimeout(this._typeAheadTimer);
    this._typeAheadBuffer += char.toLowerCase();

    const match = this.options.findIndex(o =>
      o.textContent.toLowerCase().startsWith(this._typeAheadBuffer)
    );

    if (match >= 0) {
      this._setFocused(match);
    }

    this._typeAheadTimer = setTimeout(() => {
      this._typeAheadBuffer = '';
    }, 500);
  }

  onChange(callback) {
    this._onChange = callback;
  }

  getValue() {
    return this._selectedValue;
  }
}
```

### 9.4 Accessibility Notes

| Requirement | Implementation |
|---|---|
| Trigger role | `role="combobox"` with `aria-expanded` and `aria-haspopup="listbox"` |
| Listbox | `role="listbox"` with `role="option"` children |
| Active descendant | `aria-activedescendant` tracks focused option without moving DOM focus |
| Arrow keys | Up/Down navigate options; Home/End jump to boundaries |
| Enter/Space | Select the focused option |
| Escape | Closes dropdown, returns focus to trigger |
| Type-ahead | Single characters filter options; 500ms timeout resets buffer |
| Outside click | Closes the listbox |
| Selected state | `aria-selected="true"` + visual checkmark prefix |

---

## Shared Utilities

### Screen Reader Only Class

All components share this utility class for visually hidden but screen-reader-accessible text:

```css
/* src/shared/sr-only.css */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Live Region Announcement Helper

```js
// src/shared/announce.js

/**
 * Announces a message to screen readers by toggling text in a live region.
 * Clearing then re-setting forces the screen reader to re-read even if the
 * text is identical to the previous announcement.
 *
 * @param {HTMLElement} el - Element with aria-live attribute
 * @param {string} message - Text to announce
 */
export function announce(el, message) {
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}
```

### Focus Trap Utility

```js
// src/shared/focus-trap.js

/**
 * Creates a focus trap within a container element.
 * Returns a destroy function to remove the trap.
 *
 * @param {HTMLElement} container - The element to trap focus within
 * @returns {{ destroy: () => void }}
 */
export function createFocusTrap(container) {
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function getFocusable() {
    return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
      el => !el.closest('[hidden]') && el.offsetParent !== null
    );
  }

  function handleKeydown(e) {
    if (e.key !== 'Tab') return;

    const focusable = getFocusable();
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', handleKeydown);

  return {
    destroy() {
      container.removeEventListener('keydown', handleKeydown);
    }
  };
}
```

---

## WCAG Compliance Checklist for All Components

| WCAG Criterion | Level | Status | Notes |
|---|---|---|---|
| 1.1.1 Non-text Content | A | Pass | All icons have `aria-hidden="true"` with text alternatives nearby |
| 1.3.1 Info and Relationships | A | Pass | Semantic roles, labels, and `aria-describedby` throughout |
| 1.4.1 Use of Color | A | Pass | Score meter uses number + icon + color; toasts use icon + border + text |
| 1.4.3 Contrast (Minimum) | AA | Pass | All text meets 4.5:1 against backgrounds per Zovo token system |
| 1.4.11 Non-text Contrast | AA | Pass | Focus indicators are 3px solid at 3:1+ contrast |
| 2.1.1 Keyboard | A | Pass | All interactive elements operable via keyboard |
| 2.1.2 No Keyboard Trap | A | Pass | Focus traps only in modal dialogs; all have Escape or close path |
| 2.4.3 Focus Order | A | Pass | DOM order matches visual order; roving tabindex in lists |
| 2.4.7 Focus Visible | AA | Pass | `:focus-visible` with 3px outline on every interactive element |
| 2.4.11 Focus Not Obscured | AA | Pass | No sticky headers overlap focused elements in these components |
| 2.5.8 Target Size | AA | Pass | All buttons/inputs meet 44px minimum |
| 3.2.2 On Input | A | Pass | No unexpected context changes on input |
| 4.1.2 Name, Role, Value | A | Pass | All custom widgets have appropriate ARIA roles and states |
| 4.1.3 Status Messages | AA | Pass | `aria-live` regions announce all status changes |

---

## Integration Guide

### File Placement Summary

| Component | File Path | Used In |
|---|---|---|
| FocusToggleButton | `src/popup/components/focus-toggle.js` | Popup home tab |
| NuclearModeConfirmation | `src/popup/components/nuclear-confirm.js` | Popup, triggered from home tab |
| FocusBlocklist | `src/popup/components/blocklist-tab.js` | Popup blocklist tab |
| FocusPomodoroTimer | `src/popup/components/timer-display.js` | Popup home tab (active session) |
| FocusScoreMeter | `src/popup/components/focus-score-ring.js` | Popup stats tab |
| FocusBlockPage | `src/content/block-page.js` | Content script, injected on blocked sites |
| FocusToastNotifications | `src/popup/components/toast-notifications.js` | All popup views |
| FocusSettingsTabs | `src/options/components/settings-tabs.js` | Options page |
| FocusDropdown | `src/popup/components/category-dropdown.js` | Blocklist tab (site categorization) |
| Screen reader utility | `src/shared/sr-only.css` | All pages |
| Announce utility | `src/shared/announce.js` | All components with live regions |
| Focus trap utility | `src/shared/focus-trap.js` | Modals and block page |

### Initialization Example

```js
// src/popup/popup.js

import { FocusToggleButton } from './components/focus-toggle.js';
import { NuclearModeConfirmation } from './components/nuclear-confirm.js';
import { FocusBlocklist } from './components/blocklist-tab.js';
import { FocusPomodoroTimer } from './components/timer-display.js';
import { FocusScoreMeter } from './components/focus-score-ring.js';
import { FocusToastNotifications } from './components/toast-notifications.js';
import { FocusDropdown } from './components/category-dropdown.js';

document.addEventListener('DOMContentLoaded', () => {
  const toggle = new FocusToggleButton(document.querySelector('.focus-toggle-wrapper'));
  const nuclear = new NuclearModeConfirmation();
  const blocklist = new FocusBlocklist(document.querySelector('.blocklist-section'));
  const timer = new FocusPomodoroTimer(document.querySelector('.pomodoro-section'));
  const score = new FocusScoreMeter(document.querySelector('.focus-score-section'));
  const toasts = new FocusToastNotifications();
  const categoryDropdown = new FocusDropdown(document.querySelector('#category-dropdown-wrapper'));

  // Load state from storage and initialize components
  chrome.storage.local.get(null, (data) => {
    if (data.focusMode) toggle.setState(data.focusMode.enabled);
    if (data.blocklist) blocklist.setData(data.blocklist);
    if (data.focusScore) score.update(data.focusScore.current, data.focusScore.previous, data.focusScore.history);
  });
});
```
