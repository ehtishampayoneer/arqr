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

   Stacked, not horizontal. The artwork is three rows: the AR monogram
   (680x364), the ARQR 360 wordmark (854x101) and the tagline (733x29),
   1.47:1 all together. A header bar is 78px tall. Used whole at 52px the
   wordmark row would be 9px and the tagline 2.6px, which is not small
   type, it is a smudge. So the bar gets a horizontal lockup built from
   the client's own two elements at their own proportions, side by side
   and balanced by height rather than stacked. The stacked original is
   kept whole for the share card, where 200px of height is available and
   the tagline can be read.

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

/* how the horizontal lockup is balanced. The wordmark is set to 40% of
   the monogram's height, which is what makes its capitals read at about
   half the monogram, and the gap is a quarter of the monogram. */
const WORD_H = 0.40;
const GAP = 0.26;

const DPR = 2.5;
const BAR_H = 52;            /* the tallest the header ever draws it */

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

  /* ---- the header lockup: monogram and wordmark, side by side ---- */
  const H = Math.round(BAR_H * DPR);
  const mw = Math.round(H * ratio(BANDS.mono));
  const wh = Math.round(H * WORD_H);
  const ww = Math.round(wh * ratio(BANDS.word));
  const gap = Math.round(H * GAP);

  const mono = await (await knockout(BANDS.mono)).resize(mw, H).png().toBuffer();
  const word = await (await knockout(BANDS.word)).resize(ww, wh).png().toBuffer();

  await write('assets/logo-bar.png', sharp({
    create: { width: mw + gap + ww, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite([
    { input: mono, left: 0, top: 0 },
    /* the wordmark is centred on the monogram, not sat on its baseline:
       the monogram has no baseline to sit on */
    { input: word, left: mw + gap, top: Math.round((H - wh) / 2) }
  ]));

  /* ---- the monogram alone, for a scrolled phone bar and the icon ---- */
  const mh = Math.round(46 * DPR);
  await write('assets/logo-mono.png',
    (await knockout(BANDS.mono)).resize(Math.round(mh * ratio(BANDS.mono)), mh));

  /* ---- the client's own stacked lockup, whole, for the share card ---- */
  const sh = 260;
  await write('assets/logo-stack.png',
    (await knockout(BANDS.all)).resize(Math.round(sh * ratio(BANDS.all)), sh));

  out.forEach(([f, d, k]) => console.log('  ' + f.padEnd(24) + d.padEnd(12) + k));
  console.log('');
  console.log('  ratios   bar ' + ((mw + gap + ww) / H).toFixed(3) +
              '   monogram ' + ratio(BANDS.mono).toFixed(3) +
              '   stacked ' + ratio(BANDS.all).toFixed(3));
  console.log('  at a ' + BAR_H + 'px bar the wordmark row is ' +
              (BAR_H * WORD_H).toFixed(1) + 'px tall, against ' +
              (BAR_H * BANDS.word.height / BANDS.all.height).toFixed(1) +
              'px if the artwork were used stacked');
})();
