/* ------------------------------------------------------------------
   Reads the model folders and builds the shop catalogs from them.

   Nothing needs renaming by hand. Files are grouped by their name with
   punctuation and case ignored, so these three are understood to be one
   product even though no two of them are spelled the same:

       flippa_functional_coffee_table_w._storagewalnut.glb
       flippa_functional_coffee_table_w._storagewalnut.png
       Flippa_Functional_Coffee_Table_w.usdz

   What it does with each product:
     - gives it a clean slug and a readable name
     - reads the real size out of the .glb and writes it in centimetres,
       so the catalog states what the model will actually be when it
       stands on someone's floor
     - re-encodes the thumbnail to webp
     - notes whether a .glb and .usdz exist, ready for the AR button

   Prices are NOT in the files, so new products get a placeholder. Prices
   already in stores.js are kept, so editing one and re-running is safe.

   Run:  npm run shops
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = 'C:/Users/Ehtisham/Desktop/AR QR/Cards';
const OUT = 'assets/shops';

const SHOPS = [
  { dir: 'Furniture',   slug: 'novara' },
  { dir: 'Shoes',       slug: 'corso'  },
  { dir: 'Decorations', slug: 'maison' },
  { dir: 'Carpet  Rug', slug: 'terra'  }
];

/* which category a product falls in, by what its name says */
const CATS = {
  novara: [[/sofa|couch|settee|bed/, 'Seating'], [/chair|armchair|stool/, 'Seating'],
           [/table|desk|lowboard|tv/, 'Tables'], [/shelf|cabinet|storage|sideboard/, 'Storage']],
  corso:  [[/boot/, 'Boots'], [/heel|sandal|mule/, 'Formal'],
           [/sneaker|runner|sport|asics|adidas|hoka|racer|safety/, 'Casual']],
  maison: [[/lamp|light|pendant|censer/, 'Lighting'], [/painting|frame|photoframe|wall|clock/, 'Wall'],
           [/statue|cat|ibex|plant|vase/, 'Objects']],
  terra:  [[/runner|kilim/, 'Runners'], [/persian|heriz|nain|tabriz|turkish|bhadoi|tufted/, 'Hand-knotted'],
           [/boho|game|carpet/, 'Flatweave']]
};
const FALLBACK = { novara: 'Seating', corso: 'Casual', maison: 'Objects', terra: 'Flatweave' };

/* the icon each product falls back to before its photo loads */
const ICONS = {
  novara: [[/sofa|settee|couch/, 'ic-sofa'], [/bed/, 'ic-bed'], [/chair|armchair|stool/, 'ic-chair'],
           [/table|lowboard|tv/, 'ic-table'], [/shelf|cabinet|sideboard|storage/, 'ic-side']],
  corso:  [[/boot/, 'ic-chelsea'], [/heel/, 'ic-oxford'], [/sandal|mule/, 'ic-loafer'],
           [/sneaker|runner|sport|asics|adidas|hoka|racer|safety|shoe/, 'ic-sneaker']],
  maison: [[/lamp|light|pendant/, 'ic-pendant'], [/painting|frame|photoframe/, 'ic-frame'],
           [/clock|censer/, 'ic-lantern'], [/statue|cat|ibex/, 'ic-object'], [/plant|vase/, 'ic-vase']],
  terra:  [[/runner|kilim/, 'ic-runner'], [/round|circle/, 'ic-round']]
};
const ICON_FALLBACK = { novara: 'ic-chair', corso: 'ic-derby', maison: 'ic-object', terra: 'ic-rug' };

/* words that belong to the source file, not to a product */
const NOISE = /\b(4096px2?|4096px|pbr|game|ready|free|scanned|photorealistic|left|right|animation|scan|02a|themasie|emba|dway|storagewalnut|i)\b/gi;

const key = s => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]/g, '');
const slugify = s => s.toLowerCase().replace(/\.[a-z0-9]+$/, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');

function title(base){
  let t = base.replace(/\.[a-z0-9]+$/, '').replace(/[_\-.]+/g, ' ');
  t = t.replace(NOISE, ' ').replace(/\s{2,}/g, ' ').trim();
  t = t.replace(/\b\w/g, c => c.toUpperCase());
  t = t.replace(/\bTv\b/g, 'TV').replace(/\bYsl\b/g, 'YSL').replace(/\s+w$/i, '');
  t = t.replace(/\bLandscape1\b/g, 'Landscape').replace(/\(2\)/g, 'II');
  t = t.replace(/\s+/g, ' ').trim();
  return t || base;
}

/* ---------------- the real size, read out of the model ---------------- */
function mul(a, b){
  const o = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++)
    for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
function trs(n){
  const t = n.translation || [0,0,0], r = n.rotation || [0,0,0,1], s = n.scale || [1,1,1];
  const [x,y,z,w] = r;
  const m = [
    (1-2*(y*y+z*z))*s[0], (2*(x*y+z*w))*s[0], (2*(x*z-y*w))*s[0], 0,
    (2*(x*y-z*w))*s[1], (1-2*(x*x+z*z))*s[1], (2*(y*z+x*w))*s[1], 0,
    (2*(x*z+y*w))*s[2], (2*(y*z-x*w))*s[2], (1-2*(x*x+y*y))*s[2], 0,
    t[0], t[1], t[2], 1
  ];
  return m;
}
function glbSize(file){
  let buf;
  try { buf = fs.readFileSync(file); } catch (e) { return null; }
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546C67) return null;   /* 'glTF' */
  let off = 12, json = null;
  while (off + 8 <= buf.length){
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    if (type === 0x4E4F534A){ json = buf.slice(off + 8, off + 8 + len).toString('utf8'); break; }
    off += 8 + len + (len % 4 ? 4 - (len % 4) : 0);
  }
  if (!json) return null;
  let g; try { g = JSON.parse(json); } catch (e) { return null; }
  if (!g.meshes || !g.accessors || !g.nodes) return null;

  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  const eye = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

  function walk(i, parent){
    const n = g.nodes[i];
    if (!n) return;
    const local = n.matrix ? n.matrix : trs(n);
    const world = mul(parent, local);
    if (n.mesh !== undefined && g.meshes[n.mesh]){
      (g.meshes[n.mesh].primitives || []).forEach(pr => {
        const a = g.accessors[pr.attributes && pr.attributes.POSITION];
        if (!a || !a.min || !a.max) return;
        for (let bx = 0; bx < 8; bx++){
          const p = [bx & 1 ? a.max[0] : a.min[0],
                     bx & 2 ? a.max[1] : a.min[1],
                     bx & 4 ? a.max[2] : a.min[2]];
          for (let axis = 0; axis < 3; axis++){
            const v = world[axis] * p[0] + world[4 + axis] * p[1] +
                      world[8 + axis] * p[2] + world[12 + axis];
            if (v < lo[axis]) lo[axis] = v;
            if (v > hi[axis]) hi[axis] = v;
          }
        }
      });
    }
    (n.children || []).forEach(c => walk(c, world));
  }
  const scene = g.scenes && g.scenes[g.scene || 0];
  (scene && scene.nodes ? scene.nodes : g.nodes.map((_, i) => i)).forEach(i => walk(i, eye));
  if (!isFinite(lo[0])) return null;
  return [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];   /* raw model units */
}

/* What a sensible product of this trade measures, in centimetres. Used to
   work out what unit a model was authored in — glTF says metres, but half of
   these were plainly exported in centimetres or millimetres, and taking the
   number at face value produced a 334-metre armchair. */
const PLAUSIBLE = {
  /* A floor as well as a ceiling. A 33cm sofa slipped through when the floor
     was 25: the millimetre reading of a 334-unit model lands right there and
     looks plausible to a check that only argues about the ceiling. */
  novara: [45, 320], corso: [18, 50], maison: [6, 240], terra: [70, 520]
};

/* raw units -> centimetres, by trying each unit and keeping the one that
   gives a believable object. Returns null when none of them do, and the
   caller falls back rather than printing a number it cannot stand behind. */
function toCm(shop, raw){
  if (!raw) return null;
  const band = PLAUSIBLE[shop];
  for (const f of [100, 1, 0.1]){                 /* metres, centimetres, millimetres */
    const v = raw.map(x => Math.round(x * f));
    const max = Math.max(...v), min = Math.min(...v);
    if (max >= band[0] && max <= band[1] && min >= 1) return v;
  }
  return null;
}

/* dimensions the way a shopper reads them, per trade */
function dims(shop, size){
  if (shop === 'corso') return 'EU 36–46';
  if (!size) return '';
  const [w, h, d] = size;
  if (shop === 'terra')  return Math.max(w, d) + ' × ' + Math.min(w, d) + ' cm';
  if (shop === 'maison') return h >= Math.max(w, d) ? 'H ' + h + ' cm' : w + ' × ' + h + ' cm';
  return w + ' × ' + h + ' cm';
}

/* when the model cannot be trusted, a stated sample size for that trade */
const STAND_IN = {
  novara: ['180 × 85 cm', '78 × 82 cm', '120 × 45 cm', '210 × 90 cm'],
  corso:  ['EU 36–46'],
  maison: ['H 42 cm', 'H 28 cm', '60 × 90 cm', 'Ø 35 cm'],
  terra:  ['240 × 170 cm', '200 × 140 cm', '300 × 200 cm', '160 × 230 cm']
};

function pick(table, name, fallback){
  for (const [re, val] of table) if (re.test(name)) return val;
  return fallback;
}

/* a stable placeholder price, so re-running does not shuffle them */
function price(shop, slug){
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const band = { novara: [420, 2600], corso: [95, 340], maison: [120, 780], terra: [260, 2200] }[shop];
  const v = band[0] + (h % (band[1] - band[0]));
  return '$' + (Math.round(v / 10) * 10).toLocaleString('en-US');
}

/* ------------------------------------------------------------------ */
(async () => {
  const existing = readExisting();
  const out = {};
  let copied = 0, thumbBytes = 0, missing = [], unsure = [];

  for (const shop of SHOPS){
    const dir = path.join(SRC, shop.dir);
    if (!fs.existsSync(dir)){ console.log('  ! missing folder: ' + dir); continue; }
    const files = fs.readdirSync(dir);

    const groups = {};
    files.forEach(f => {
      const ext = path.extname(f).toLowerCase();
      if (!['.glb', '.usdz', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return;
      const k = key(f);
      (groups[k] = groups[k] || { base: null, glb: null, usdz: null, img: null });
      if (ext === '.glb'){ groups[k].glb = f; groups[k].base = groups[k].base || f; }
      else if (ext === '.usdz') groups[k].usdz = f;
      else { groups[k].img = f; groups[k].base = groups[k].base || f; }
    });

    /* A couple of the usdz files are named differently from their glb and
       png — Flippa_Functional_Coffee_Table_w.usdz against
       flippa_functional_coffee_table_w._storagewalnut.glb, and a superscript
       two against a plain one. Rather than ask for renaming, an orphan usdz
       is handed to the group whose name it is a prefix of. */
    Object.keys(groups).forEach(k => {
      const g = groups[k];
      if (!g.usdz || g.img || g.glb) return;                    /* not an orphan */
      const host = Object.keys(groups).find(o => o !== k && !groups[o].usdz &&
        (o.indexOf(k) === 0 || k.indexOf(o) === 0));
      if (host){ groups[host].usdz = g.usdz; delete groups[k]; }
    });

    fs.mkdirSync(path.join(OUT, shop.slug), { recursive: true });
    const items = [];

    for (const k of Object.keys(groups).sort()){
      const g = groups[k];
      if (!g.img){ missing.push(shop.slug + '/' + k + ' — no thumbnail'); continue; }
      const slug = slugify(g.base);
      const name = title(g.base);
      const raw = g.glb ? glbSize(path.join(dir, g.glb)) : null;
      const size = toCm(shop.slug, raw);
      if (raw && !size) unsure.push(shop.slug + '/' + slugify(g.base));
      const low = name.toLowerCase();

      const dest = path.join(OUT, shop.slug, slug + '.webp');
      const buf = await sharp(path.join(dir, g.img))
        .resize({ width: 900, withoutEnlargement: true })
        .webp({ quality: 82, effort: 6 }).toBuffer();
      fs.writeFileSync(dest, buf);
      copied++; thumbBytes += buf.length;

      const prev = existing[shop.slug] && existing[shop.slug][slug];
      items.push({
        n: name,
        p: prev && prev.p ? prev.p : price(shop.slug, slug),
        d: prev && prev.d ? prev.d
           : (dims(shop.slug, size) ||
              STAND_IN[shop.slug][items.length % STAND_IN[shop.slug].length]),
        dReal: !!(size || shop.slug === 'corso'),
        c: prev && prev.c ? prev.c : pick(CATS[shop.slug], low, FALLBACK[shop.slug]),
        i: pick(ICONS[shop.slug], low, ICON_FALLBACK[shop.slug]),
        f: slug,
        hasGlb: !!g.glb,
        hasUsdz: !!g.usdz,
        srcGlb: g.glb || null,
        srcUsdz: g.usdz || null
      });
    }
    /* Two products called Table Lamp is a catalog fault, not a name. Where
       cleaned-up names collide, the later one keeps a word from its own file
       that the first one does not have. */
    const byName = {};
    items.forEach(it => {
      if (!byName[it.n]){ byName[it.n] = it; return; }
      const first = byName[it.n].f.split('-');
      const extra = it.f.split('-').filter(w => first.indexOf(w) < 0 && w.length > 2);
      it.n += extra.length
        ? ' ' + extra[0].charAt(0).toUpperCase() + extra[0].slice(1)
        : ' II';
    });

    out[shop.slug] = items;
    const withModels = items.filter(i => i.hasGlb && i.hasUsdz).length;
    console.log('  ' + shop.slug.padEnd(8) + String(items.length).padStart(2) + ' products   ' +
                withModels + ' with both a glb and a usdz');
  }

  fs.writeFileSync('shop-products.json', JSON.stringify(out, null, 2));
  console.log('\n  ' + copied + ' thumbnails -> ' + (thumbBytes / 1048576).toFixed(1) + ' MB total');
  if (missing.length) console.log('  unmatched: ' + missing.join(', '));
  if (unsure.length){
    console.log('');
    console.log('  ' + unsure.length + ' models gave a size no unit made sense of:');
    unsure.forEach(u => console.log('    ' + u));
  }
  console.log('  product list written to shop-products.json');
})().catch(e => { console.error(e); process.exit(1); });

/* keep any price, size or category already set in stores.js */
function readExisting(){
  const out = {};
  if (!fs.existsSync('stores.js')) return out;
  const box = { window: {} };
  try { new Function('window', fs.readFileSync('stores.js', 'utf8'))(box.window); } catch (e) { return out; }
  (box.window.ARQR_STORES || []).forEach(s => {
    out[s.slug] = {};
    (s.items || []).forEach(it => { if (it.f) out[s.slug][it.f] = it; });
  });
  return out;
}
