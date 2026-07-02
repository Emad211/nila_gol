// One-off asset optimizer: makes WebP versions of the heavy photos and
// generates PWA icons from the logo. Run with: node scripts/optimize-assets.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'src', 'assets');
const pub = path.join(root, 'public');
fs.mkdirSync(pub, { recursive: true });

const photos = [
  { in: 'hero.png', w: 1600 },
  { in: 'feature.png', w: 1600 },
  { in: 'contact.png', w: 1600 },
  { in: 'logo.png', w: 512 },
];

for (const p of photos) {
  const src = path.join(assets, p.in);
  const out = path.join(assets, p.in.replace('.png', '.webp'));
  await sharp(src).resize({ width: p.w, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
  const before = fs.statSync(src).size;
  const after = fs.statSync(out).size;
  console.log(`${p.in} -> ${path.basename(out)}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
}

const BG = { r: 247, g: 243, b: 238, alpha: 1 };
const logo = path.join(assets, 'logo.png');

async function icon(size, file, pad = 0) {
  const inner = Math.round(size * (1 - pad));
  const resized = await sharp(logo)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toFile(path.join(pub, file));
  console.log('icon', file);
}

await icon(192, 'pwa-192.png');
await icon(512, 'pwa-512.png');
await icon(512, 'maskable-512.png', 0.22);
await icon(180, 'apple-touch-icon.png');

console.log('done');
