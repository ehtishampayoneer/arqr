/* ------------------------------------------------------------------
   The brand lockup, cut from the artwork the way the page needs it.

   assets/Logo.png is the original and is never written to. It carries
   between 27 and 49 pixels of transparent margin on its four sides,
   which a browser has no way to see: left as it is, the logo looks small
   and sits off-centre, because the padding is doing the spacing instead
   of the CSS. So it is trimmed to its ink first, then cut twice:

     logo-lockup  the whole thing, wordmark over the descriptor line.
                  4.34:1, so it needs real width. Desktop and tablet.
     logo-word    the wordmark on its own, 5.99:1. Below 760px the
                  descriptor line would be four pixels tall and
                  unreadable, and dropping it is what pays for the
                  wordmark itself staying big.

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
const CUTS = [
  { out: 'assets/logo-lockup.png', height: 239, css: 48 },
  { out: 'assets/logo-word.png',   height: 173, css: 32 }
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
