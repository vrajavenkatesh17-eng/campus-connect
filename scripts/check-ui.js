#!/usr/bin/env node
/**
 * Campus Connect — UI Consistency Linter (Foundation v2)
 *
 * Enforces:
 * 1. No raw <button> (use AppButton)
 * 2. No raw <select> (use AppSelect)
 * 3. No raw checkbox/radio inputs (use AppCheck / AppSwitch / AppSegmented)
 * 4. No window.alert / window.confirm / alert() / confirm()
 * 5. No hardcoded hex or rgb/rgba colors in JSX
 * 6. No inline color styles (style={{ color, background, ... }})
 * 7. No font sizes under 12px (text-[10px], text-[11px], etc. - minimum 12px)
 *
 * Exemptions:
 * - src/components/app/ (the design system wrappers themselves)
 * - src/components/ui/ (untouched React Bits vendor source files)
 * - src/components/MagicBento/ (untouched vendor source files)
 * - src/index.css (root token definitions)
 * - src/utils/idCardTexture.js (2D HTML5 canvas drawing engine)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

const EXEMPT_DIRS = [
  path.join(srcDir, 'components', 'app'),
  path.join(srcDir, 'components', 'ui'),
  path.join(srcDir, 'components', 'MagicBento'),
  path.join(srcDir, 'components', 'motion'),
];

const EXEMPT_FILES = [
  path.join(srcDir, 'index.css'),
  path.join(srcDir, 'utils', 'idCardTexture.js'),
];

function isExempt(filePath) {
  const norm = path.normalize(filePath);
  for (const dir of EXEMPT_DIRS) {
    if (norm.startsWith(path.normalize(dir))) return true;
  }
  for (const file of EXEMPT_FILES) {
    if (norm === path.normalize(file)) return true;
  }
  return false;
}

function getAllFiles(dir, extensions = ['.jsx', '.js', '.tsx', '.ts', '.css']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, extensions));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// Google official brand icon path colors (strictly exempt for OAuth icon branding)
const GOOGLE_BRAND_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#4285f4', '#34a853', '#fbbc05', '#ea4335'];

const VIOLATIONS = [
  {
    id: 'raw-button',
    name: 'Raw <button> element (use AppButton)',
    // Match raw HTML <button ...> or <button>
    test: (line) => /<button\b/.test(line),
  },
  {
    id: 'raw-select',
    name: 'Raw <select> element (use AppSelect)',
    test: (line) => /<select\b/.test(line),
  },
  {
    id: 'raw-checkbox-radio',
    name: 'Raw checkbox/radio input (use AppCheck / AppSwitch / AppSegmented)',
    test: (line) => /<input[^>]*type=['"](checkbox|radio)['"]/i.test(line),
  },
  {
    id: 'window-alert-confirm',
    name: 'window.alert / confirm dialog (use AppToast / AppHoldButton / Modal)',
    test: (line) => {
      if (line.includes('//') && line.indexOf('//') < line.indexOf('alert')) return false;
      return /(?:window\.)?(?:alert|confirm)\s*\(/i.test(line) && !/console\./.test(line);
    },
  },
  {
    id: 'hex-color',
    name: 'Hardcoded HEX color in JSX/styles (use semantic tokens)',
    test: (line) => {
      // Exclude comments
      if (line.includes('//') && line.indexOf('//') < line.indexOf('#')) return false;
      // Exclude QR code, SVG viewBox, and official Google brand icon paths
      if (line.includes('viewBox') || line.includes('qrcode')) return false;
      if (GOOGLE_BRAND_COLORS.some(c => line.includes(c))) return false;
      return /#[0-9a-fA-F]{3,8}\b/.test(line);
    },
  },
  {
    id: 'rgb-color',
    name: 'Hardcoded rgb/rgba color in JSX/styles (use semantic tokens)',
    test: (line) => {
      if (line.includes('var(--')) return false; // CSS variable rgb(var(--token)) is permitted
      return /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/i.test(line);
    },
  },
  {
    id: 'inline-color-style',
    name: 'Inline color / background styles (use semantic Tailwind tokens)',
    test: (line) => /style=\{\{[^}]*\b(color|background|backgroundColor|borderColor)\s*:/i.test(line),
  },
  {
    id: 'sub-12px-font',
    name: 'Font size under 12px (text-[10px], text-[11px], etc. - minimum 12px)',
    test: (line) => /text-\[(\d+)px\]/i.test(line) && parseInt(line.match(/text-\[(\d+)px\]/i)[1], 10) < 12,
  },
  {
    id: 'animation-css-outside-motion',
    name: '@keyframes animation CSS outside src/components/motion/',
    test: (line) => /@keyframes\b/.test(line),
  },
  {
    id: 'purged-wine-palette',
    name: 'Purged Wine/Burgundy/Rose color or keyword (S-T RETHEME: use Navy & Gold tokens)',
    test: (line) => {
      const purgedHex = /#(7A1230|5F0E26|F6E9EC|D45B7A|C95D78|DB7A92|E6788F|2A1519|2B141B)\b/i;
      const purgedWords = /\b(wine|burgundy|rose)\b/i;
      return purgedHex.test(line) || purgedWords.test(line);
    },
  },
];

const files = getAllFiles(srcDir);
let totalViolations = 0;
const report = [];

for (const file of files) {
  if (isExempt(file)) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    for (const rule of VIOLATIONS) {
      if (rule.test(line, content)) {
        totalViolations++;
        report.push({
          file: path.relative(rootDir, file),
          line: index + 1,
          rule: rule.id,
          name: rule.name,
          snippet: line.trim(),
        });
      }
    }
  });
}

if (totalViolations > 0) {
  console.error(`\n❌ [check:ui] Found ${totalViolations} UI consistency violation(s):\n`);
  for (const r of report) {
    console.error(`  ${r.file}:${r.line} [${r.rule}] ${r.name}`);
    console.error(`    > ${r.snippet.slice(0, 100)}\n`);
  }
  process.exit(1);
} else {
  console.log('\n✅ [check:ui] Zero violations! All components comply with UI_RULES & DESIGN_SPEC v2.\n');
  process.exit(0);
}
