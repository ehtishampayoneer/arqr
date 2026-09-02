/* ------------------------------------------------------------------
   ARQR360 — a mark and a wordmark, drawn from scratch.

   The previous attempt was the supplied artwork tidied up: the same
   chevron A, the same slashed Q, the same heavy blocked weight. That is
   a redraw, not a logo, and heavy angular capitals are the wrong
   register for a brand whose products are sofas, rugs and lamps.

   So this one is monoline. One stroke weight through the mark, the
   capitals and the suffix, geometric construction throughout, and space
   between the letters rather than mass inside them. That is the register
   the site is already in: warm paper, wide margins, photographs of quiet
   rooms.

   Three marks are drawn here, because the mark is the part worth
   choosing between rather than guessing at. They share a grid, a weight
   and one orange accent, so any of them drops into the same lockup.

     ring    a cube inside a circle. The circle is the 360.
     room    a cube standing on a floor line, with its shadow.
     frame   a viewfinder, with the cube arriving inside it.

   Every number is on a 100-unit cap height.
   ------------------------------------------------------------------ */
'use strict';

const INK = '#1C1917';
const ACCENT = '#E0682A';
const PAPER = '#FDFBF7';

const CAP = 100;
const W = 13;            /* one stroke weight, everywhere */
const TRACK = 15;        /* space between capitals */
/* The box is the capitals plus the room their stroke needs on each
   side: 100 of cap, 9 above and 9 below. Any taller and the letters
   shrink for nothing, because a logo is sized by its height. */
const BOX = 118;

/* ---------------------------------------------------------------- caps */
/* Centrelines, not outlines. The stroke gives them their weight, which is
   why one number changes the whole logo's colour on the page. */
const CAPS = {
  A: { w: 88, d: 'M0,100 L44,0 L88,100 M14,68 H74' },
  R: { w: 84, d: 'M0,100 V0 H50 A25,25 0 0 1 50,50 H0 M42,50 L84,100' },
  /* a true circle, drawn as two half arcs rather than one that has to
     start and finish on the same point, and a tail that stops before it
     reaches whatever comes next */
  Q: { w: 96, d: 'M2,50 A46,46 0 1 1 94,50 A46,46 0 1 1 2,50 M64,64 L90,94' }
};

/* the suffix: a smaller setting of the same letterform, not a lighter one */
/* Each digit is drawn to the same 100 cap the letters use and then set
   at 0.46 of it, so the suffix is a smaller size of one alphabet rather
   than a second, lighter one. The 6's bowl is a closed circle with the
   tail arriving at its left edge; the earlier one tried to be a single
   arc and came out as a degree sign. */
const DIGITS = {
  list: [
    { w: 58, d: 'M8,28 A24,24 0 1 1 32,52 A24,24 0 1 1 8,76' },
    { w: 62, d: 'M52,8 C26,12 0,30 0,64 M0,64 A30,30 0 1 0 60,64 A30,30 0 1 0 0,64' },
    { w: 58, d: 'M28,4 A28,46 0 1 1 27.9,4 Z' }
  ],
  scale: 0.46,
  gap: 16
};

/* ---------------------------------------------------------------- marks */
/* An isometric cube on a 2:1 projection: every edge lands on a whole
   number and the three faces are identical rhombi. r is its half-width. */
function cube(cx, cy, r) {
  const h = r / 2;
  const T = [cx, cy - r], UR = [cx + r, cy - h], LR = [cx + r, cy + h];
  const B = [cx, cy + r], LL = [cx - r, cy + h], UL = [cx - r, cy - h];
  const C = [cx, cy];
  const P = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  return {
    /* the top face is the only thing that takes colour */
    top: 'M' + P(T) + 'L' + P(UR) + 'L' + P(C) + 'L' + P(UL) + 'Z',
    /* the silhouette, then the three edges that make it solid */
    line: 'M' + P(T) + 'L' + P(UR) + 'L' + P(LR) + 'L' + P(B) + 'L' + P(LL) +
          'L' + P(UL) + 'Z M' + P(C) + 'L' + P(UL) + 'M' + P(C) + 'L' + P(UR) +
          'M' + P(C) + 'L' + P(B)
  };
}

const MARKS = {
  /* A cube inside a ring. The ring is the 360, which is why the suffix
     can afford to be small: the mark is already saying it. */
  ring: (S) => {
    const c = cube(S / 2, S / 2, S * 0.275);
    const r = (S - W) / 2 - 1;
    return {
      hot: c.top,
      ink: 'M' + (S / 2) + ',' + (S / 2 - r) + 'A' + r + ',' + r + ' 0 1 1 ' +
        (S / 2 - 0.01) + ',' + (S / 2 - r) + 'Z ' + c.line
    };
  },

  /* A cube standing on a floor, with the line of its own shadow: the
     product in the room, at the size it really is. */
  room: (S) => {
    const c = cube(S / 2, S * 0.40, S * 0.28);
    return {
      hot: c.top,
      ink: c.line + ' M' + (S * 0.04).toFixed(1) + ',' + (S * 0.82).toFixed(1) +
        'H' + (S * 0.96).toFixed(1) +
        ' M' + (S * 0.28).toFixed(1) + ',' + (S * 0.955).toFixed(1) +
        'H' + (S * 0.76).toFixed(1)
    };
  },

  /* A viewfinder with the cube arriving inside it: what the camera is
     doing at the moment a catalog becomes a room. */
  frame: (S) => {
    const c = cube(S / 2, S / 2, S * 0.21);
    const t = S * 0.32, o = W / 2 + 1, k = 12;
    const L = [
      'M' + o + ',' + t.toFixed(1) + 'V' + (o + k) + 'A' + k + ',' + k + ' 0 0 1 ' +
        (o + k) + ',' + o + 'H' + t.toFixed(1),
      'M' + (S - t).toFixed(1) + ',' + o + 'H' + (S - o - k) + 'A' + k + ',' + k +
        ' 0 0 1 ' + (S - o) + ',' + (o + k) + 'V' + t.toFixed(1),
      'M' + (S - o) + ',' + (S - t).toFixed(1) + 'V' + (S - o - k) + 'A' + k + ',' + k +
        ' 0 0 1 ' + (S - o - k) + ',' + (S - o) + 'H' + (S - t).toFixed(1),
      'M' + t.toFixed(1) + ',' + (S - o) + 'H' + (o + k) + 'A' + k + ',' + k +
        ' 0 0 1 ' + o + ',' + (S - o - k) + 'V' + (S - t).toFixed(1)
    ];
    return { hot: c.top, ink: L.join(' ') + ' ' + c.line };
  }
};

/* ---------------------------------------------------------------- build */
const stroke = (d, colour) =>
  '<path d="' + d + '" fill="none" stroke="' + colour + '" stroke-width="' + W +
  '" stroke-linecap="butt" stroke-linejoin="round"/>';

function wordmark(ink, hot, withSuffix) {
  const parts = [];
  let x = W / 2;
  for (const k of ['A', 'R', 'Q', 'R']) {
    const g = CAPS[k];
    parts.push('<g transform="translate(' + x.toFixed(1) + ',0)">' + stroke(g.d, ink) + '</g>');
    x += g.w + TRACK;
  }
  x = x - TRACK + W / 2;

  if (withSuffix) {
    const s = DIGITS.scale;
    let dx = 0;
    const body = DIGITS.list.map((d) => {
      const one = '<g transform="translate(' + dx.toFixed(1) + ',0)">' + stroke(d.d, hot) + '</g>';
      dx += d.w + DIGITS.gap;
      return one;
    }).join('');
    /* set on the cap line, not the baseline: a suffix, not a second word */
    parts.push('<g transform="translate(' + (x + 22).toFixed(1) + ',0) scale(' + s + ')">' +
      body + '</g>');
    x += 22 + (dx - DIGITS.gap) * s + W / 2;
  }
  return { svg: parts.join(''), w: x };
}

/* Square, and a little taller than the capitals: level with them it
   reads as a fifth letter, much bigger and it stops being a companion to
   the word and starts being the logo on its own. */
const MARK_S = 108;

function lockup({ mark = 'ring', ink = INK, hot = ACCENT, suffix = true, withMark = true } = {}) {
  const word = wordmark(ink, hot, suffix);
  const parts = [];
  let x = 0;

  if (withMark) {
    const m = MARKS[mark](MARK_S);
    parts.push('<g transform="translate(0,' + ((BOX - MARK_S) / 2).toFixed(1) + ')">' +
      '<path d="' + m.hot + '" fill="' + hot + '"/>' + stroke(m.ink, ink) + '</g>');
    x = MARK_S + 28;
  }

  /* no optical nudge: the stroke is centred on the cap line, so half of
     it sits above 0 and the (BOX - CAP) / 2 is exactly the room it needs */
  parts.push('<g transform="translate(' + x + ',' + ((BOX - CAP) / 2).toFixed(1) + ')">' +
    word.svg + '</g>');

  const w = Math.round(x + word.w);
  return {
    w, h: BOX, ratio: w / BOX, mark,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + BOX + '" ' +
      'width="' + w + '" height="' + BOX + '">' + parts.join('') + '</svg>'
  };
}

/* The mark on its own, square, for the compact bar. Same construction and
   the same weight, so there is no second piece of artwork to keep in step
   with this one. */
function markOnly({ mark = 'ring', ink = INK, hot = ACCENT } = {}) {
  const m = MARKS[mark](MARK_S);
  return {
    w: MARK_S, h: MARK_S, ratio: 1,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + MARK_S + ' ' + MARK_S + '" ' +
      'width="' + MARK_S + '" height="' + MARK_S + '">' +
      '<path d="' + m.hot + '" fill="' + hot + '"/>' + stroke(m.ink, ink) + '</svg>'
  };
}

/* The icon is the cube on its own, not the mark.

   A tab is 16 pixels wide. The ring, the floor line and the viewfinder
   are all context around the cube, and at 16px context is what turns into
   grey mush: the three marks were indistinguishable from each other and
   from a smudge. The cube is the thing all three have in common, it is
   the thing the product is about, and given the whole tile it reads. Its
   stroke is set a third heavier for the same reason. */
function tile({ size = 512, bg = INK, ink = PAPER, hot = ACCENT, pad = 0.2 } = {}) {
  const S = 116;
  const inner = size * (1 - pad * 2);
  const s = inner / S;
  const c = cube(S / 2, S / 2, S * 0.46);
  const heavy = (d, colour) => '<path d="' + d + '" fill="none" stroke="' + colour +
    '" stroke-width="' + (W * 1.35).toFixed(1) + '" stroke-linecap="butt" stroke-linejoin="round"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" ' +
    'viewBox="0 0 ' + size + ' ' + size + '">' +
    '<rect width="' + size + '" height="' + size + '" rx="' + (size * 0.22).toFixed(1) +
    '" fill="' + bg + '"/>' +
    '<g transform="translate(' + ((size - inner) / 2).toFixed(2) + ',' +
    ((size - inner) / 2).toFixed(2) + ') scale(' + s.toFixed(4) + ')">' +
    '<path d="' + c.top + '" fill="' + hot + '"/>' + heavy(c.line, ink) + '</g></svg>';
}

module.exports = { INK, ACCENT, PAPER, CAP, W, BOX, MARK_S, MARKS, lockup, markOnly, tile };
