import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('src/pages/public/LoginPage.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('<button')) {
    console.log(`Line ${i + 1}: ${JSON.stringify(l)}`);
    console.log(`Regex test: ${/<button(\s|>|\/)/.test(l)}`);
  }
});
