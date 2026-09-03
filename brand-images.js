/* ------------------------------------------------------------------
   Favicon, touch icon, schema logo and the two share cards, all cut from
   the client's logo.png by way of logo-images.js. That file owns the
   white knockout and the band measurements, so nothing here re-derives
   them and none of these can drift from the header.

   The icon is the AR monogram. A tab is 16 pixels wide: the wordmark is
   unreadable there and the tagline is not a pixel tall, so the monogram
   is the only part of the artwork with a shape at that size.

   The monogram is dark grey and orange, so its tile is paper rather than
   ink. On ink the A would simply not be there. The share card is the
   opposite problem and takes the opposite answer: it is a dark
   photograph, so the logo is knocked light, the grey going to paper and
   the orange staying exactly as drawn.

   Run:  npm run brand
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const sharp = require('sharp');

const INK = '#1C1917';
const PAPER = '#FDFBF7';

const MONO = 'assets/logo-mono.png';
/* the artwork entire, tagline included: the card is 260px wide, where
   those 29 rows land at 13px and read. The bar's copy has them cropped. */
const STACK = 'assets/logo-card.png';

/* grey to paper, orange left exactly as it is, alpha untouched. The
   client's orange is 253,69,2, so red minus blue tells them apart with
   nothing near the boundary. */
async function light(file, width) {
  const { data, info } = await sharp(file).resize(width).ensureAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    if (data[i] > 120 && data[i] - data[i + 2] > 50) continue;
    data[i] = 0xFD; data[i + 1] = 0xFB; data[i + 2] = 0xF7;
  }
  return sharp(Buffer.from(data), { raw: { width: info.width, height: info.height, channels: 4 } })
    .png().toBuffer();
}

/* the monogram, centred on a rounded tile */
async function tile(size, bg) {
  const m = await sharp(MONO).metadata();
  const w = Math.round(size * 0.74);
  const h = Math.round(w * m.height / m.width);
  const art = await sharp(MONO).resize(w, h).png().toBuffer();
  const plate = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
    '"><rect width="' + size + '" height="' + size + '" rx="' + Math.round(size * 0.22) +
    '" fill="' + bg + '"/></svg>';
  return sharp(Buffer.from(plate))
    .composite([{ input: art, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png({ compressionLevel: 9 }).toBuffer();
}

/* ---------------------------------------------------------------- cards */
/* The stacked lockup sits above the headline: 260 wide it is 178 tall
   and ends at 388, and the headline's ascenders reach about 460. */
const CARD_W = 260, CARD_TOP = 210;

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

  /* --- the monogram on a paper tile --- */
  for (const [file, size] of [['favicon.png', 192], ['apple-touch-icon.png', 180]]) {
    fs.writeFileSync(file, await tile(size, PAPER));
    out.push([file, fs.statSync(file).size]);
  }

  /* a real .ico, because some crawlers and older browsers still ask */
  const ico = await tile(32, PAPER);
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head[6] = 32; head[7] = 32; head[8] = 0; head[9] = 0;
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
  head.writeUInt32LE(ico.length, 14); head.writeUInt32LE(22, 18);
  fs.writeFileSync('favicon.ico', Buffer.concat([head, ico]));
  out.push(['favicon.ico', fs.statSync('favicon.ico').size]);

  /* --- the logo schema.org points at: the stacked lockup on paper,
         since this one is shown on backgrounds we do not choose --- */
  const st = await sharp(STACK).metadata();
  const sw = 760, sh = Math.round(sw * st.height / st.width);
  fs.writeFileSync('assets/logo-mark.png', await sharp({
    create: { width: 1000, height: sh + 120, channels: 4, background: PAPER }
  }).composite([{ input: await sharp(STACK).resize(sw).png().toBuffer(),
                  left: Math.round((1000 - sw) / 2), top: 60 }])
    .png({ compressionLevel: 9, palette: true }).toBuffer());
  out.push(['assets/logo-mark.png', fs.statSync('assets/logo-mark.png').size]);

  /* --- share cards: the stacked lockup, knocked light, over the room --- */
  const onDark = await light(STACK, CARD_W);
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
        { input: onDark, left: 72, top: CARD_TOP }
      ])
      .jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    fs.writeFileSync(file, buf);
    out.push([file, buf.length]);
  }

  out.forEach(([f, n]) => console.log('  ' + f.padEnd(24) + (n / 1024).toFixed(0) + ' KB'));
})();
