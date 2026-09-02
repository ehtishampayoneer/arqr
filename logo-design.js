/* ------------------------------------------------------------------
   ARQR360 — the logotype and the mark.

   Two attempts at drawing the letters by hand came out looking homemade,
   and that is the honest reason: letterform design is its own craft and
   an SVG path written by hand does not have it. So the wordmark is set
   in Archivo, which is not a shortcut but the correct answer twice over.
   It is a properly drawn typeface, and it is already the face every
   headline on this site is set in, so the logo now belongs to the same
   system as the page it sits on instead of arriving from somewhere else.

   Archivo is SIL Open Font License 1.1, which permits commercial use in
   a logo. The three weights and the licence are in build-fonts/, and the
   glyphs are converted to outlines here, so nothing at runtime depends
   on a font being available and the shapes cannot reflow.

   Set, not typed. The tracking is tightened, the 360 is a lighter weight
   of the same face on the same baseline rather than an orange badge
   floating at the cap line, and there is exactly one accent in the whole
   lockup: the mark.

   Everything is measured against a 100-unit cap height.
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const INK = '#1C1917';
const ACCENT = '#E0682A';
const PAPER = '#FDFBF7';

const CAP = 100;
/* Archivo's capitals are 686 of its 1000 em, so this is the size that
   makes them exactly 100 units tall */
const SIZE = 1000 / 686 * CAP;
/* a logotype is always tighter than running text */
const TRACK = -0.022 * CAP;
/* the suffix: same face, lighter weight, two thirds the height, and the
   same baseline. A version number, not a second logo. */
const SUF_CAP = 60;
const SUF_GAP = 0.13 * CAP;

const FONT = {};
const load = (w) => (FONT[w] = FONT[w] ||
  opentype.parse(fs.readFileSync(path.join(__dirname, 'build-fonts', 'Archivo-' + w + '.ttf')).buffer));

/* opentype's shaper trips over Archivo's ccmp table, and a logotype wants
   its glyphs placed by hand anyway, so they are fetched one at a time */
function setText(text, weight, cap, x0, baseline, track) {
  const font = load(weight);
  const size = 1000 / 686 * cap;
  const d = [];
  let x = x0;
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    d.push(g.getPath(x, baseline, size).toPathData(1));
    x += g.advanceWidth / 1000 * size + track;
  }
  return { d: d.join(''), w: x - track - x0 };
}

/* ---------------------------------------------------------------- marks */
/* Both are solid. The last mark was monoline next to a wordmark that was
   not, and the mismatch is most of why it read as an icon borrowed from
   somewhere rather than part of the logo. */
const MARKS = {
  /* The cube: what the customer is actually placing in their room. Three
     faces, the top one in the accent, no interior lines to close up at
     small sizes. */
  cube: (S) => {
    const cx = S / 2, cy = S / 2, r = S * 0.47, h = r / 2;
    const P = (a, b) => a.toFixed(1) + ',' + b.toFixed(1);
    return {
      ink: 'M' + P(cx - r, cy - h) + 'L' + P(cx, cy) + 'L' + P(cx, cy + r) +
           'L' + P(cx - r, cy + h) + 'Z' +
           'M' + P(cx + r, cy - h) + 'L' + P(cx + r, cy + h) + 'L' + P(cx, cy + r) +
           'L' + P(cx, cy) + 'Z',
      hot: 'M' + P(cx, cy - r) + 'L' + P(cx + r, cy - h) + 'L' + P(cx, cy) +
           'L' + P(cx - r, cy - h) + 'Z'
    };
  },

  /* The corner of a QR code, which is the thing a customer actually
     points a camera at, and the QR the name is half made of. A ring and
     a pip, nothing else: it is still legible as a 16px square. */
  code: (S) => {
    const o = S * 0.06, t = S * 0.155, r1 = S * 0.24, r2 = S * 0.12;
    const box = (x, y, w, h, rr) =>
      'M' + (x + rr).toFixed(1) + ',' + y.toFixed(1) +
      'H' + (x + w - rr).toFixed(1) + 'A' + rr.toFixed(1) + ',' + rr.toFixed(1) +
      ' 0 0 1 ' + (x + w).toFixed(1) + ',' + (y + rr).toFixed(1) +
      'V' + (y + h - rr).toFixed(1) + 'A' + rr.toFixed(1) + ',' + rr.toFixed(1) +
      ' 0 0 1 ' + (x + w - rr).toFixed(1) + ',' + (y + h).toFixed(1) +
      'H' + (x + rr).toFixed(1) + 'A' + rr.toFixed(1) + ',' + rr.toFixed(1) +
      ' 0 0 1 ' + x.toFixed(1) + ',' + (y + h - rr).toFixed(1) +
      'V' + (y + rr).toFixed(1) + 'A' + rr.toFixed(1) + ',' + rr.toFixed(1) +
      ' 0 0 1 ' + (x + rr).toFixed(1) + ',' + y.toFixed(1) + 'Z';
    const side = S - o * 2;
    return {
      /* one path, two rings, even-odd: the ring is the hole between them */
      ink: box(o, o, side, side, r1) + box(o + t, o + t, side - t * 2, side - t * 2, r1 - t),
      hot: box(S * 0.325, S * 0.325, S * 0.35, S * 0.35, r2)
    };
  }
};

const MARK_S = 104;          /* square, a little over the cap height */
const MARK_GAP = 26;

/* ---------------------------------------------------------------- build */
function lockup({ mark = 'code', ink = INK, hot = ACCENT, suffix = true, withMark = true } = {}) {
  /* the Q drops 19 below the baseline at this size, and that is the only
     thing under it, so the box is the capitals plus that */
  const DROP = 19;
  const top = Math.max(0, (MARK_S - CAP - DROP) / 2);
  const base = top + CAP;
  const h = Math.max(MARK_S, CAP + DROP);

  const parts = [];
  let x = 0;
  if (withMark) {
    const m = MARKS[mark](MARK_S);
    parts.push('<g transform="translate(0,' + ((h - MARK_S) / 2).toFixed(1) + ')">' +
      '<path d="' + m.ink + '" fill="' + ink + '" fill-rule="evenodd"/>' +
      '<path d="' + m.hot + '" fill="' + hot + '"/></g>');
    x = MARK_S + MARK_GAP;
  }

  const word = setText('ARQR', 700, CAP, x, base, TRACK);
  parts.push('<path d="' + word.d + '" fill="' + ink + '"/>');
  x += word.w;

  if (suffix) {
    const suf = setText('360', 500, SUF_CAP, x + SUF_GAP, base, TRACK * SUF_CAP / CAP);
    parts.push('<path d="' + suf.d + '" fill="' + ink + '" fill-opacity="0.45"/>');
    x += SUF_GAP + suf.w;
  }

  const w = Math.round(x);
  return {
    w, h: Math.round(h), ratio: w / h, mark,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + Math.round(h) + '" ' +
      'width="' + w + '" height="' + Math.round(h) + '">' + parts.join('') + '</svg>'
  };
}

/* the mark on its own, square, for the compact bar */
function markOnly({ mark = 'code', ink = INK, hot = ACCENT } = {}) {
  const m = MARKS[mark](MARK_S);
  return {
    w: MARK_S, h: MARK_S, ratio: 1,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + MARK_S + ' ' + MARK_S + '" ' +
      'width="' + MARK_S + '" height="' + MARK_S + '">' +
      '<path d="' + m.ink + '" fill="' + ink + '" fill-rule="evenodd"/>' +
      '<path d="' + m.hot + '" fill="' + hot + '"/></svg>'
  };
}

/* the app icon: the mark on a tile */
function tile({ mark = 'code', size = 512, bg = INK, ink = PAPER, hot = ACCENT, pad = 0.2 } = {}) {
  const inner = size * (1 - pad * 2);
  const s = inner / MARK_S;
  const m = MARKS[mark](MARK_S);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" ' +
    'viewBox="0 0 ' + size + ' ' + size + '">' +
    '<rect width="' + size + '" height="' + size + '" rx="' + (size * 0.22).toFixed(1) +
    '" fill="' + bg + '"/>' +
    '<g transform="translate(' + ((size - inner) / 2).toFixed(2) + ',' +
    ((size - inner) / 2).toFixed(2) + ') scale(' + s.toFixed(4) + ')">' +
    '<path d="' + m.ink + '" fill="' + ink + '" fill-rule="evenodd"/>' +
    '<path d="' + m.hot + '" fill="' + hot + '"/></g></svg>';
}

module.exports = { INK, ACCENT, PAPER, CAP, MARK_S, MARKS, lockup, markOnly, tile };
