/* ------------------------------------------------------------------
   QR generator — no dependencies, so the catalog code can be rebuilt
   at any time without a network.  Byte mode, versions 1-10.
   Run:  node qr-gen.js [url]
   Out:  assets/qr-catalog.svg
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');

/* [ec codewords per block, blocks A, data per block A, blocks B, data per block B] */
const EC = {
  L: [[7,1,19,0,0],[10,1,34,0,0],[15,1,55,0,0],[20,1,80,0,0],[26,1,108,0,0],
      [18,2,68,0,0],[20,2,78,0,0],[24,2,97,0,0],[30,2,116,0,0],[18,2,68,2,69]],
  M: [[10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],
      [16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44]],
  Q: [[13,1,13,0,0],[22,1,22,0,0],[18,2,17,0,0],[26,2,24,0,0],[18,2,15,2,16],
      [24,4,19,0,0],[18,2,14,4,15],[22,4,18,2,19],[20,4,16,4,17],[24,6,19,2,20]],
  H: [[17,1,9,0,0],[28,1,16,0,0],[22,2,13,0,0],[16,4,9,0,0],[22,2,11,2,12],
      [28,4,15,0,0],[26,4,13,1,14],[26,4,14,2,15],[24,4,12,4,13],[28,6,15,2,16]]
};
const ALIGN = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
const ECBITS = { L:1, M:0, Q:3, H:2 };

/* ---- GF(256) ---- */
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;

function genPoly(n) {
  let p = [1];
  for (let i = 0; i < n; i++) {
    const q = new Array(p.length + 1).fill(0);
    /* (x + a) * p : the x term keeps the index, the a term shifts it down one */
    for (let j = 0; j < p.length; j++) { q[j] ^= p[j]; q[j + 1] ^= mul(p[j], EXP[i]); }
    p = q;
  }
  return p;
}
function ecc(data, n) {
  const g = genPoly(n), r = new Array(n).fill(0);
  for (const d of data) {
    const f = d ^ r[0];
    r.shift(); r.push(0);
    if (f) for (let i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f);
  }
  return r;
}

/* ---- BCH for the format / version strips ---- */
function fmtBits(level, mask) {
  const d = (ECBITS[level] << 3) | mask;
  let v = d << 10;
  for (let i = 4; i >= 0; i--) if (v & (1 << (i + 10))) v ^= 0x537 << i;
  return ((d << 10) | v) ^ 0x5412;
}
function verBits(ver) {
  let v = ver << 12;
  for (let i = 5; i >= 0; i--) if (v & (1 << (i + 12))) v ^= 0x1f25 << i;
  return (ver << 12) | v;
}

function encode(text, level) {
  const bytes = Array.from(Buffer.from(text, 'utf8'));

  let ver = 0, spec = null;
  for (let v = 1; v <= 10; v++) {
    const s = EC[level][v - 1];
    const cap = s[1] * s[2] + s[3] * s[4];
    if (cap >= bytes.length + 2 + (v < 10 ? 1 : 2)) { ver = v; spec = s; break; }
  }
  if (!ver) throw new Error('text too long for version 10 at level ' + level);

  const ecLen = spec[0], b1 = spec[1], d1 = spec[2], b2 = spec[3], d2 = spec[4];
  const total = b1 * d1 + b2 * d2;

  /* --- bitstream --- */
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  put(4, 4);                              /* byte mode  */
  put(bytes.length, ver < 10 ? 8 : 16);   /* char count */
  bytes.forEach(b => put(b, 8));
  for (let i = 0; i < 4 && bits.length < total * 8; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const words = [];
  for (let i = 0; i < bits.length; i += 8)
    words.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let i = 0; words.length < total; i++) words.push(i % 2 ? 0x11 : 0xec);

  /* --- split into blocks, interleave with their ecc --- */
  const blocks = [], eccs = [];
  let at = 0;
  for (let i = 0; i < b1 + b2; i++) {
    const len = i < b1 ? d1 : d2;
    const blk = words.slice(at, at + len); at += len;
    blocks.push(blk); eccs.push(ecc(blk, ecLen));
  }
  const out = [];
  for (let i = 0; i < Math.max(d1, d2); i++)
    blocks.forEach(b => { if (i < b.length) out.push(b[i]); });
  for (let i = 0; i < ecLen; i++) eccs.forEach(e => out.push(e[i]));

  return { ver: ver, words: out };
}

function build(ver, words, level) {
  const n = ver * 4 + 17;
  const m = Array.from({ length: n }, () => new Array(n).fill(null));
  const fixed = Array.from({ length: n }, () => new Array(n).fill(false));
  const set = (r, c, v) => { m[r][c] = v; fixed[r][c] = true; };

  /* finders + separators */
  [[0, 0], [0, n - 7], [n - 7, 0]].forEach(pair => {
    const R = pair[0], C = pair[1];
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const y = R + r, x = C + c;
      if (y < 0 || x < 0 || y >= n || x >= n) continue;
      const on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                 (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                 (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      set(y, x, on ? 1 : 0);
    }
  });
  /* timing */
  for (let i = 8; i < n - 8; i++) { set(6, i, i % 2 ? 0 : 1); set(i, 6, i % 2 ? 0 : 1); }
  /* alignment */
  const ac = ALIGN[ver - 1];
  /* only the three centres that sit under a finder are dropped — the ones that
     cross a timing line are still drawn, which matters from version 7 up */
  const underFinder = (R, C) =>
    (R === 6 && C === 6) || (R === 6 && C === n - 7) || (R === n - 7 && C === 6);
  ac.forEach(R => ac.forEach(C => {
    if (underFinder(R, C)) return;
    for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++)
      set(R + r, C + c, (Math.abs(r) === 2 || Math.abs(c) === 2 || (!r && !c)) ? 1 : 0);
  }));
  /* dark module + reserved format area */
  set(n - 8, 8, 1);
  for (let i = 0; i < 9; i++) { if (!fixed[8][i]) set(8, i, 0); if (!fixed[i][8]) set(i, 8, 0); }
  for (let i = 0; i < 8; i++) { if (!fixed[8][n - 1 - i]) set(8, n - 1 - i, 0); if (!fixed[n - 1 - i][8]) set(n - 1 - i, 8, 0); }
  /* version strips */
  if (ver >= 7) {
    const v = verBits(ver);
    for (let i = 0; i < 18; i++) {
      const b = (v >> i) & 1, r = Math.floor(i / 3), c = i % 3;
      set(n - 11 + c, r, b); set(r, n - 11 + c, b);
    }
  }

  /* payload, boustrophedon up the right-hand side */
  let bi = 0, up = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let k = 0; k < n; k++) {
      const row = up ? n - 1 - k : k;
      const pair = [col, col - 1];
      for (let z = 0; z < 2; z++) {
        const c = pair[z];
        if (fixed[row][c]) continue;
        const byte = words[bi >> 3];
        m[row][c] = byte === undefined ? 0 : (byte >> (7 - (bi & 7))) & 1;
        bi++;
      }
    }
    up = !up;
  }

  const MASK = [
    (r, c) => (r + c) % 2 === 0,       (r) => r % 2 === 0,
    (r, c) => c % 3 === 0,             (r, c) => (r + c) % 3 === 0,
    (r, c) => (((r / 2) | 0) + ((c / 3) | 0)) % 2 === 0,
    (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
    (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0
  ];

  function penalty(g) {
    let p = 0;
    for (let r = 0; r < n; r++) for (let dir = 0; dir < 2; dir++) {
      let run = 1;
      for (let i = 1; i < n; i++) {
        const a = dir ? g[i - 1][r] : g[r][i - 1], b = dir ? g[i][r] : g[r][i];
        if (a === b) run++; else { if (run >= 5) p += run - 2; run = 1; }
      }
      if (run >= 5) p += run - 2;
    }
    for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++)
      if (g[r][c] === g[r][c + 1] && g[r][c] === g[r + 1][c] && g[r][c] === g[r + 1][c + 1]) p += 3;
    const pat = [1,0,1,1,1,0,1,0,0,0,0];
    for (let r = 0; r < n; r++) for (let c = 0; c + 11 <= n; c++) {
      let h = true, v = true;
      for (let i = 0; i < 11; i++) { if (g[r][c + i] !== pat[i]) h = false; if (g[c + i][r] !== pat[i]) v = false; }
      if (h) p += 40;
      if (v) p += 40;
    }
    let dark = 0;
    g.forEach(row => row.forEach(v => dark += v));
    p += Math.floor(Math.abs(dark * 100 / (n * n) - 50) / 5) * 10;
    return p;
  }

  let best = null, bestP = Infinity, bestMask = 0;
  for (let k = 0; k < 8; k++) {
    const g = m.map((row, r) => row.map((v, c) => fixed[r][c] ? v : (v ^ (MASK[k](r, c) ? 1 : 0))));
    const f = fmtBits(level, k);
    for (let i = 0; i < 15; i++) {
      const b = (f >> i) & 1;
      if (i < 6) g[i][8] = b; else if (i < 8) g[i + 1][8] = b;
      else if (i === 8) g[8][7] = b; else g[8][14 - i] = b;
      if (i < 8) g[8][n - 1 - i] = b; else g[n - 15 + i][8] = b;
    }
    g[n - 8][8] = 1;
    const p = penalty(g);
    if (p < bestP) { bestP = p; best = g; bestMask = k; }
  }
  return { grid: best, size: n, mask: bestMask };
}

/* ---- SVG ----------------------------------------------------------
   Modules are drawn as squares whose corners round only where there is
   no neighbour.  Free-standing dots look sharper but a scanner cannot
   read them — separated circles fail to decode — so the shapes have to
   stay touching.  The centre is cleared for the mark; level H carries
   30% recovery, which more than covers the hole.
   ------------------------------------------------------------------ */
function svg(grid, n, opts) {
  const q = 4, S = n + q * 2;            /* the spec wants 4 modules of quiet zone */
  const dark = opts.dark, light = opts.light;
  const hole = opts.logo ? Math.round(n * 0.22) : 0;
  const h0 = Math.floor((n - hole) / 2), h1 = h0 + hole;
  const inEye = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const cleared = (r, c) => hole && r >= h0 && r < h1 && c >= h0 && c < h1;
  const on = (r, c) =>
    r >= 0 && c >= 0 && r < n && c < n &&
    grid[r][c] === 1 && !inEye(r, c) && !cleared(r, c);

  const R = 0.42;
  const f = v => Math.round(v * 1000) / 1000;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!on(r, c)) continue;
    const x = c + q, y = r + q;
    /* a corner is rounded only when both of its edge neighbours are empty */
    const tl = !on(r - 1, c) && !on(r, c - 1) ? R : 0;
    const tr = !on(r - 1, c) && !on(r, c + 1) ? R : 0;
    const br = !on(r + 1, c) && !on(r, c + 1) ? R : 0;
    const bl = !on(r + 1, c) && !on(r, c - 1) ? R : 0;
    d += 'M' + f(x + tl) + ' ' + y +
         'H' + f(x + 1 - tr) + (tr ? 'a' + tr + ' ' + tr + ' 0 0 1 ' + tr + ' ' + tr : '') +
         'V' + f(y + 1 - br) + (br ? 'a' + br + ' ' + br + ' 0 0 1 ' + (-br) + ' ' + br : '') +
         'H' + f(x + bl) + (bl ? 'a' + bl + ' ' + bl + ' 0 0 1 ' + (-bl) + ' ' + (-bl) : '') +
         'V' + f(y + tl) + (tl ? 'a' + tl + ' ' + tl + ' 0 0 1 ' + tl + ' ' + (-tl) : '') + 'z';
  }

  let eyes = '';
  [[0, 0], [0, n - 7], [n - 7, 0]].forEach(pair => {
    const Y = pair[0] + q, X = pair[1] + q;
    eyes += '<rect x="' + (X + 0.5) + '" y="' + (Y + 0.5) +
            '" width="6" height="6" rx="1.9" fill="none" stroke="' + dark + '" stroke-width="1"/>' +
            '<rect x="' + (X + 2) + '" y="' + (Y + 2) +
            '" width="3" height="3" rx="1.05" fill="' + dark + '"/>';
  });

  const mark = opts.logo ? [
    '<g transform="translate(' + (S / 2) + ' ' + (S / 2) + ') scale(' + f(hole / 24) + ')">',
    '    <circle r="12.6" fill="' + light + '"/>',
    '    <g fill="none" stroke="' + opts.accent + '" stroke-width="1.6" stroke-linejoin="round">',
    '      <path d="M0-8.2 7.1-4.1v8.2L0 8.2-7.1 4.1v-8.2z"/>',
    '      <path d="M-7.1-4.1 0 0l7.1-4.1M0 0v8.2"/>',
    '    </g>',
    '  </g>'
  ].join('\n  ') : '';

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + S + ' ' + S + '" width="' + (S * 12) +
      '" height="' + (S * 12) + '" shape-rendering="geometricPrecision">',
    '  <rect width="' + S + '" height="' + S + '" fill="' + light + '"/>',
    '  <path d="' + d + '" fill="' + dark + '"/>',
    '  ' + eyes,
    '  ' + mark,
    '</svg>',
    ''
  ].join('\n');
}

const url = process.argv[2] || 'https://arqr-two.vercel.app/catalog';
const level = 'H';                       /* 30% recovery — the centre mark is safe */
const enc = encode(url, level);
const out = build(enc.ver, enc.words, level);
fs.writeFileSync('assets/qr-catalog.svg',
  svg(out.grid, out.size, { dark: '#191919', light: '#FFFFFF', accent: '#E0682A', logo: true }));
console.log('qr  ' + url);
console.log('    version ' + enc.ver + '  ' + out.size + 'x' + out.size +
            '  level ' + level + '  mask ' + out.mask + '  ->  assets/qr-catalog.svg');
