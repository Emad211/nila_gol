// Image fetcher with a colourfulness filter: pulls freely-licensed flower
// photos from Wikimedia Commons (reachable from Iran, unlike Unsplash/Pexels),
// scores each candidate's colourfulness (rejecting sepia / B&W / engravings),
// and writes the most vivid one per slot to public/img/<name>.webp.
import fs from 'fs';
import path from 'path';
import https from 'https';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'img');
fs.mkdirSync(outDir, { recursive: true });

const UA = 'NilaGolImageFetcher/1.0 (https://nilagol.ir; contact admin)';

const TARGETS = [
  ['hero', 'pink rose bouquet flowers'],
  ['about', 'pink roses flower bouquet vase'],
  ['rose-red', 'red roses bouquet'],
  ['rose-pink', 'pink roses bouquet'],
  ['rose-white', 'white roses bouquet'],
  ['sunflower', 'sunflower flowers yellow'],
  ['tulip', 'pink tulips flowers'],
  ['mixed', 'colorful flower bouquet roses'],
  ['gallery-1', 'pink peony flower bloom'],
  ['gallery-2', 'pink rose flower close up'],
  ['gallery-3', 'tulip pink flower'],
  ['gallery-4', 'pink dahlia flower'],
  ['collection-rose', 'red roses flowers'],
  ['collection-tulip', 'colorful tulips flowers'],
  ['collection-mixed', 'pink flower bouquet roses'],
];

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
        });
      })
      .on('error', reject);
  });
}

function getBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA } }, (res) => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

// Hasler–Süsstrunk colourfulness on a tiny RGB sample. Sepia/grey ~ <15, vivid >35.
async function colourfulness(buf) {
  const { data } = await sharp(buf).resize(72, 72, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rg = [], yb = [];
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    rg.push(r - g);
    yb.push(0.5 * (r + g) - b);
  }
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const std = (a, m) => Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length);
  const mrg = mean(rg), myb = mean(yb);
  return Math.sqrt(std(rg, mrg) ** 2 + std(yb, myb) ** 2) + 0.3 * Math.sqrt(mrg ** 2 + myb ** 2);
}

async function candidates(query) {
  const api =
    'https://commons.wikimedia.org/w/api.php?format=json&action=query&generator=search' +
    `&gsrsearch=${encodeURIComponent(query + ' filetype:bitmap')}` +
    '&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=400';
  const json = await getJSON(api);
  return Object.values(json?.query?.pages || {})
    .map((p) => p.imageinfo?.[0])
    .filter((i) => i && i.mime === 'image/jpeg' && i.width >= 1000 && i.thumburl)
    .slice(0, 8);
}

const results = [];
const usedFull = new Set();
for (const [name, query] of TARGETS) {
  try {
    const cands = await candidates(query);
    let best = null;
    for (const c of cands) {
      if (usedFull.has(c.url)) continue;
      try {
        const score = await colourfulness(await getBuffer(c.thumburl));
        if (!best || score > best.score) best = { ...c, score };
      } catch { /* skip bad candidate */ }
    }
    if (!best) { results.push(`✗ ${name}: no candidate`); continue; }
    usedFull.add(best.url);
    // download a larger version of the winner and convert to webp
    const bigThumb = best.thumburl.replace('/400px-', '/1100px-');
    let buf;
    try { buf = await getBuffer(bigThumb); } catch { buf = await getBuffer(best.thumburl); }
    const info = await sharp(buf)
      .resize({ width: 1100, height: 1100, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(outDir, `${name}.webp`));
    results.push(`✓ ${name}.webp  colour=${best.score.toFixed(0)}  ${(info.size / 1024).toFixed(0)}KB`);
  } catch (e) {
    results.push(`✗ ${name}: ${e.message}`);
  }
}
console.log(results.join('\n'));
