/* ------------------------------------------------------------------
   The logo the pages load.

   Everything about what the artwork is — where its ink starts, which of
   its blobs are dirt, what the two ratios are — lives in logo-art.js.
   This file only decides how big to write it and in what format.

   One file, logo-lockup.png at 4.339:1. The pages crop the descriptor
   line off it with CSS where a row is too narrow to read it, using
   object-fit: cover against a box at the wordmark's own 5.994:1, so
   there is no second file to keep in step with this one.

   Written at 2.5x so it holds up on a retina phone, and as palette PNG
   rather than webp: the artwork is two flat colours on transparency, so
   a palette beats webp on size here by a third, at 256 colours of drift
   nobody can see. The check at the end proves that rather than assuming
   it.

   Run:  npm run logo
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const sharp = require('sharp');
const art = require('./logo-art');

const OUT = 'assets/logo-lockup.png';
const DPR = 2.5;
const CSS_HEIGHT = 50;              /* the largest the bar ever draws it */

(async () => {
  const src = await art.lockup();
  console.log('  ' + src.w + '×' + src.h + ' of ink, ' + src.dirt +
              ' specks dropped (largest ' + src.gap[0] +
              'px, smallest glyph kept ' + src.gap[1] + 'px)');

  const h = Math.round(CSS_HEIGHT * DPR);
  const w = Math.round(h * art.RATIO.lockup);
  const cut = () => art.image(src).resize(w, h, { fit: 'fill', kernel: 'lanczos3' });

  const buf = await cut().png({ palette: true, colours: 256, effort: 10 }).toBuffer();
  fs.writeFileSync(OUT, buf);

  /* what the palette cost, at the size it will be seen. Compared over
     alpha-premultiplied channels, because the colour under a transparent
     pixel is free to be anything at all. */
  const flat = async (input) => {
    const d = await sharp(input)
      .resize(Math.round(CSS_HEIGHT * art.RATIO.lockup), CSS_HEIGHT, { fit: 'fill' })
      .ensureAlpha().raw().toBuffer();
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] / 255;
      d[i] *= a; d[i + 1] *= a; d[i + 2] *= a;
    }
    return d;
  };
  const [a, b] = await Promise.all([flat(await cut().png().toBuffer()), flat(buf)]);
  let sum = 0, max = 0;
  for (let i = 0; i < a.length; i++) {
    const dd = Math.abs(a[i] - b[i]);
    sum += dd; if (dd > max) max = dd;
  }

  console.log('  ' + OUT.padEnd(24) + (w + '×' + h).padEnd(10) +
              'ratio ' + art.RATIO.lockup.toFixed(3) + '   ' +
              (buf.length / 1024).toFixed(1) + ' KB   ' +
              'drift at ' + CSS_HEIGHT + 'px: mean ' + (sum / a.length).toFixed(2) +
              ', worst ' + max + ' of 255');
  console.log('  the CSS crops to the wordmark with boxes of width / ' +
              art.RATIO.wordmark.toFixed(3));
})();
