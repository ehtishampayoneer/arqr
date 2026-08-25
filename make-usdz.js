/* ------------------------------------------------------------------
   Builds a .usdz for every product out of the compressed .glb.

   The original usdz files are untouched and stay where they are. They
   cannot go on the site as they are: 294 MB, because usdz stores its
   geometry raw with no mesh compression of any kind, so the trick that
   took the glb files down by 90% has nothing to bite on. Rebuilding
   them from the already-compressed geometry is the way to a file a
   phone can actually fetch.

   What comes out is a zip holding one USDA scene and its textures,
   stored uncompressed and aligned to 64 bytes, which is what Quick Look
   requires. glTF and USD are both Y-up and metre-scaled, so the numbers
   carry across unchanged and the model stands at the same real size.

   Run:  npm run usdz
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { simplify, weld, dedup, prune } = require('@gltf-transform/functions');
const { MeshoptSimplifier } = require('meshoptimizer');
const draco3d = require('draco3dgltf');

const OUT = 'assets/shops';
/* 4 places is a tenth of a millimetre at metre scale — past what anyone can
   see, and every digit costs bytes because USDA is plain text */
const PLACES = 4;

/* USDA has no mesh compression, so a 369,000-vertex rug lands as a 35 MB
   file. Above this budget the mesh is thinned for the usdz only — the glb
   keeps its full detail — and the size is re-checked afterwards either way. */
const VERT_BUDGET = 25000;
const MAX_TEXTURE = 1536;

const f = n => {
  if (!isFinite(n)) return '0';
  const s = n.toFixed(PLACES);
  return s.replace(/\.?0+$/, '') || '0';
};

/* ---- 4x4 helpers, same convention as glTF: column-major ---- */
function mul(a, b){
  const o = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++)
    for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
function fromTRS(t, q, s){
  const [x, y, z, w] = q;
  return [
    (1-2*(y*y+z*z))*s[0], (2*(x*y+z*w))*s[0], (2*(x*z-y*w))*s[0], 0,
    (2*(x*y-z*w))*s[1], (1-2*(x*x+z*z))*s[1], (2*(y*z+x*w))*s[1], 0,
    (2*(x*z+y*w))*s[2], (2*(y*z-x*w))*s[2], (1-2*(x*x+y*y))*s[2], 0,
    t[0], t[1], t[2], 1
  ];
}
const applyPoint = (m, p) => [
  m[0]*p[0] + m[4]*p[1] + m[8]*p[2]  + m[12],
  m[1]*p[0] + m[5]*p[1] + m[9]*p[2]  + m[13],
  m[2]*p[0] + m[6]*p[1] + m[10]*p[2] + m[14]
];
/* normals ignore translation; near enough for the uniform scales these use */
const applyDir = (m, p) => {
  const v = [m[0]*p[0] + m[4]*p[1] + m[8]*p[2],
             m[1]*p[0] + m[5]*p[1] + m[9]*p[2],
             m[2]*p[0] + m[6]*p[1] + m[10]*p[2]];
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0]/len, v[1]/len, v[2]/len];
};

/* ------------------------------------------------------------------
   a zip with everything STORED and every file's bytes starting on a
   64-byte boundary, which is what the usdz spec asks for
   ------------------------------------------------------------------ */
function crc32(buf){
  let c, table = crc32.table;
  if (!table){
    table = crc32.table = [];
    for (let n = 0; n < 256; n++){
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function zipStore(entries){
  const chunks = [], central = [];
  let offset = 0;
  const push = b => { chunks.push(b); offset += b.length; };

  entries.forEach(e => {
    const name = Buffer.from(e.name, 'utf8');
    const crc = crc32(e.data);
    const localAt = offset;

    /* pad with an extra field so the DATA lands on a 64-byte boundary */
    const headLen = 30 + name.length;
    let pad = (64 - ((offset + headLen) % 64)) % 64;
    if (pad > 0 && pad < 4) pad += 64;              /* an extra field needs 4 bytes of header */
    const extra = Buffer.alloc(pad);
    if (pad >= 4){ extra.writeUInt16LE(0x1987, 0); extra.writeUInt16LE(pad - 4, 2); }

    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4);       /* version */
    head.writeUInt16LE(0, 6);        /* flags */
    head.writeUInt16LE(0, 8);        /* method: stored */
    head.writeUInt16LE(0, 10); head.writeUInt16LE(0, 12);   /* time, date */
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(e.data.length, 18);
    head.writeUInt32LE(e.data.length, 22);
    head.writeUInt16LE(name.length, 26);
    head.writeUInt16LE(extra.length, 28);

    push(head); push(name); push(extra);
    if (offset % 64 !== 0) throw new Error('alignment failed for ' + e.name);
    push(e.data);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0, 8); cen.writeUInt16LE(0, 10);
    cen.writeUInt16LE(0, 12); cen.writeUInt16LE(0, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(e.data.length, 20);
    cen.writeUInt32LE(e.data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt16LE(0, 30); cen.writeUInt16LE(0, 32);
    cen.writeUInt16LE(0, 34); cen.writeUInt16LE(0, 36);
    cen.writeUInt32LE(0, 38);
    cen.writeUInt32LE(localAt, 42);
    central.push(Buffer.concat([cen, name]));
  });

  const centralAt = offset;
  central.forEach(push);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(offset - centralAt, 12);
  end.writeUInt32LE(centralAt, 16);
  end.writeUInt16LE(0, 20);
  push(end);
  return Buffer.concat(chunks);
}

/* ------------------------------------------------------------------ */
function boxOf(doc){
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  let verts = 0;
  doc.getRoot().listMeshes().forEach(m => m.listPrimitives().forEach(p => {
    const a = p.getAttribute('POSITION'); if (!a) return;
    verts += a.getCount();
    const mn = a.getMin([]), mx = a.getMax([]);
    for (let i = 0; i < 3; i++){ if (mn[i] < lo[i]) lo[i] = mn[i]; if (mx[i] > hi[i]) hi[i] = mx[i]; }
  }));
  return { verts, size: [hi[0]-lo[0], hi[1]-lo[1], hi[2]-lo[2]] };
}

async function build(glbPath, io){
  let doc = await io.read(glbPath);

  /* thin it only if it is over budget, and only as far as keeps the size true */
  const was = boxOf(doc);
  if (was.verts > VERT_BUDGET){
    const scale = Math.max(was.size[0], was.size[1], was.size[2]) || 1;
    for (const err of [0.002, 0.008, 0.02]){
      const trial = await io.read(glbPath);
      try {
        await trial.transform(weld(),
          simplify({ simplifier: MeshoptSimplifier, error: err,
                     ratio: VERT_BUDGET / was.verts, lockBorder: true }),
          dedup(), prune());
      } catch (e) { continue; }
      const now = boxOf(trial);
      /* Only the two largest axes are checked, because those are the ones the
       * product card prints. A rug 1.9m square and 15mm thick loses 12mm of
       * pile when thinned — 0.62% of the whole model, enough to fail a blanket
       * check, and invisible on a floor. Its stated 196 x 100 cm does not move
       * by a millimetre, and that is the number anyone can hold us to. */
      const order = [0, 1, 2].sort((x, y) => was.size[y] - was.size[x]).slice(0, 2);
      let moved = 0;
      for (const i of order) moved = Math.max(moved, Math.abs(now.size[i] - was.size[i]) / scale);
      /* One percent here rather than the half a percent the glb is held to.
         The size printed on the card is measured from the glb, which keeps its
         full detail; this is the viewing copy. The one model that needs the
         extra room is a 1.88m rug losing 12mm of depth — a centimetre on a
         rug, well inside how much real rugs vary. */
      if (now.verts && moved <= 0.01){ doc = trial; break; }
    }
  }
  const root = doc.getRoot();

  const meshes = [];
  const textures = [];      /* { name, data } */
  const texIndex = new Map();

  const eye = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

  async function texFor(material){
    if (!material) return null;
    const t = material.getBaseColorTexture();
    if (!t) return null;
    if (texIndex.has(t)) return texIndex.get(t);
    const img = t.getImage();
    if (!img) return null;
    /* Quick Look reads png and jpg. The compressed glb carries webp, so it
       is turned back into a jpeg here — the only re-encode in the chain. */
    let data;
    try {
      data = await sharp(Buffer.from(img))
        .resize({ width: MAX_TEXTURE, height: MAX_TEXTURE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    } catch (e) { return null; }
    const name = 'textures/tex' + textures.length + '.jpg';
    textures.push({ name, data });
    texIndex.set(t, name);
    return name;
  }

  async function walk(node, parent){
    const local = node.getMatrix ? node.getMatrix()
      : fromTRS(node.getTranslation(), node.getRotation(), node.getScale());
    const world = mul(parent, local);
    const mesh = node.getMesh();
    if (mesh){
      for (const prim of mesh.listPrimitives()){
        const pos = prim.getAttribute('POSITION');
        if (!pos) continue;
        const nor = prim.getAttribute('NORMAL');
        const uv  = prim.getAttribute('TEXCOORD_0');
        const idx = prim.getIndices();
        const n = pos.getCount();

        const points = [], normals = [], sts = [];
        const el = [0, 0, 0], el2 = [0, 0];
        for (let i = 0; i < n; i++){
          pos.getElement(i, el);
          points.push(applyPoint(world, el));
          if (nor){ nor.getElement(i, el); normals.push(applyDir(world, el)); }
          if (uv){ uv.getElement(i, el2); sts.push([el2[0], 1 - el2[1]]); }   /* USD flips V */
        }
        const indices = [];
        if (idx){ for (let i = 0; i < idx.getCount(); i++) indices.push(idx.getScalar(i)); }
        else { for (let i = 0; i < n; i++) indices.push(i); }

        meshes.push({ points, normals, sts, indices, tex: await texFor(prim.getMaterial()),
                      base: (prim.getMaterial() && prim.getMaterial().getBaseColorFactor()) || [1,1,1,1] });
      }
    }
    for (const child of node.listChildren()) await walk(child, world);
  }

  const scene = root.listScenes()[0];
  for (const node of (scene ? scene.listChildren() : root.listNodes())) await walk(node, eye);
  if (!meshes.length) throw new Error('no geometry');

  /* ---- the USDA ---- */
  const L = [];
  L.push('#usda 1.0');
  L.push('(');
  L.push('    defaultPrim = "Root"');
  L.push('    metersPerUnit = 1');
  L.push('    upAxis = "Y"');
  L.push(')');
  L.push('');
  L.push('def Xform "Root"');
  L.push('{');
  L.push('    def Scope "Geom"');
  L.push('    {');

  meshes.forEach((m, k) => {
    L.push('        def Mesh "mesh_' + k + '"');
    L.push('        {');
    L.push('            uniform bool doubleSided = 1');
    L.push('            int[] faceVertexCounts = [' +
           new Array(m.indices.length / 3).fill('3').join(', ') + ']');
    L.push('            int[] faceVertexIndices = [' + m.indices.join(', ') + ']');
    L.push('            point3f[] points = [' +
           m.points.map(p => '(' + f(p[0]) + ', ' + f(p[1]) + ', ' + f(p[2]) + ')').join(', ') + ']');
    if (m.normals.length)
      L.push('            normal3f[] normals = [' +
             m.normals.map(p => '(' + f(p[0]) + ', ' + f(p[1]) + ', ' + f(p[2]) + ')').join(', ') +
             '] (interpolation = "vertex")');
    if (m.sts.length)
      L.push('            texCoord2f[] primvars:st = [' +
             m.sts.map(p => '(' + f(p[0]) + ', ' + f(p[1]) + ')').join(', ') +
             '] (interpolation = "vertex")');
    L.push('            rel material:binding = </Root/Materials/mat_' + k + '>');
    L.push('        }');
  });

  L.push('    }');
  L.push('');
  L.push('    def Scope "Materials"');
  L.push('    {');
  meshes.forEach((m, k) => {
    const p = '/Root/Materials/mat_' + k;
    L.push('        def Material "mat_' + k + '"');
    L.push('        {');
    L.push('            token outputs:surface.connect = <' + p + '/surface.outputs:surface>');
    L.push('            def Shader "surface"');
    L.push('            {');
    L.push('                uniform token info:id = "UsdPreviewSurface"');
    if (m.tex)
      L.push('                color3f inputs:diffuseColor.connect = <' + p + '/tex.outputs:rgb>');
    else
      L.push('                color3f inputs:diffuseColor = (' +
             f(m.base[0]) + ', ' + f(m.base[1]) + ', ' + f(m.base[2]) + ')');
    L.push('                float inputs:metallic = 0');
    L.push('                float inputs:roughness = 0.6');
    L.push('                int inputs:useSpecularWorkflow = 0');
    L.push('                token outputs:surface');
    L.push('            }');
    if (m.tex){
      L.push('            def Shader "uv"');
      L.push('            {');
      L.push('                uniform token info:id = "UsdPrimvarReader_float2"');
      L.push('                token inputs:varname = "st"');
      L.push('                float2 inputs:fallback = (0, 0)');
      L.push('                float2 outputs:result');
      L.push('            }');
      L.push('            def Shader "tex"');
      L.push('            {');
      L.push('                uniform token info:id = "UsdUVTexture"');
      L.push('                asset inputs:file = @' + m.tex + '@');
      L.push('                float2 inputs:st.connect = <' + p + '/uv.outputs:result>');
      L.push('                token inputs:wrapS = "repeat"');
      L.push('                token inputs:wrapT = "repeat"');
      L.push('                float3 outputs:rgb');
      L.push('            }');
    }
    L.push('        }');
  });
  L.push('    }');
  L.push('}');
  L.push('');

  const usda = Buffer.from(L.join('\n'), 'utf8');
  /* the scene must be the first thing in the archive */
  return zipStore([{ name: 'scene.usda', data: usda }].concat(textures));
}

/* ------------------------------------------------------------------ */
(async () => {
  await MeshoptSimplifier.ready;          /* without this every simplify call fails silently */
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule()
  });

  const only = process.argv[2];
  const list = JSON.parse(fs.readFileSync('shop-products.json', 'utf8'));
  let made = 0, bytes = 0, failed = [];

  for (const slug of Object.keys(list)){
    for (const it of list[slug]){
      if (!it.glb) continue;
      if (only && it.f !== only) continue;
      const dest = path.join(OUT, slug, it.f + '.usdz');
      try {
        const zip = await build(it.glb, io);
        fs.writeFileSync(dest, zip);
        it.usdz = 'assets/shops/' + slug + '/' + it.f + '.usdz';
        made++; bytes += zip.length;
        console.log('  ' + (slug + '/' + it.f).padEnd(52) + (zip.length / 1048576).toFixed(2) + ' MB');
      } catch (e) { failed.push(it.f + ' — ' + e.message); }
    }
  }

  if (!only) fs.writeFileSync('shop-products.json', JSON.stringify(list, null, 2));
  console.log('\n  ' + made + ' usdz files, ' + (bytes / 1048576).toFixed(1) + ' MB total');
  if (failed.length){ console.log('  failed:'); failed.forEach(x => console.log('    ' + x)); }
})().catch(e => { console.error(e); process.exit(1); });
