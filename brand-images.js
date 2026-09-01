/* ------------------------------------------------------------------
   Favicon, touch icon, schema logo and the two share cards, all cut from
   the same artwork the header uses. Nothing is drawn by hand any more
   and nothing is downloaded.

   What the artwork is, and which of its blobs are dirt, lives in
   logo-art.js. Two things are decided here.

   Which part of it an icon gets. A tab is 16 pixels wide: the wordmark
   is unreadable there and the descriptor line is not even a pixel tall.
   So the icon is the A on its own, which is the one glyph with a shape
   of its own and carries the orange triangle.

   And how to put a black logo on a dark ground. Both share cards and
   all three tiles knock the black out to paper and leave the orange
   alone, which is the ordinary treatment for a one-colour logo, done off
   the alpha channel so the antialiasing survives it. This is also why
   the specks matter: black dirt on a cream page is invisible, the same
   dirt knocked out white on a dark card reads as grime.

   Run:  npm run brand
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const sharp = require('sharp');
const art = require('./logo-art');

const INK = '#1C1917';
const PAPER = '#FDFBF7';
const PAPER_RGB = [0xFD, 0xFB, 0xF7];

/* ---------------------------------------------------------------- tiles */
/* The A is 1.65:1, so it is fitted to the width of the square and
   centred vertically. 76% leaves the rounded corners something to do. */
async function tile(markPng, markW, markH, size) {
  const w = Math.round(size * 0.76);
  const h = Math.round(w * markH / markW);
  const mark = await sharp(markPng).resize(w, h).png().toBuffer();
  const plate = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
    '"><rect width="' + size + '" height="' + size + '" rx="' +
    Math.round(size * 0.22) + '" fill="' + INK + '"/></svg>';
  return sharp(Buffer.from(plate))
    .composite([{ input: mark, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png({ compressionLevel: 9 }).toBuffer();
}

/* ---------------------------------------------------------------- cards */
/* The logo sits above the headline rather than beside it, so the two
   numbers that matter are its height and the gap under it. At 300px wide
   it is 69 tall and ends at 419; the headline's ascenders reach about
   460, which leaves 40px between them. */
const LOGO_W = 300, LOGO_TOP = 350;

const card = (title, sub) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(20,16,12,0.30)"/>
      <stop offset="55%" stop-color="rgba(20,16,12,0.72)"/>
      <stop offset="100%" stop-color="rgba(20,16,12,0.93)"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="72" y="500" font-family="Archivo, Segoe UI, Arial, sans-serif"
        font-size="54" font-weight="800" fill="#FFFFFF">${title}</text>
  <text x="72" y="548" font-family="Inter, Segoe UI, Arial, sans-serif"
        font-size="25" fill="rgba(255,255,255,0.82)">${sub}</text>
</svg>`;

(async () => {
  const out = [];
  const lockup = await art.lockup();
  const A = await art.letterA();
  console.log('  lockup ' + lockup.w + '×' + lockup.h + ', ' + lockup.dirt +
              ' specks dropped; A ' + A.w + '×' + A.h +
              ' from parts of ' + A.parts.join(', ') + ' px');

  /* --- the A, knocked out to paper, on an ink tile --- */
  const mark = await art.image(art.reverse(A, PAPER_RGB)).png().toBuffer();

  /* A png, not an svg. The artwork is a raster and the three parts of the
     A are not convex, so a convex hull traces them at 79%, 84% and 94% of
     their real area: there is no honest vector in here, and an .svg that
     is really a base64 png inside a rect is a 26 KB lie about what it is.
     192 covers everywhere a favicon is asked for above 32. */
  for (const [file, size] of [['favicon.png', 192], ['apple-touch-icon.png', 180]]) {
    fs.writeFileSync(file, await tile(mark, A.w, A.h, size));
    out.push([file, fs.statSync(file).size]);
  }

  /* a real .ico, because some crawlers and older browsers still ask */
  const ico = await tile(mark, A.w, A.h, 32);
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head[6] = 32; head[7] = 32; head[8] = 0; head[9] = 0;
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
  head.writeUInt32LE(ico.length, 14); head.writeUInt32LE(22, 18);
  fs.writeFileSync('favicon.ico', Buffer.concat([head, ico]));
  out.push(['favicon.ico', fs.statSync('favicon.ico').size]);

  /* --- the logo schema.org points at: the whole lockup, on paper --- */
  const onPaper = await art.image(lockup).resize(880).png().toBuffer();
  fs.writeFileSync('assets/logo-mark.png', await sharp({
    create: { width: 1000, height: 320, channels: 4, background: PAPER }
  }).composite([{
    input: onPaper, left: 60,
    top: Math.round((320 - 880 / art.RATIO.lockup) / 2)
  }]).png({ compressionLevel: 9, palette: true }).toBuffer());
  out.push(['assets/logo-mark.png', fs.statSync('assets/logo-mark.png').size]);

  /* --- share cards: the reversed lockup over the room photograph --- */
  const small = await art.image(lockup).resize(LOGO_W).ensureAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  const onDark = await art.image(
    art.reverse({ d: small.data, w: small.info.width, h: small.info.height }, [255, 255, 255])
  ).png().toBuffer();

  const base = fs.existsSync('assets/room.webp') ? 'assets/room.webp' : 'assets/hero-novara.webp';
  /* jpeg, not png: these are photographs, and a 767 KB share card is a
     slow preview on every platform that fetches it */
  const shots = [
    ['assets/og-home.jpg',    'Your showroom, in their room', 'One QR code. Every product at true size.'],
    ['assets/og-catalog.jpg', 'Four sample AR catalogs',      'Furniture, footwear, decor and rugs.']
  ];
  for (const [file, title, sub] of shots) {
    const bg = await sharp(base).resize(1200, 630, { fit: 'cover', position: 'centre' }).toBuffer();
    const buf = await sharp(bg)
      .composite([
        { input: Buffer.from(card(title, sub)), top: 0, left: 0 },
        { input: onDark, left: 72, top: LOGO_TOP }
      ])
      .jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    fs.writeFileSync(file, buf);
    out.push([file, buf.length]);
  }

  out.forEach(([f, n]) => console.log('  ' + f.padEnd(24) + (n / 1024).toFixed(0) + ' KB'));
})();
