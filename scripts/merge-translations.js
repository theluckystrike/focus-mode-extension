#!/usr/bin/env node
/**
 * merge-translations.js
 *
 * Merges missing keys from en/messages.json into each locale file.
 * For "component key" duplicates (where the English message is the same as an existing key),
 * it copies the translated message from the existing key.
 * For truly new keys, it provides the translation inline.
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'public', '_locales');
const enFile = path.join(localesDir, 'en', 'messages.json');
const en = JSON.parse(fs.readFileSync(enFile, 'utf-8'));
const enKeys = Object.keys(en);

// For each locale, we define ONLY the translations for keys that have NO duplicate in the existing file.
// Component keys (where English message matches an already-translated key) will be auto-resolved.

const locales = ['es', 'pt_BR', 'ja', 'de', 'fr'];

// Fresh translations for keys that don't have a duplicate already translated
const freshTranslations = {
  es: {
    appName: "Focus Mode",
    appNameFull: "Focus Mode Pro",
    lblModeFocus: "Modo Enfoque",
    lblActive: "Activo",
    lblActiveLC: "activo",
    lblByZovo: "por Zovo",
    lblModeIndefinite: "Hasta que pare",
    lblMinShort: "$MIN$ min",
    lblHoursShort: "$HOURS$ horas",
    lblOn: "ON",
    lblDone: "completado",
    lblCompleted: "completado",
    lblStopped: "Detenida",
    optModeInProgress: "modo - en progreso",
    optModeDuration: "modo - $DURATION$ min",
    optVersion: "Versión",
    optKeyboardShortcut: "Atajo de teclado",
    optWebsite: "Sitio web",
    optSupport: "Soporte",
    optLifetime: "(Vitalicia)",
    optTeam: "(Equipo)",
    notifTakeShortBreak: "¡Buen trabajo! Toma un descanso corto.",
    notifTakeLongBreak: "¡Buen trabajo! Toma un descanso largo.",
    dashFailedLoad: "No se pudo cargar los datos del panel de control",
    dashFocusTimeMinutes: "Tiempo de enfoque (minutos)",
    dashSessionCount: "$COUNT$ sesiones",
    dashSitesBlockedCount: "$COUNT$ sitios bloqueados",
    dashDays: "$COUNT$ días",
    dashExportStats: "Exportar estadísticas",
  },
  pt_BR: {
    appName: "Focus Mode",
    appNameFull: "Focus Mode Pro",
    lblModeFocus: "Modo Foco",
    lblActive: "Ativo",
    lblActiveLC: "ativo",
    lblByZovo: "por Zovo",
    lblModeIndefinite: "Até eu parar",
    lblMinShort: "$MIN$ min",
    lblHoursShort: "$HOURS$ horas",
    lblOn: "ON",
    lblDone: "concluído",
    lblCompleted: "concluído",
    lblStopped: "Interrompida",
    optModeInProgress: "modo - em andamento",
    optModeDuration: "modo - $DURATION$ min",
    optVersion: "Versão",
    optKeyboardShortcut: "Atalho de teclado",
    optWebsite: "Site",
    optSupport: "Suporte",
    optLifetime: "(Vitalícia)",
    optTeam: "(Equipe)",
    notifTakeShortBreak: "Ótimo trabalho! Faça uma pausa curta.",
    notifTakeLongBreak: "Ótimo trabalho! Faça uma pausa longa.",
    dashFailedLoad: "Falha ao carregar os dados do painel",
    dashFocusTimeMinutes: "Tempo de foco (minutos)",
    dashSessionCount: "$COUNT$ sessões",
    dashSitesBlockedCount: "$COUNT$ sites bloqueados",
    dashDays: "$COUNT$ dias",
    dashExportStats: "Exportar estatísticas",
  },
  ja: {
    appName: "Focus Mode",
    appNameFull: "Focus Mode Pro",
    lblModeFocus: "集中モード",
    lblActive: "実行中",
    lblActiveLC: "実行中",
    lblByZovo: "by Zovo",
    lblModeIndefinite: "手動で停止",
    lblMinShort: "$MIN$ 分",
    lblHoursShort: "$HOURS$ 時間",
    lblOn: "ON",
    lblDone: "完了",
    lblCompleted: "完了",
    lblStopped: "停止済み",
    optModeInProgress: "モード - 進行中",
    optModeDuration: "モード - $DURATION$ 分",
    optVersion: "バージョン",
    optKeyboardShortcut: "キーボードショートカット",
    optWebsite: "ウェブサイト",
    optSupport: "サポート",
    optLifetime: "（永久版）",
    optTeam: "（チーム）",
    notifTakeShortBreak: "よく頑張りました！短い休憩を取りましょう。",
    notifTakeLongBreak: "よく頑張りました！長い休憩を取りましょう。",
    dashFailedLoad: "ダッシュボードデータの読み込みに失敗しました",
    dashFocusTimeMinutes: "集中時間（分）",
    dashSessionCount: "$COUNT$ セッション",
    dashSitesBlockedCount: "$COUNT$ サイトブロック",
    dashDays: "$COUNT$ 日",
    dashExportStats: "統計をエクスポート",
  },
  de: {
    appName: "Focus Mode",
    appNameFull: "Focus Mode Pro",
    lblModeFocus: "Fokusmodus",
    lblActive: "Aktiv",
    lblActiveLC: "aktiv",
    lblByZovo: "von Zovo",
    lblModeIndefinite: "Bis ich stoppe",
    lblMinShort: "$MIN$ Min.",
    lblHoursShort: "$HOURS$ Stunden",
    lblOn: "AN",
    lblDone: "erledigt",
    lblCompleted: "abgeschlossen",
    lblStopped: "Gestoppt",
    optModeInProgress: "Modus - läuft",
    optModeDuration: "Modus - $DURATION$ Min.",
    optVersion: "Version",
    optKeyboardShortcut: "Tastenkürzel",
    optWebsite: "Website",
    optSupport: "Support",
    optLifetime: "(Lebenslang)",
    optTeam: "(Team)",
    notifTakeShortBreak: "Gute Arbeit! Machen Sie eine kurze Pause.",
    notifTakeLongBreak: "Gute Arbeit! Machen Sie eine lange Pause.",
    dashFailedLoad: "Dashboard-Daten konnten nicht geladen werden",
    dashFocusTimeMinutes: "Fokuszeit (Minuten)",
    dashSessionCount: "$COUNT$ Sitzungen",
    dashSitesBlockedCount: "$COUNT$ Websites blockiert",
    dashDays: "$COUNT$ Tage",
    dashExportStats: "Statistiken exportieren",
  },
  fr: {
    appName: "Focus Mode",
    appNameFull: "Focus Mode Pro",
    lblModeFocus: "Mode concentration",
    lblActive: "Actif",
    lblActiveLC: "actif",
    lblByZovo: "par Zovo",
    lblModeIndefinite: "Jusqu'à l'arrêt",
    lblMinShort: "$MIN$ min",
    lblHoursShort: "$HOURS$ heures",
    lblOn: "ON",
    lblDone: "terminé",
    lblCompleted: "terminé",
    lblStopped: "Arrêtée",
    optModeInProgress: "mode - en cours",
    optModeDuration: "mode - $DURATION$ min",
    optVersion: "Version",
    optKeyboardShortcut: "Raccourci clavier",
    optWebsite: "Site web",
    optSupport: "Support",
    optLifetime: "(À vie)",
    optTeam: "(Équipe)",
    notifTakeShortBreak: "Excellent travail ! Prenez une courte pause.",
    notifTakeLongBreak: "Excellent travail ! Prenez une longue pause.",
    dashFailedLoad: "Impossible de charger les données du tableau de bord",
    dashFocusTimeMinutes: "Temps de concentration (minutes)",
    dashSessionCount: "$COUNT$ sessions",
    dashSitesBlockedCount: "$COUNT$ sites bloqués",
    dashDays: "$COUNT$ jours",
    dashExportStats: "Exporter les statistiques",
  },
};

function processLocale(locale) {
  const localeFile = path.join(localesDir, locale, 'messages.json');
  const localeData = JSON.parse(fs.readFileSync(localeFile, 'utf-8'));
  const localeKeys = new Set(Object.keys(localeData));

  // Build a reverse lookup: English message -> first locale key that has it translated
  const enMsgToLocaleKey = {};
  for (const key of Object.keys(localeData)) {
    if (en[key]) {
      const enMsg = en[key].message;
      if (!enMsgToLocaleKey[enMsg]) {
        enMsgToLocaleKey[enMsg] = key;
      }
    }
  }

  // Build merged output in English key order
  const merged = {};
  let addedCount = 0;

  for (const key of enKeys) {
    if (localeKeys.has(key)) {
      // Already exists - keep as-is
      merged[key] = localeData[key];
    } else {
      // Missing key - need to add it
      addedCount++;
      const enEntry = en[key];
      const enMsg = enEntry.message;

      // Check if we have a fresh translation for this key
      const fresh = freshTranslations[locale];
      let translatedMsg;

      if (fresh && fresh[key] !== undefined) {
        translatedMsg = fresh[key];
      } else {
        // Check if any existing key has the same English message
        const existingKey = enMsgToLocaleKey[enMsg];
        if (existingKey && localeData[existingKey]) {
          translatedMsg = localeData[existingKey].message;
        } else {
          // Fallback: use English (this shouldn't happen if our mappings are complete)
          console.warn(`  WARNING: No translation found for "${key}" in ${locale}, using English`);
          translatedMsg = enMsg;
        }
      }

      // Build the entry
      const entry = {
        message: translatedMsg,
        description: enEntry.description
      };

      // Copy placeholders if present
      if (enEntry.placeholders) {
        entry.placeholders = enEntry.placeholders;
      }

      merged[key] = entry;
    }
  }

  // Write the merged file
  const output = JSON.stringify(merged, null, 2) + '\n';
  fs.writeFileSync(localeFile, output, 'utf-8');

  console.log(`${locale}: Added ${addedCount} keys. Total: ${Object.keys(merged).length} keys.`);
}

console.log(`English has ${enKeys.length} keys.\n`);

for (const locale of locales) {
  processLocale(locale);
}

console.log('\nDone! All locale files updated.');
