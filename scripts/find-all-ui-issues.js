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

const GOOGLE_BRAND_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#4285f4', '#34a853', '#fbbc05', '#ea4335'];

const VIOLATIONS = [
  {
    id: 'raw-button',
    name: 'Raw <button> element',
    test: (line) => /<button\b/.test(line),
  },
  {
    id: 'raw-select',
    name: 'Raw <select> element',
    test: (line) => /<select\b/.test(line),
  },
  {
    id: 'raw-checkbox-radio',
    name: 'Raw checkbox/radio input',
    test: (line) => /<input[^>]*type=['"](checkbox|radio)['"]/i.test(line),
  },
  {
    id: 'window-alert-confirm',
    name: 'window.alert / confirm dialog',
    test: (line) => {
      if (line.includes('//') && line.indexOf('//') < line.indexOf('alert')) return false;
      return /(?:window\.)?(?:alert|confirm)\s*\(/i.test(line) && !/console\./.test(line);
    },
  },
  {
    id: 'hex-color',
    name: 'Hardcoded HEX color',
    test: (line) => {
      if (line.includes('//') && line.indexOf('//') < line.indexOf('#')) return false;
      if (line.includes('viewBox') || line.includes('qrcode')) return false;
      if (GOOGLE_BRAND_COLORS.some(c => line.includes(c))) return false;
      return /#[0-9a-fA-F]{3,8}\b/.test(line);
    },
  },
  {
    id: 'rgb-color',
    name: 'Hardcoded rgb/rgba color',
    test: (line) => {
      if (line.includes('var(--')) return false;
      return /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/i.test(line);
    },
  },
  {
    id: 'inline-color-style',
    name: 'Inline color / background styles',
    test: (line) => /style=\{\{[^}]*\b(color|background|backgroundColor|borderColor)\s*:/i.test(line),
  },
  {
    id: 'sub-12px-font',
    name: 'Font size under 12px',
    test: (line) => /text-\[(\d+)px\]/i.test(line) && parseInt(line.match(/text-\[(\d+)px\]/i)[1], 10) < 12,
  },
];

const files = getAllFiles(srcDir);
const report = [];

for (const file of files) {
  if (isExempt(file)) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    for (const rule of VIOLATIONS) {
      if (rule.test(line)) {
        report.push({
          file: path.relative(rootDir, file),
          line: index + 1,
          rule: rule.id,
          snippet: line.trim(),
        });
      }
    }
  });
}

console.log(`Total issues: ${report.length}`);
const counts = {};
report.forEach(r => {
  counts[r.rule] = (counts[r.rule] || 0) + 1;
});
console.log('Breakdown by rule:', counts);

// Group by file
const byFile = {};
report.forEach(r => {
  byFile[r.file] = (byFile[r.file] || []);
  byFile[r.file].push(r);
});

for (const [file, issues] of Object.entries(byFile)) {
  console.log(`\n${file} (${issues.length}):`);
  issues.forEach(i => console.log(`  L${i.line} [${i.rule}] ${i.snippet.slice(0, 80)}`));
}
