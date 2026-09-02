/* ------------------------------------------------------------------
   The ARQR360 logo, drawn rather than photographed.

   Every problem the supplied artwork had came from it being a raster:
   ragged letter edges, 59 specks of dirt baked in, a fixed 4.34:1 that
   made the bar give up a button to fit it, and a favicon that had to be
   cut out of a wordmark with a flood fill. None of that was a design
   problem. It was the file format.

   So the letters are geometry here. Straight lines and 45-degree
   chamfers on one 100-unit cap height, which is what the supplied mark
   was reaching for, and what the subject deserves: nothing in an AR
   catalog is a curve pretending to be handmade.

   Two things carry over from the artwork the client already chose,
   because they are the two anyone would remember about it: the A is an
   open chevron with an orange triangle standing in it, and the Q is cut
   by an orange diagonal. Everything else is redrawn.

   Why it is narrower than what it replaces. The old wordmark was 5.99:1,
   so in the 200px the bar can spare its capitals stood 33px tall. These
   are 4.10:1 without the 360 and 4.63 with it, which is 49px and 43px of
   capital in the same 200. That is the whole of the size complaint: not
   the logo, the proportion.

   Nothing here is padded. The artwork's own edges are the box and the
   CSS does the spacing, which is the other half of why it is redrawn.
   ------------------------------------------------------------------ */
'use strict';

const INK = '#1C1917';
const ACCENT = '#E0682A';
const PAPER = '#FDFBF7';

/* one cap height, and every number below measured against it */
const CAP = 100;
const STEM = 26;
const GAP = 16;

const poly = (pts) => pts.map((p) => p.join(',')).join(' ');

/* ---------------------------------------------------------------- A */
/* An open chevron rather than a crossbarred A, which is what makes room
   for the triangle: a solid triangular A inset by a 26 stem leaves a
   counter 8 units across, because the incircle of a 96 by 100 triangle
   is only 30 in the first place. The chevron gives the orange something
   to stand in, and gives the icon a shape at 16px. */
const A = {
  w: 96,
  /* the apex is cut flat by 9 rather than brought to a point: the rest of
     the family is chamfered, and a true point is the first thing to go
     soft when this is drawn at 20px */
  ink: [[[43.5, 0], [52.5, 0], [96, 100], [70, 100], [48, 48], [26, 100], [0, 100]]],
  hot: [[[48, 56], [67, 100], [29, 100]]]
};

/* ---------------------------------------------------------------- R */
/* Stem, chamfered bowl, and a leg leaving the bowl at its corner rather
   than its middle, so the counter stays open when this is 20px tall. */
const R = {
  w: 86,
  ink: [[[0, 0], [26, 0], [26, 100], [0, 100]],
        [[26, 0], [62, 0], [86, 22], [86, 40], [62, 62], [26, 62]],
        [[26, 20], [58, 20], [64, 27], [64, 35], [58, 42], [26, 42]],
        [[46, 62], [72, 62], [88, 100], [62, 100]]],
  hot: []
};

/* ---------------------------------------------------------------- Q */
/* A chamfered ring cut corner to corner. The cut starting inside the
   counter and finishing outside the ring is what makes it read as a Q
   and not an O with a mark beside it. */
const Q = {
  w: 94,
  ink: [[[24, 0], [70, 0], [94, 24], [94, 76], [70, 100], [24, 100], [0, 76], [0, 24]],
        [[30, 26], [64, 26], [68, 31], [68, 69], [64, 74], [30, 74], [26, 69], [26, 31]]],
  hot: [[[50, 46], [72, 46], [96, 106], [74, 106]]]
};

/* ---------------------------------------------------------------- 360 */
/* Monoline and half height. A filled digit closes up at this size and a
   stroked one does not, and the weight change is what keeps the suffix
   from arguing with the name. Drawn on a 44 grid, scaled from there. */
const DIGIT = { grid: 44, stroke: 8, cap: 42, gap: 5 };
const DIGITS = [
  { w: 30, d: 'M4,12 A12,12 0 1 1 16,24 A12,12 0 1 1 4,36' },
  { w: 30, d: 'M26,5 C13,8 4,16 4,28 A12,12 0 1 1 28,28 A12,12 0 1 1 4,28' },
  { w: 30, d: 'M16,4 A12,12 0 0 1 28,16 V28 A12,12 0 0 1 4,28 V16 A12,12 0 0 1 16,4 Z' }
];

/* ---------------------------------------------------------------- build */
const path = (rings) => rings.map((r) => 'M' + poly(r) + 'Z').join('');

function letter(g, x, ink, hot) {
  const out = ['<path fill="' + ink + '" fill-rule="evenodd" d="' + path(g.ink) + '"/>'];
  if (g.hot.length) out.push('<path fill="' + hot + '" d="' + path(g.hot) + '"/>');
  return '<g transform="translate(' + x + ',0)">' + out.join('') + '</g>';
}

/* The A slopes away from whatever follows it, so the gap after it is
   measured at the baseline and looks like a hole at the cap line. Six
   units come back out of it. This is the only pair that needs it. */
const KERN = { A: -6 };

function wordmark(ink, hot) {
  let x = 0;
  const parts = [];
  const run = [['A', A], ['R', R], ['Q', Q], ['R', R]];
  run.forEach(([name, g], i) => {
    parts.push(letter(g, x, ink, hot));
    if (i < run.length - 1) x += g.w + GAP + (KERN[name] || 0);
    else x += g.w;
  });
  return { svg: parts.join(''), w: x };
}

function suffix(x, hot) {
  const s = DIGIT.cap / DIGIT.grid;
  let dx = 0;
  const body = DIGITS.map((d) => {
    const one = '<g transform="translate(' + dx + ',0)"><path d="' + d.d + '"/></g>';
    dx += d.w + DIGIT.gap;
    return one;
  }).join('');
  return {
    svg: '<g transform="translate(' + x + ',2) scale(' + s.toFixed(4) + ')" fill="none" ' +
      'stroke="' + hot + '" stroke-width="' + DIGIT.stroke + '" ' +
      /* flat terminals, not round: every edge in the four capitals is a
         cut, and a rounded one here reads as a different family */
      'stroke-linecap="butt" stroke-linejoin="round">' + body + '</g>',
    w: (dx - DIGIT.gap) * s
  };
}

/* The Q's cut runs to y=106, so that is the box. */
const BOX_H = 106;

function lockup({ ink = INK, hot = ACCENT, suffix: withSuffix = true } = {}) {
  const word = wordmark(ink, hot);
  const suf = withSuffix ? suffix(word.w + 14, hot) : { svg: '', w: -14 };
  const w = Math.round(word.w + 14 + suf.w);
  return {
    w, h: BOX_H, ratio: w / BOX_H, body: word.svg + suf.svg,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + BOX_H + '" ' +
      'width="' + w + '" height="' + BOX_H + '">' + word.svg + suf.svg + '</svg>'
  };
}

/* the A on its own, for anywhere square */
function mark({ ink = PAPER, hot = ACCENT } = {}) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + A.w + ' 100" ' +
    'width="' + A.w + '" height="100">' + letter(A, 0, ink, hot) + '</svg>';
}

/* a square tile with the A centred in it */
function tile({ size = 512, bg = INK, ink = PAPER, hot = ACCENT, pad = 0.2 } = {}) {
  const inner = size * (1 - pad * 2);
  const s = inner / A.w;
  const h = 100 * s;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" ' +
    'viewBox="0 0 ' + size + ' ' + size + '">' +
    '<rect width="' + size + '" height="' + size + '" rx="' + (size * 0.22).toFixed(1) +
    '" fill="' + bg + '"/>' +
    '<g transform="translate(' + ((size - inner) / 2).toFixed(2) + ',' +
    ((size - h) / 2).toFixed(2) + ') scale(' + s.toFixed(4) + ')">' +
    letter(A, 0, ink, hot) + '</g></svg>';
}

module.exports = { INK, ACCENT, PAPER, CAP, STEM, GAP, BOX_H, A, R, Q, letter, lockup, mark, tile };
