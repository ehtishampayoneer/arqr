/* ------------------------------------------------------------------
   The two pictures the emails use, built from the site's own images.

   assets/email/header.jpg  a Novara room washed into the page colour,
                            with the site grid, the logo and the accent
                            rule baked in (1120x320, shown at 560 wide)
   assets/email/grid.png    one 44px cell of the grid, tiled behind the card

   Baked rather than layered in the email: clients do not agree on
   background images or opacity, and a flat picture looks the same in
   Gmail, Apple Mail and Outlook.   Run:  node email-images.js
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const sharp = require('sharp');

(async () => {
  fs.mkdirSync('assets/email', { recursive: true });
  const W = 1120, H = 320;
  const photo = await sharp('assets/hero-novara.webp').resize(W, H, { fit: 'cover', position: 'attention' }).toBuffer();
  const wash = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><defs>' +
    '<linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#FAF7F2" stop-opacity=".97"/>' +
    '<stop offset=".42" stop-color="#FAF7F2" stop-opacity=".86"/><stop offset="1" stop-color="#FAF7F2" stop-opacity=".42"/></linearGradient>' +
    '<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#FFFFFF" stop-opacity="0"/>' +
    '<stop offset="1" stop-color="#FFFFFF" stop-opacity=".9"/></linearGradient>' +
    '<pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="#191919" stroke-opacity=".06" stroke-width="2"/></pattern>' +
    '</defs><rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#p)"/>' +
    '<rect width="100%" height="100%" fill="url(#b)"/><rect x="64" y="' + (H - 10) + '" width="96" height="5" rx="2.5" fill="#E0682A"/></svg>');
  const logo = await sharp('assets/logo-bar.png').resize({ height: 132 }).toBuffer();
  const lm = await sharp(logo).metadata();
  await sharp(photo).composite([{ input: wash }, { input: logo, left: 64, top: Math.round((H - lm.height) / 2) - 6 }])
    .jpeg({ quality: 84, mozjpeg: true }).toFile('assets/email/header.jpg');
  await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><rect width="44" height="44" fill="#FAF7F2"/>' +
    '<path d="M44 0H0V44" fill="none" stroke="#191919" stroke-opacity=".055" stroke-width="1"/></svg>')).png().toFile('assets/email/grid.png');
  console.log('  assets/email/header.jpg  ' + Math.round(fs.statSync('assets/email/header.jpg').size / 1024) + 'KB');
  console.log('  assets/email/grid.png    ' + fs.statSync('assets/email/grid.png').size + 'B');
})();
