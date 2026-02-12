#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'public', '_locales');
const SOURCE_LOCALE = 'en';
const TARGET_LOCALES = ['es', 'pt_BR', 'ja', 'de', 'fr'];
const MAX_NAME_LENGTH = 45;
const MAX_DESCRIPTION_LENGTH = 132;

let totalErrors = 0;
let totalWarnings = 0;

function log(type, locale, message) {
  const prefix = type === 'ERROR' ? '\x1b[31mERROR\x1b[0m' :
                 type === 'WARN'  ? '\x1b[33mWARN\x1b[0m'  :
                 type === 'OK'    ? '\x1b[32mOK\x1b[0m'     :
                                    '\x1b[36mINFO\x1b[0m';
  console.log(`  [${prefix}] [${locale}] ${message}`);
  if (type === 'ERROR') totalErrors++;
  if (type === 'WARN') totalWarnings++;
}

function loadMessages(locale) {
  const filePath = path.join(LOCALES_DIR, locale, 'messages.json');
  if (!fs.existsSync(filePath)) {
    log('ERROR', locale, `messages.json not found at ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    log('ERROR', locale, `Invalid JSON: ${e.message}`);
    return null;
  }
}

function extractPlaceholders(message) {
  const matches = message.match(/\$[A-Z_]+\$/g);
  return matches ? matches.sort() : [];
}

function containsHtml(str) {
  return /<[^>]+>/.test(str);
}

function validate() {
  console.log('\n========================================');
  console.log('  i18n Validation Report');
  console.log('========================================\n');

  const sourceMessages = loadMessages(SOURCE_LOCALE);
  if (!sourceMessages) {
    console.log('\nFATAL: Cannot load source messages. Aborting.\n');
    process.exit(1);
  }

  const sourceKeys = Object.keys(sourceMessages);
  console.log(`  Source locale (${SOURCE_LOCALE}): ${sourceKeys.length} keys\n`);

  // Validate source
  console.log(`--- Validating: ${SOURCE_LOCALE} (source) ---`);
  sourceKeys.forEach((key) => {
    const entry = sourceMessages[key];
    if (!entry.description || entry.description.trim() === '') {
      log('WARN', SOURCE_LOCALE, `Key "${key}" has no description`);
    }
    if (containsHtml(entry.message)) {
      log('ERROR', SOURCE_LOCALE, `Key "${key}" contains HTML tags in message`);
    }
    if (key === 'extName' && entry.message.length > MAX_NAME_LENGTH) {
      log('ERROR', SOURCE_LOCALE, `extName is ${entry.message.length} chars (max ${MAX_NAME_LENGTH})`);
    }
    if (key === 'extDescription' && entry.message.length > MAX_DESCRIPTION_LENGTH) {
      log('ERROR', SOURCE_LOCALE, `extDescription is ${entry.message.length} chars (max ${MAX_DESCRIPTION_LENGTH})`);
    }
  });

  // Validate target locales
  TARGET_LOCALES.forEach((locale) => {
    console.log(`\n--- Validating: ${locale} ---`);
    const messages = loadMessages(locale);
    if (!messages) return;

    const localeKeys = Object.keys(messages);

    sourceKeys.forEach((key) => {
      if (!messages[key]) log('ERROR', locale, `Missing key: "${key}"`);
    });

    localeKeys.forEach((key) => {
      if (!sourceMessages[key]) log('WARN', locale, `Extra key: "${key}"`);
    });

    localeKeys.forEach((key) => {
      const entry = messages[key];
      const sourceEntry = sourceMessages[key];
      if (!entry || !sourceEntry) return;

      if (!entry.message || entry.message.trim() === '') {
        log('ERROR', locale, `Key "${key}" has empty message`);
        return;
      }
      if (containsHtml(entry.message)) {
        log('ERROR', locale, `Key "${key}" contains HTML tags`);
      }

      const srcPh = extractPlaceholders(sourceEntry.message);
      const locPh = extractPlaceholders(entry.message);
      if (srcPh.join(',') !== locPh.join(',')) {
        log('ERROR', locale, `Key "${key}" placeholder mismatch. Expected: [${srcPh}], Got: [${locPh}]`);
      }

      if (key === 'extName' && entry.message.length > MAX_NAME_LENGTH) {
        log('ERROR', locale, `extName is ${entry.message.length} chars (max ${MAX_NAME_LENGTH})`);
      }
      if (key === 'extDescription' && entry.message.length > MAX_DESCRIPTION_LENGTH) {
        log('ERROR', locale, `extDescription is ${entry.message.length} chars (max ${MAX_DESCRIPTION_LENGTH})`);
      }
    });
  });

  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================');
  console.log(`  Errors:   ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);
  console.log(`  Status: ${totalErrors === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
  console.log('========================================\n');
  process.exit(totalErrors > 0 ? 1 : 0);
}

validate();
