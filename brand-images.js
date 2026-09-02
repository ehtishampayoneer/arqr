/* ------------------------------------------------------------------
   Favicon, touch icon, schema logo and the two share cards, rendered
   from the same geometry the pages draw. logo-design.js is the only
   place any of these shapes exist, so none of them can drift.

   The icon is the A on its own. A tab is 16 pixels wide, the wordmark is
   unreadable there, and the A is the one letter with a shape rather than
   a spelling: an open chevron standing over an orange triangle, which
   still reads at 16.

   Everything dark-backed is drawn light directly, not knocked out of a
   dark version afterwards. That is the other thing vector buys.

   Run:  npm run brand
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const sharp = require('sharp');
const L = require('./logo-design');

const png = (svg, w) => sharp(Buffer.from(svg)).resize(w).png({ compressionLevel: 9 }).toBuffer();

/* ---------------------------------------------------------------- cards */
/* The logo sits above the headline. At 300 wide it is 62 tall and ends
   at 412; the headline's ascenders reach about 460, so 48 between them. */
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

  /* --- the A on an ink tile --- */
  const tile = L.tile({ size: 512 });
  for (const [file, size] of [['favicon.png', 192], ['apple-touch-icon.png', 180]]) {
    fs.writeFileSync(file, await png(tile, size));
    out.push([file, fs.statSync(file).size]);
  }

  /* a real .ico, because some crawlers and older browsers still ask */
  const ico = await png(tile, 32);
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head[6] = 32; head[7] = 32; head[8] = 0; head[9] = 0;
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
  head.writeUInt32LE(ico.length, 14); head.writeUInt32LE(22, 18);
  fs.writeFileSync('favicon.ico', Buffer.concat([head, ico]));
  out.push(['favicon.ico', fs.statSync('favicon.ico').size]);

  /* --- the logo schema.org points at: the lockup on paper, since this
         one is shown on backgrounds we do not choose --- */
  const dark = L.lockup();
  fs.writeFileSync('assets/logo-mark.png', await sharp({
    create: { width: 1000, height: 320, channels: 4, background: L.PAPER }
  }).composite([{
    input: await png(dark.svg, 880), left: 60,
    top: Math.round((320 - 880 / dark.ratio) / 2)
  }]).png({ compressionLevel: 9, palette: true }).toBuffer());
  out.push(['assets/logo-mark.png', fs.statSync('assets/logo-mark.png').size]);

  /* --- share cards: the light lockup over the room photograph --- */
  const light = L.lockup({ ink: L.PAPER });
  const onDark = await png(light.svg, LOGO_W);

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
