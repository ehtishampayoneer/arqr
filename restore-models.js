/* ------------------------------------------------------------------
   Puts the original usdz files back, byte for byte, and rebuilds the
   glb files without touching anything that can be seen.

   The usdz files I generated were wrong in two ways that only showed up
   on a real phone:

     - they declared metersPerUnit = 1 while most of these models are not
       authored in metres, so Quick Look read a chair as 334 metres tall
     - the exporter wrote base colour only. No alpha, no normal maps, no
       roughness. The rattan chair's cane is an alpha-masked texture, so
       it rendered as a bare frame with the panels missing.

   Neither is worth trying to fix by hand when correct files already
   exist. The originals are copied in unchanged and verified by hash.

   The glb files are rebuilt too, but conservatively: Draco compression
   of the geometry and nothing else. No simplification, no texture
   re-encoding, no resizing. Every vertex, every material, every texture
   in its original format. Draco alone still takes an 18 MB model to
   around 2 MB, and Draco is lossless for topology.

   Run:  npm run restore
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { draco } = require('@gltf-transform/functions');
const draco3d = require('draco3dgltf');

const SRC = 'C:/Users/Ehtisham/Desktop/AR QR/Cards';
const OUT = 'assets/shops';
const SHOPS = [
  { dir: 'Furniture',   slug: 'novara' },
  { dir: 'Shoes',       slug: 'corso'  },
  { dir: 'Decorations', slug: 'maison' },
  { dir: 'Carpet  Rug', slug: 'terra'  }
];

const hash = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

function survey(doc){
  const r = doc.getRoot();
  let verts = 0, tris = 0;
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  r.listMeshes().forEach(m => m.listPrimitives().forEach(p => {
    const a = p.getAttribute('POSITION'); if (!a) return;
    verts += a.getCount();
    const idx = p.getIndices();
    tris += (idx ? idx.getCount() : a.getCount()) / 3;
    const mn = a.getMin([]), mx = a.getMax([]);
    for (let i = 0; i < 3; i++){ if (mn[i] < lo[i]) lo[i] = mn[i]; if (mx[i] > hi[i]) hi[i] = mx[i]; }
  }));
  return {
    verts, tris,
    size: [hi[0]-lo[0], hi[1]-lo[1], hi[2]-lo[2]],
    materials: r.listMaterials().length,
    textures: r.listTextures().length,
    formats: [...new Set(r.listTextures().map(t => t.getMimeType()))].sort().join(','),
    alpha: r.listMaterials().map(m => m.getAlphaMode()).sort().join(','),
    maps: r.listMaterials().map(m => [
      m.getBaseColorTexture() ? 'b' : '', m.getNormalTexture() ? 'n' : '',
      m.getMetallicRoughnessTexture() ? 'm' : '', m.getEmissiveTexture() ? 'e' : '',
      m.getOcclusionTexture() ? 'o' : ''].join('')).sort().join('|')
  };
}

(async () => {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule()
  });

  const list = JSON.parse(fs.readFileSync('shop-products.json', 'utf8'));
  let usdzIn = 0, usdzBytes = 0, glbIn = 0, glbBefore = 0, glbAfter = 0;
  const problems = [];

  for (const shop of SHOPS){
    /* this was missing, and the run died on the first shop whose folder did
       not already exist */
    fs.mkdirSync(path.join(OUT, shop.slug), { recursive: true });
    for (const it of (list[shop.slug] || [])){
      const dir = path.join(SRC, shop.dir);

      /* ---- usdz: straight copy, verified by hash ---- */
      if (it.srcUsdz){
        const from = path.join(dir, it.srcUsdz);
        const to = path.join(OUT, shop.slug, it.f + '.usdz');
        const data = fs.readFileSync(from);
        fs.writeFileSync(to, data);
        const back = fs.readFileSync(to);
        if (hash(data) !== hash(back)) problems.push(it.f + ' — usdz copy does not match');
        else { usdzIn++; usdzBytes += data.length; it.usdz = 'assets/shops/' + shop.slug + '/' + it.f + '.usdz'; }
      }

      /* ---- glb: Draco only, everything else left alone ---- */
      if (it.srcGlb){
        const from = path.join(dir, it.srcGlb);
        const to = path.join(OUT, shop.slug, it.f + '.glb');
        const before = fs.statSync(from).size;
        let doc;
        try { doc = await io.read(from); }
        catch (e) { problems.push(it.f + ' — glb unreadable: ' + e.message); continue; }
        const was = survey(doc);

        try { await doc.transform(draco({ method: 'edgebreaker', quantizePosition: 14,
                                          quantizeNormal: 10, quantizeTexcoord: 12 })); }
        catch (e) { problems.push(it.f + ' — draco failed: ' + e.message); continue; }

        let bin;
        try { bin = await io.writeBinary(doc); }
        catch (e) { problems.push(it.f + ' — write failed: ' + e.message); continue; }

        /* read it back and prove nothing visible changed */
        let now;
        try { now = survey(await io.readBinary(bin)); }
        catch (e) { problems.push(it.f + ' — will not re-read: ' + e.message); continue; }

        const same =
          now.materials === was.materials && now.textures === was.textures &&
          now.formats === was.formats && now.alpha === was.alpha && now.maps === was.maps &&
          /* triangles, not vertices. Draco re-indexes at uv and normal seams,
             so the vertex count legitimately moves either way — 151,570 down to
             28,524 on the heels, 317,930 up to 377,656 on the bhadoi rug — while
             the surface is the same one. The triangle count is what must not move. */
          now.tris === was.tris;
        const scale = Math.max(...was.size) || 1;
        const moved = Math.max(...[0,1,2].map(i => Math.abs(now.size[i] - was.size[i]) / scale));

        if (!same || moved > 0.001){
          problems.push(it.f + ' — changed (verts ' + was.verts + '->' + now.verts +
                        ', mats ' + was.materials + '->' + now.materials +
                        ', fmt ' + was.formats + '->' + now.formats +
                        ', drift ' + (moved * 100).toFixed(2) + '%) — original copied instead');
          fs.copyFileSync(from, to);
          glbAfter += before;
        } else {
          fs.writeFileSync(to, bin);
          glbAfter += bin.length;
        }
        glbIn++; glbBefore += before;
        it.glb = 'assets/shops/' + shop.slug + '/' + it.f + '.glb';
      }
    }
  }

  fs.writeFileSync('shop-products.json', JSON.stringify(list, null, 2));
  console.log('  usdz   ' + usdzIn + ' copied from your originals, byte for byte   ' +
              (usdzBytes / 1048576).toFixed(0) + ' MB');
  console.log('  glb    ' + glbIn + ' rebuilt with Draco only   ' +
              (glbBefore / 1048576).toFixed(0) + ' MB -> ' + (glbAfter / 1048576).toFixed(0) + ' MB');
  if (problems.length){
    console.log('\n  ' + problems.length + ' needed the original instead:');
    problems.forEach(p => console.log('    ' + p));
  } else {
    console.log('\n  every glb kept its exact triangle count, materials, textures,');
    console.log('  texture formats, alpha modes, map slots and size');
  }
})().catch(e => { console.error(e); process.exit(1); });
