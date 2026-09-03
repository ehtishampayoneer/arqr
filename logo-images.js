/* ------------------------------------------------------------------
   The logo the pages load, cut from logo.png.

   logo.png is the client's artwork and is never written to. Two things
   about it have to be dealt with before a page can use it.

   White, not transparent. It is a 1254 square of flat white with the
   logo sitting in the middle of it, and the page it goes on is cream, so
   dropped in as-is it is a white card floating on the header. The white
   is removed by unpremultiplying: a pixel is the artwork laid over white
   at some coverage, so the coverage is what the darkest channel gives up
   (255 - min) and the colour is what is left once the white is taken
   back out. That keeps the orange exactly orange and the antialiasing
   intact, which a plain "make white transparent" does not.

   Stacked is how the logo is, so stacked is how it goes in. The artwork
   is three rows: the AR monogram (680x364), the ARQR 360 wordmark
   (854x101) and the tagline (733x29), 1.47:1 all together, and it is
   used whole and unaltered everywhere except one place.

   That shape decides the header. A 1.47:1 logo is only 111px wide at
   76px tall, so the bar grows in height rather than in width: 100px
   instead of 78. It also means the row has 170px more than it did, which
   is why "Get your catalog" comes back to a phone bar in this change and
   the samples button gets its full label back.

   The exception is a scrolled phone bar, where the samples button
   arrives and the whole lockup will not fit. That falls back to the AR
   monogram alone, which is also what every square icon is cut from.

   Run:  npm run logo
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const sharp = require('sharp');

const SRC = 'logo.png';

/* measured from the artwork, not guessed: see the band report in the
   commit that introduced this file */
const BANDS = {
  mono: { left: 267, top: 325, width: 680, height: 364 },   /* the AR monogram */
  word: { left: 195, top: 752, width: 854, height: 101 },   /* ARQR 360        */
  all:  { left: 195, top: 325, width: 854, height: 583 }    /* the lot         */
};

/* The lockup is written once, at the size the share card wants, which is
   larger than any bar draws it. One file, so the bar, the footer and the
   card cannot come apart. */
const LOCKUP_H = 260;
const MONO_H = 115;          /* 46px on a phone, at 2.5x */

/* Below this the artwork is the paper it was drawn on, not the logo.
   The corners of the file sit at 253-254 rather than a clean 255, so
   without a floor the whole square keeps a faint haze of alpha. */
const FLOOR = 0.05;

/* white out, alpha in */
async function knockout(box) {
  const { data, info } = await sharp(SRC).extract(box).ensureAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    const a = 1 - min / 255;
    if (a <= FLOOR) { data[i + 3] = 0; continue; }
    for (let c = 0; c < 3; c++) {
      const v = (data[i + c] - 255 * (1 - a)) / a;
      data[i + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
    }
    data[i + 3] = Math.round(a * 255);
  }
  return sharp(Buffer.from(data), { raw: { width: info.width, height: info.height, channels: 4 } });
}

const ratio = (b) => b.width / b.height;

(async () => {
  const out = [];
  const write = async (file, img) => {
    const buf = await img.png({ palette: true, colours: 256, effort: 10 }).toBuffer();
    fs.writeFileSync(file, buf);
    const m = await sharp(buf).metadata();
    out.push([file, m.width + '×' + m.height, (buf.length / 1024).toFixed(1) + ' KB']);
  };

  /* ---- the lockup, whole and unaltered: bar, footer, share card ---- */
  await write('assets/logo-bar.png',
    (await knockout(BANDS.all)).resize(Math.round(LOCKUP_H * ratio(BANDS.all)), LOCKUP_H));

  /* ---- the monogram alone: a scrolled phone bar, and every icon ---- */
  await write('assets/logo-mono.png',
    (await knockout(BANDS.mono)).resize(Math.round(MONO_H * ratio(BANDS.mono)), MONO_H));

  out.forEach(([f, d, k]) => console.log('  ' + f.padEnd(24) + d.padEnd(12) + k));
  console.log('');
  console.log('  lockup ' + ratio(BANDS.all).toFixed(3) + ':1, monogram ' +
              ratio(BANDS.mono).toFixed(3) + ':1');
  for (const h of [76, 70, 60, 54, 50]) {
    console.log('    at ' + h + 'px tall: ' + Math.round(h * ratio(BANDS.all)) +
                'px wide, wordmark row ' + (h * BANDS.word.height / BANDS.all.height).toFixed(1) +
                'px, tagline ' + (h * 29 / BANDS.all.height).toFixed(1) + 'px');
  }
})();
