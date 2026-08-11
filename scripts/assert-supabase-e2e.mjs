import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('public/e2e-report.json', 'utf8'));
const credentials = report.tests?.find((t) => t.name === 'environment credentials');
const catalog = report.tests?.find((t) => t.name === 'catalog public read');
const signup = report.tests?.find((t) => t.name === 'auth public signup');

if (!credentials?.pass || !catalog?.pass) throw new Error('Prerequisite Supabase connectivity failed.');
if (signup?.pass) {
  console.log('[e2e] Signup passed.');
  process.exit(0);
}
const detail = String(signup?.detail || '');
const captcha = /captcha|challenge.*verif|captcha_failed/i.test(detail);
if (!captcha) throw new Error('Signup failure is not CAPTCHA-related.');
console.log('[e2e] Signup failure classified: CAPTCHA protection requires frontend token.');
