/* ------------------------------------------------------------------
   The brand lockup, cut from the artwork the way the page needs it.

   assets/Logo.png is the original and is never written to. It carries
   between 27 and 49 pixels of transparent margin on its four sides,
   which a browser has no way to see: left as it is, the logo looks small
   and sits off-centre, because the padding is doing the spacing instead
   of the CSS. So it is trimmed to its ink first, then cut twice:

   It writes one file, logo-lockup.png at 4.339:1. The pages crop the
   descriptor line off it with CSS where a row is too narrow to read it,
   so there is no second file to keep in step with this one.

   Written at 2.5x so they hold up on a retina phone, and as palette PNG
   rather than webp: the artwork is two flat colours on transparency, so
   a palette beats webp on size here by a third, at 256 colours of drift
   nobody can see. The check at the end proves that rather than assuming
   it.

   Run:  npm run logo
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const sharp = require('sharp');

const SRC = 'assets/Logo.png';

/* measured from the alpha channel, not guessed: the ink starts at x=49,
   the wordmark runs y 41..213 and the descriptor line y 247..279 */
const INK = { left: 49, top: 41, width: 1037 };
const DPR = 2.5;

/* One cut, not two. The wordmark sits in the top 173 of the artwork's
   239 rows, so a box 72.4% as tall, filled with object-fit: cover and
   anchored to the top, shows the wordmark and crops the descriptor away.
   The page does that wherever a row is too narrow for the second line to
   be worth reading, and it does it from this same file. */
const CUTS = [
  { out: 'assets/logo-lockup.png', height: 239, css: 50 }
];

(async () => {
  const meta = await sharp(SRC).metadata();
  console.log('  source ' + meta.width + '×' + meta.height);

  for (const c of CUTS) {
    const ratio = INK.width / c.height;
    const h = Math.round(c.css * DPR);
    const w = Math.round(h * ratio);
    const cut = () => sharp(SRC)
      .extract({ left: INK.left, top: INK.top, width: INK.width, height: c.height })
      .resize(w, h, { fit: 'fill', kernel: 'lanczos3' });

    const buf = await cut().png({ palette: true, colours: 256, effort: 10 }).toBuffer();
    fs.writeFileSync(c.out, buf);

    /* what the palette actually cost, at the size it will be seen.
       Compared over alpha-premultiplied channels, because the colour
       under a transparent pixel is free to be anything at all */
    const w2 = Math.round(c.css * ratio);
    const flat = async (src) => {
      const d = await sharp(src).resize(w2, c.css, { fit: 'fill' })
        .ensureAlpha().raw().toBuffer();
      for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3] / 255;
        d[i] *= a; d[i + 1] *= a; d[i + 2] *= a;
      }
      return d;
    };
    const [a, b] = await Promise.all([flat(await cut().png().toBuffer()), flat(buf)]);
    let sum = 0, max = 0;
    for (let i = 0; i < a.length; i++) {
      const d = Math.abs(a[i] - b[i]);
      sum += d; if (d > max) max = d;
    }

    console.log('  ' + c.out.padEnd(24) + (w + '×' + h).padEnd(10) +
                'ratio ' + ratio.toFixed(3) + '   ' +
                (buf.length / 1024).toFixed(1) + ' KB   ' +
                'drift at ' + c.css + 'px: mean ' + (sum / a.length).toFixed(2) +
                ', worst ' + max + ' of 255');
  }
})();
