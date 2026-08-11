import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('public/e2e-report.json', 'utf8'));
const credentials = report.tests?.find((t) => t.name === 'environment credentials');
const catalog = report.tests?.find((t) => t.name === 'catalog public read');
const signup = report.tests?.find((t) => t.name === 'auth public signup');

if (!credentials?.pass || !catalog?.pass) {
  throw new Error('Prerequisite Supabase connectivity failed.');
}
if (signup?.pass) {
  console.log('[e2e] Signup unexpectedly passed; no rate-limit diagnosis needed.');
  process.exit(0);
}

const detail = String(signup?.detail || '');
const rateLimited = /rate.?limit|too many|over_email_send_rate_limit|429/i.test(detail);
if (!rateLimited) {
  throw new Error('Signup failure is not an email rate-limit error.');
}
console.log('[e2e] Signup failure classified: email/rate-limit.');
