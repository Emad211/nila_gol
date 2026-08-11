import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('public/e2e-report.json', 'utf8'));
const failed = Number(report?.summary?.failed ?? report?.tests?.filter((t) => !t.pass)?.length ?? 999);
const cleanupFailed = Number(report?.summary?.cleanup_failed ?? report?.cleanup?.filter((t) => !t.pass)?.length ?? 999);

if (failed !== 0 || cleanupFailed !== 0) {
  const names = (report.tests || []).filter((t) => !t.pass).map((t) => t.name).join(', ');
  throw new Error(`Supabase E2E failed: tests=${failed}, cleanup=${cleanupFailed}${names ? ` [${names}]` : ''}`);
}

console.log(`[e2e] all ${report.summary.passed} Supabase production checks passed; cleanup clean.`);
