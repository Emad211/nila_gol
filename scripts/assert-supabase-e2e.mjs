import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('public/e2e-report.json', 'utf8'));
const required = [
  'environment credentials',
  'catalog public read',
  'auth public signup',
  'auth signup is non-admin',
  'auth password login',
  'is_admin ordinary user',
];

const failed = required.filter((name) => !report.tests?.find((t) => t.name === name && t.pass));
const authCleanup = report.cleanup?.find((c) => c.name === 'auth user');
if (failed.length || !authCleanup?.pass) {
  throw new Error(`Supabase Auth E2E failed: ${failed.join(', ') || 'auth cleanup'}`);
}

console.log('[e2e] Auth stage passed: public signup, login, non-admin safety, catalog connectivity, cleanup.');
