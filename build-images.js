/* ------------------------------------------------------------------
   Every PNG in assets/ gets a WebP twin beside it.  The PNGs stay put
   as the originals — drop a replacement in, run this, and the page
   picks up the new art.

   Run:  npm run images
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = 'assets';
const MAX = 1500;      /* nothing on the page is displayed wider than this */
const Q = 80;

const kb = n => (n / 1024).toFixed(0).padStart(5) + ' KB';

(async () => {
  const pngs = fs.readdirSync(DIR).filter(f => /\.png$/i.test(f)).sort();
  let before = 0, after = 0;

  for (const file of pngs) {
    const src = path.join(DIR, file);
    const out = path.join(DIR, file.replace(/\.png$/i, '.webp'));
    const meta = await sharp(src).metadata();

    await sharp(src)
      .resize({ width: Math.min(meta.width, MAX), withoutEnlargement: true })
      .webp({ quality: Q, effort: 6 })
      .toFile(out);

    const a = fs.statSync(src).size, b = fs.statSync(out).size;
    before += a; after += b;
    console.log('  ' + file.padEnd(22) + kb(a) + '  ->' + kb(b) +
                '   (' + (100 - Math.round(b / a * 100)) + '% smaller)');
  }

  console.log('\n  ' + pngs.length + ' images   ' + kb(before) + '  ->' + kb(after) +
              '   (' + (100 - Math.round(after / before * 100)) + '% smaller overall)');
})().catch(e => { console.error(e); process.exit(1); });
