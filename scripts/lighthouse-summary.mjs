import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('lighthouse-reports');
const modes = ['mobile', 'desktop'];

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function reportsFor(mode) {
  const dir = path.join(root, mode);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.report.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
}

for (const mode of modes) {
  const reports = reportsFor(mode);
  if (!reports.length) {
    console.log(`[lighthouse-summary] ${mode}: no reports`);
    continue;
  }

  const metric = (getter) => median(reports.map(getter));
  const score = (category) => Math.round(metric((report) => report.categories[category].score) * 100);
  const ms = (audit) => Math.round(metric((report) => report.audits[audit].numericValue));
  const cls = metric((report) => report.audits['cumulative-layout-shift'].numericValue);

  console.log(`\n[lighthouse-summary] ${mode.toUpperCase()}`);
  console.log(`  Performance:    ${score('performance')}`);
  console.log(`  Accessibility:  ${score('accessibility')}`);
  console.log(`  Best Practices: ${score('best-practices')}`);
  console.log(`  SEO:            ${score('seo')}`);
  console.log(`  FCP:            ${ms('first-contentful-paint')} ms`);
  console.log(`  LCP:            ${ms('largest-contentful-paint')} ms`);
  console.log(`  TBT:            ${ms('total-blocking-time')} ms`);
  console.log(`  CLS:            ${cls.toFixed(3)}`);
}
