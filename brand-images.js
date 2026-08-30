/* Favicon, touch icon, logo mark and the two share cards, built from the
   mark that is already in the header and the photography already on the
   site. Nothing new is invented and nothing is downloaded. */
'use strict';
const fs = require('fs');
const sharp = require('sharp');
process.chdir('C:/Users/Ehtisham/Documents/arqr');

const ACCENT = '#E0682A';
const INK = '#1C1917';
const PAPER = '#FDFBF7';

/* the same cube that sits in the header, drawn at icon weight */
const mark = (bg, stroke, pad) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${bg}"/>
  <g transform="translate(${pad},${pad}) scale(${(512 - pad * 2) / 24})"
     fill="none" stroke="${stroke}" stroke-width="1.7"
     stroke-linejoin="round" stroke-linecap="round">
    <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/>
    <path d="M4 8.5 12 13l8-4.5M12 13v7"/>
  </g>
</svg>`;

/* a share card: the room photograph, darkened, with the name over it */
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
  <g transform="translate(72,392)">
    <g transform="scale(2.1)" fill="none" stroke="${ACCENT}" stroke-width="1.7"
       stroke-linejoin="round" stroke-linecap="round">
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/>
      <path d="M4 8.5 12 13l8-4.5M12 13v7"/>
    </g>
    <text x="66" y="38" font-family="Archivo, Segoe UI, Arial, sans-serif"
          font-size="34" font-weight="800" fill="#FFFFFF" letter-spacing="1">ARQR</text>
  </g>
  <text x="72" y="500" font-family="Archivo, Segoe UI, Arial, sans-serif"
        font-size="54" font-weight="800" fill="#FFFFFF">${title}</text>
  <text x="72" y="548" font-family="Inter, Segoe UI, Arial, sans-serif"
        font-size="25" fill="rgba(255,255,255,0.82)">${sub}</text>
</svg>`;

(async () => {
  const out = [];

  /* --- favicon: the mark in brand orange, legible at 16px --- */
  fs.writeFileSync('favicon.svg', mark(ACCENT, '#FFFFFF', 118).trim() + '\n');
  out.push(['favicon.svg', fs.statSync('favicon.svg').size]);

  const png = size => sharp(Buffer.from(mark(ACCENT, '#FFFFFF', 118)))
    .resize(size, size).png({ compressionLevel: 9 }).toBuffer();

  fs.writeFileSync('apple-touch-icon.png', await png(180));
  out.push(['apple-touch-icon.png', fs.statSync('apple-touch-icon.png').size]);

  /* a real .ico, because some crawlers and older browsers still ask for one */
  const ico = await png(32);
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head[6] = 32; head[7] = 32; head[8] = 0; head[9] = 0;
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
  head.writeUInt32LE(ico.length, 14); head.writeUInt32LE(22, 18);
  fs.writeFileSync('favicon.ico', Buffer.concat([head, ico]));
  out.push(['favicon.ico', fs.statSync('favicon.ico').size]);

  /* --- the logo schema.org points at --- */
  fs.writeFileSync('assets/logo-mark.png', await sharp(Buffer.from(mark(PAPER, ACCENT, 118)))
    .resize(512, 512).png({ compressionLevel: 9 }).toBuffer());
  out.push(['assets/logo-mark.png', fs.statSync('assets/logo-mark.png').size]);

  /* --- share cards over the room photograph --- */
  const base = fs.existsSync('assets/room.webp') ? 'assets/room.webp' : 'assets/hero-novara.webp';
  /* jpeg, not png: these are photographs, and a 767 KB share card is a
     slow preview on every platform that fetches it */
  const shots = [
    ['assets/og-home.jpg',    'Your showroom, in their room', 'One QR code. Every product at true size.'],
    ['assets/og-catalog.jpg', 'Four sample AR catalogs',      'Furniture, footwear, decor and rugs.']
  ];
  for (const [file, title, sub] of shots){
    const bg = await sharp(base).resize(1200, 630, { fit: 'cover', position: 'centre' }).toBuffer();
    const buf = await sharp(bg)
      .composite([{ input: Buffer.from(card(title, sub)), top: 0, left: 0 }])
      .jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    fs.writeFileSync(file, buf);
    out.push([file, buf.length]);
  }

  out.forEach(([f, n]) => console.log('  ' + f.padEnd(24) + (n / 1024).toFixed(0) + ' KB'));
})();
