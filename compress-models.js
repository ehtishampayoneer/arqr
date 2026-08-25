/* ==================================================================
   SUPERSEDED — DO NOT RUN. Kept only so the mistake stays readable.

   This is what damaged the model files. Between the two of them they
   shipped usdz that declared metersPerUnit = 1 on models that are not
   authored in metres (a chair read as 334 metres tall in Quick Look)
   and wrote base colour only, so alpha-masked and normal-mapped
   materials disappeared — the rattan chair rendered as a bare frame.

   restore-models.js replaces both: it copies the original usdz files
   in byte for byte and rebuilds the glb with Draco and nothing else.
   ================================================================== */
/* ------------------------------------------------------------------
   Makes the models small enough to send to a phone.

   The weight is geometry, not textures. These meshes are wildly
   over-tessellated — a flat carpet arriving with 329,000 vertices — so
   the order is: weld duplicate vertices, drop the ones that make no
   visible difference at a very tight error tolerance, shrink oversized
   textures, then Draco-compress what is left.

   Two things are checked on every model, and it is skipped rather than
   written if either fails:

     - the bounding box must not move by more than half a percent, or
       the stated size on the product card stops being true, and "true
       to scale" is the whole pitch
     - the file must read back and still contain geometry

   Run:  npm run models
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { draco, textureCompress, simplify, weld, dedup, prune, resample } =
  require('@gltf-transform/functions');
const { MeshoptSimplifier } = require('meshoptimizer');
const draco3d = require('draco3dgltf');

const SRC = 'C:/Users/Ehtisham/Desktop/AR QR/Cards';
const OUT = 'assets/shops';
const SHOPS = [
  { dir: 'Furniture',   slug: 'novara' },
  { dir: 'Shoes',       slug: 'corso'  },
  { dir: 'Decorations', slug: 'maison' },
  { dir: 'Carpet  Rug', slug: 'terra'  }
];

/* 0.0005 is half a thousandth of the model's own size — far below what
   an eye can pick out on a phone, and it still strips most of these */
const ERROR = 0.0005;
const MAX_TEXTURE = 2048;
const BBOX_TOLERANCE = 0.005;                 /* half a percent */

function stats(doc){
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  let verts = 0;
  doc.getRoot().listMeshes().forEach(m => m.listPrimitives().forEach(p => {
    const a = p.getAttribute('POSITION');
    if (!a) return;
    verts += a.getCount();
    const mn = a.getMinNormalized ? a.getMin([]) : null;
    const mx = a.getMax ? a.getMax([]) : null;
    if (mn && mx) for (let i = 0; i < 3; i++){
      if (mn[i] < lo[i]) lo[i] = mn[i];
      if (mx[i] > hi[i]) hi[i] = mx[i];
    }
  }));
  const size = isFinite(lo[0]) ? [hi[0]-lo[0], hi[1]-lo[1], hi[2]-lo[2]] : null;
  return { verts, size };
}

/* How far the size moved, measured against the model's overall size rather
   than axis by axis. Axis-by-axis punishes anything flat: a rug 3.97m wide
   and 1.6cm thick lost 5mm of pile, which is 31% of its thinnest axis and
   0.127% of the rug. The first version rejected six rugs over that and left
   them eight times larger than they needed to be. What matters is whether
   the number printed on the card changes, and that follows the big axes. */
const drift = (a, b) => {
  if (!a || !b) return 0;
  const scale = Math.max(a[0], a[1], a[2]);
  if (scale < 1e-6) return 0;
  let worst = 0;
  for (let i = 0; i < 3; i++) worst = Math.max(worst, Math.abs(b[i] - a[i]) / scale);
  return worst;
};

(async () => {
  await MeshoptSimplifier.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule()
  });

  const list = JSON.parse(fs.readFileSync('shop-products.json', 'utf8'));
  let inBytes = 0, outBytes = 0, done = 0, skipped = [];

  for (const shop of SHOPS){
    const items = list[shop.slug] || [];
    fs.mkdirSync(path.join(OUT, shop.slug), { recursive: true });

    for (const it of items){
      if (!it.srcGlb) continue;
      const src = path.join(SRC, shop.dir, it.srcGlb);
      const dest = path.join(OUT, shop.slug, it.f + '.glb');
      const before = fs.statSync(src).size;

      let doc;
      try { doc = await io.read(src); }
      catch (e) { skipped.push(it.f + ' — unreadable: ' + e.message); continue; }

      const was = stats(doc);

      /* First pass drops redundant vertices. Some of these rugs have fringes
         made of very thin geometry, and taking those off moves the bounding
         box by a tenth — which would make the stated size wrong. When that
         happens the model is rebuilt from source with every vertex kept and
         only Draco doing the work: a smaller saving, but the size stays true. */
      let now, moved, mode = 'simplified';
      try {
        await doc.transform(
          dedup(), resample(), prune(),
          weld(),
          simplify({ simplifier: MeshoptSimplifier, error: ERROR, ratio: 0.0, lockBorder: true }),
          textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 90,
                            resize: [MAX_TEXTURE, MAX_TEXTURE] }),
          draco({ method: 'edgebreaker', quantizePosition: 14,
                  quantizeNormal: 10, quantizeTexcoord: 12 })
        );
        now = stats(doc);
        moved = drift(was.size, now.size);
      } catch (e) { moved = Infinity; }

      if (!now || !now.verts || moved > BBOX_TOLERANCE){
        mode = 'every vertex kept';
        try {
          doc = await io.read(src);
          await doc.transform(
            dedup(), prune(),
            textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 90,
                              resize: [MAX_TEXTURE, MAX_TEXTURE] }),
            draco({ method: 'edgebreaker', quantizePosition: 14,
                    quantizeNormal: 10, quantizeTexcoord: 12 })
          );
          now = stats(doc);
          moved = drift(was.size, now.size);
        } catch (e) { skipped.push(it.f + ' — transform failed: ' + e.message); continue; }
      }

      if (!now.verts){ skipped.push(it.f + ' — ended up with no geometry'); continue; }
      if (moved > BBOX_TOLERANCE){
        skipped.push(it.f + ' — size still moved ' + (moved * 100).toFixed(1) + '%, left alone');
        continue;
      }

      let bin;
      try { bin = await io.writeBinary(doc); }
      catch (e) { skipped.push(it.f + ' — write failed: ' + e.message); continue; }

      /* it has to read back, or it is no use to anybody */
      try {
        const check = await io.readBinary(bin);
        if (!stats(check).verts) throw new Error('no geometry on re-read');
      } catch (e) { skipped.push(it.f + ' — will not re-read: ' + e.message); continue; }

      fs.writeFileSync(dest, bin);
      inBytes += before; outBytes += bin.length; done++;
      it.glb = 'assets/shops/' + shop.slug + '/' + it.f + '.glb';

      console.log('  ' + (shop.slug + '/' + it.f).padEnd(52) +
                  (before / 1048576).toFixed(1).padStart(5) + ' -> ' +
                  (bin.length / 1048576).toFixed(2).padStart(5) + ' MB   ' +
                  was.verts.toLocaleString().padStart(8) + ' -> ' +
                  now.verts.toLocaleString().padStart(7) + ' verts   ' +
                  (moved * 100).toFixed(2) + '% drift   ' + mode);
    }
  }

  fs.writeFileSync('shop-products.json', JSON.stringify(list, null, 2));
  console.log('\n  ' + done + ' models   ' + (inBytes / 1048576).toFixed(0) + ' MB -> ' +
              (outBytes / 1048576).toFixed(1) + ' MB   (' +
              (100 - Math.round(outBytes / inBytes * 100)) + '% smaller)');
  if (skipped.length){
    console.log('\n  ' + skipped.length + ' left alone:');
    skipped.forEach(s => console.log('    ' + s));
  }
})().catch(e => { console.error(e); process.exit(1); });
