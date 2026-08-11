import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('public/e2e-core-report.json', 'utf8'));
const failed = (report.tests || []).filter((t) => !t.pass);
const cleanupFailed = (report.cleanup || []).filter((t) => !t.pass);
if (failed.length || cleanupFailed.length) {
  throw new Error(
    `Supabase core E2E failed: tests=[${failed.map((t) => t.name).join(', ')}], cleanup=[${cleanupFailed.map((t) => t.name).join(', ')}]`,
  );
}
console.log(`[core-e2e] all ${report.summary?.passed || 0} checks passed; cleanup clean.`);
