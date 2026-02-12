#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'public', '_locales');
const SOURCE_LOCALE = 'en';
const TARGET_LOCALES = ['es', 'pt_BR', 'ja', 'de', 'fr'];
const BAR_WIDTH = 30;

function loadMessages(locale) {
  const filePath = path.join(LOCALES_DIR, locale, 'messages.json');
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function makeBar(percent) {
  const filled = Math.round((percent / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const color = percent === 100 ? '\x1b[32m' :
                percent >= 80  ? '\x1b[33m' :
                                 '\x1b[31m';
  return `${color}${'█'.repeat(filled)}${'░'.repeat(empty)}\x1b[0m`;
}

function padRight(str, len) {
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

function padLeft(str, len) {
  return str.length >= len ? str : ' '.repeat(len - str.length) + str;
}

function run() {
  console.log('\n========================================');
  console.log('  i18n Coverage Report');
  console.log('========================================\n');

  const sourceMessages = loadMessages(SOURCE_LOCALE);
  if (!sourceMessages) {
    console.log('  \x1b[31mFATAL\x1b[0m: Cannot load source locale (en/messages.json).\n');
    process.exit(1);
  }

  const sourceKeys = Object.keys(sourceMessages);
  const totalKeys = sourceKeys.length;

  console.log(`  Source locale: ${SOURCE_LOCALE}`);
  console.log(`  Total keys:    ${totalKeys}\n`);

  // Table header
  const header = `  ${padRight('Locale', 10)} ${padLeft('Translated', 12)} ${padLeft('Missing', 10)} ${padLeft('Coverage', 10)}  ${'Progress'}`;
  const separator = '  ' + '-'.repeat(header.length - 2);

  console.log(header);
  console.log(separator);

  let allComplete = true;

  // Source locale row
  console.log(`  ${padRight(SOURCE_LOCALE, 10)} ${padLeft(String(totalKeys), 12)} ${padLeft('0', 10)} ${padLeft('100.0%', 10)}  ${makeBar(100)}`);

  // Target locales
  TARGET_LOCALES.forEach((locale) => {
    const messages = loadMessages(locale);

    if (!messages) {
      console.log(`  ${padRight(locale, 10)} ${padLeft('N/A', 12)} ${padLeft('N/A', 10)} ${padLeft('N/A', 10)}  \x1b[31m(file not found)\x1b[0m`);
      allComplete = false;
      return;
    }

    let translated = 0;
    let missing = 0;

    sourceKeys.forEach((key) => {
      if (messages[key] && messages[key].message && messages[key].message.trim() !== '') {
        translated++;
      } else {
        missing++;
      }
    });

    const percent = totalKeys > 0 ? (translated / totalKeys) * 100 : 0;
    if (percent < 100) allComplete = false;

    console.log(`  ${padRight(locale, 10)} ${padLeft(String(translated), 12)} ${padLeft(String(missing), 10)} ${padLeft(percent.toFixed(1) + '%', 10)}  ${makeBar(percent)}`);
  });

  console.log(separator);
  console.log('');

  if (allComplete) {
    console.log('  \x1b[32mAll locales are at 100% coverage.\x1b[0m\n');
  } else {
    console.log('  \x1b[33mSome locales have incomplete coverage.\x1b[0m\n');

    // Show missing keys per locale
    TARGET_LOCALES.forEach((locale) => {
      const messages = loadMessages(locale);
      if (!messages) return;

      const missingKeys = sourceKeys.filter(
        (key) => !messages[key] || !messages[key].message || messages[key].message.trim() === ''
      );

      if (missingKeys.length > 0) {
        console.log(`  Missing keys in ${locale}:`);
        missingKeys.forEach((key) => {
          console.log(`    - ${key}`);
        });
        console.log('');
      }
    });
  }

  console.log('========================================\n');
  process.exit(allComplete ? 0 : 1);
}

run();
