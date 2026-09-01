/* What the logo artwork actually is, in one place.

   assets/Logo.png is the file the designer handed over and is never
   written to. Two things about it have to be handled before anything
   uses it, and both are handled here so the header, the favicon, the
   touch icon and the share cards cannot disagree about them.

   1. Margins. The ink starts 49px in from the left and 41px down, and
      the four sides are not equal. A browser cannot see transparent
      padding, so left as it is the logo looks small and sits off centre
      because the file is doing the spacing instead of the CSS.

   2. Dirt. The artwork carries 59 loose specks, most of them at full
      opacity, the largest 35px. They are invisible on the site because
      they are small black dots on a cream page at a fifth of their
      original size, but knocked out white on a dark share card they read
      as grime along the letterforms. Component sizes jump from 35px to
      96px, which is the smallest letter of the descriptor line, so a cut
      at 60 removes every speck and no part of any glyph. That gap is
      asserted rather than assumed.

   The A is the other thing worth knowing. It is the only glyph with a
   shape of its own and it carries the orange triangle, so it is what an
   icon is cut from. A rectangle cannot separate it: the R starts at
   x=279 while the A's right stroke runs to x=320. Its three parts are
   picked out by label instead.

   Nothing here writes a file. Requiring it costs one decode of a 113 KB
   png and a flood fill.
   ------------------------------------------------------------------ */
'use strict';
const sharp = require('sharp');

const SRC = 'assets/Logo.png';

/* all measured from the alpha channel, none of them guessed */
const LOCKUP = { left: 49, top: 41, width: 1037, height: 239 };
const WORDMARK_ROWS = 173;          /* of the lockup's 239 */
const BAND = { top: 41, bottom: 213 };
const R_STARTS = 279;
const SPECK = 60;                   /* dirt tops out at 35, glyphs start at 96 */

/* the two ratios the CSS uses, so they are written down once */
const RATIO = {
  lockup: LOCKUP.width / LOCKUP.height,        /* 4.339 */
  wordmark: LOCKUP.width / WORDMARK_ROWS       /* 5.994 */
};

let cached = null;

/* Flood fill the whole lockup once. Returns the label map, the source
   pixels, and a record of every blob with its size and bounding box. */
async function scan() {
  if (cached) return cached;
  const { data, info } = await sharp(SRC).ensureAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const x1 = LOCKUP.left + LOCKUP.width - 1, y1 = LOCKUP.top + LOCKUP.height - 1;
  const inside = (x, y) => x >= LOCKUP.left && x <= x1 && y >= LOCKUP.top && y <= y1;
  const lit = (x, y) => inside(x, y) && data[(y * w + x) * 4 + 3] > 8;

  const label = new Int32Array(w * h).fill(-1);
  const blobs = [];

  for (let y = LOCKUP.top; y <= y1; y++) {
    for (let x = LOCKUP.left; x <= x1; x++) {
      if (!lit(x, y) || label[y * w + x] !== -1) continue;
      const id = blobs.length;
      const stack = [[x, y]];
      label[y * w + x] = id;
      const b = { id, px: 0, x0: w, x1: -1, y0: h, y1: -1 };
      while (stack.length) {
        const [a, c] = stack.pop();
        b.px++;
        if (a < b.x0) b.x0 = a; if (a > b.x1) b.x1 = a;
        if (c < b.y0) b.y0 = c; if (c > b.y1) b.y1 = c;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const p = a + dx, q = c + dy;
          if (lit(p, q) && label[q * w + p] === -1) { label[q * w + p] = id; stack.push([p, q]); }
        }
      }
      blobs.push(b);
    }
  }

  /* the cut has to fall in a gap, not through the middle of a run */
  const under = blobs.filter((b) => b.px < SPECK).map((b) => b.px);
  const over = blobs.filter((b) => b.px >= SPECK).map((b) => b.px);
  const top = Math.max(...under), bottom = Math.min(...over);
  if (bottom < top * 2) {
    throw new Error('no clear gap between dirt (' + top + 'px) and glyphs (' + bottom + 'px)');
  }

  cached = { data, w, h, label, blobs, dirt: under.length, gap: [top, bottom] };
  return cached;
}

/* Copy the pixels of the given blobs into a tight RGBA buffer. */
function cut(s, keep) {
  const ids = new Set(keep.map((b) => b.id));
  const x0 = Math.min(...keep.map((b) => b.x0)), x1 = Math.max(...keep.map((b) => b.x1));
  const y0 = Math.min(...keep.map((b) => b.y0)), y1 = Math.max(...keep.map((b) => b.y1));
  const W = x1 - x0 + 1, H = y1 - y0 + 1;
  const out = Buffer.alloc(W * H * 4);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!ids.has(s.label[y * s.w + x])) continue;
    const a = (y * s.w + x) * 4, b = ((y - y0) * W + (x - x0)) * 4;
    out[b] = s.data[a]; out[b + 1] = s.data[a + 1];
    out[b + 2] = s.data[a + 2]; out[b + 3] = s.data[a + 3];
  }
  return { d: out, w: W, h: H };
}

/* the whole lockup, trimmed and de-specked */
async function lockup() {
  const s = await scan();
  return { ...cut(s, s.blobs.filter((b) => b.px >= SPECK)), dirt: s.dirt, gap: s.gap };
}

/* the A on its own: two strokes and the triangle, nothing else */
async function letterA() {
  const s = await scan();
  const keep = s.blobs.filter((b) =>
    b.px >= 500 && b.x0 < R_STARTS && b.y0 >= BAND.top && b.y1 <= BAND.bottom);
  if (keep.length !== 3) {
    throw new Error('expected the two strokes and the triangle, found ' + keep.length);
  }
  return { ...cut(s, keep), parts: keep.map((b) => b.px).sort((a, b) => b - a) };
}

/* an RGBA buffer, wrapped so sharp will take it */
const image = (px) => sharp(Buffer.from(px.d), {
  raw: { width: px.w, height: px.h, channels: 4 }
});

/* Black to `light`, orange left alone, alpha untouched. The ordinary way
   a one-colour logo is put on a dark ground; done off the alpha channel
   so the antialiasing survives it. */
function reverse(px, light) {
  const d = Buffer.from(px.d);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0 || (d[i] > 120 && d[i] - d[i + 2] > 50)) continue;
    d[i] = light[0]; d[i + 1] = light[1]; d[i + 2] = light[2];
  }
  return { d, w: px.w, h: px.h };
}

module.exports = { SRC, LOCKUP, RATIO, lockup, letterA, image, reverse };
