// Runs SQL against the Supabase Management API using a Personal Access Token.
// Token comes from env SUPABASE_ACCESS_TOKEN (never committed). Node 18+ (global fetch).
//
//   node scripts/mgmt-sql.mjs <file.sql>      # run a .sql file
//   node scripts/mgmt-sql.mjs -e "select 1"   # run an inline statement
import { readFileSync } from 'node:fs';

const REF = process.env.SUPA_REF || 'msiowolgbuffddhcdmqw';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('Missing SUPABASE_ACCESS_TOKEN in env.');
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) {
  console.error('usage: node scripts/mgmt-sql.mjs <file.sql | -e "SQL">');
  process.exit(1);
}

const query = arg === '-e' ? process.argv[3] : readFileSync(arg, 'utf8');

const res = await fetch(
  `https://api.supabase.com/v1/projects/${REF}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  },
);

const text = await res.text();
console.log('HTTP', res.status);
console.log(text);
if (!res.ok) process.exit(2);
