import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('public/e2e-report.json', 'utf8'));
const required = ['environment credentials', 'catalog public read', 'auth public signup'];
const failed = required.filter((name) => !report.tests?.find((t) => t.name === name && t.pass));
if (failed.length) {
  throw new Error(`Supabase signup E2E failed: ${failed.join(', ')}`);
}
console.log('[e2e] Credential + catalog + public signup stages passed.');
