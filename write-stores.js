/* ------------------------------------------------------------------
   Takes the product list the importer built and writes it into
   stores.js, replacing each shop's `items` array and its category list
   while leaving every other line of that file alone — the shop names,
   taglines, colours, headlines and button wording are hand-written and
   stay that way.

   Run:  node write-stores.js      (npm run shops does it for you)
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('shop-products.json', 'utf8'));
let src = fs.readFileSync('stores.js', 'utf8');

const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

Object.keys(data).forEach(slug => {
  const items = data[slug];
  if (!items.length) return;

  /* the categories are whatever the products actually turned out to be,
     in a stable order, so a tab can never come up empty */
  const seen = [];
  items.forEach(it => { if (seen.indexOf(it.c) < 0) seen.push(it.c); });
  const cats = ['All'].concat(seen.sort());

  const pad = n => (n + '').padEnd(1);
  const lines = items.map(it => {
    const bits = [
      'n:' + q(it.n),
      'p:' + q(it.p),
      'd:' + q(it.d),
      'c:' + q(it.c),
      'i:' + q(it.i),
      'f:' + q(it.f)
    ];
    if (it.glb)  bits.push('glb:' + q(it.glb));
    if (it.usdz) bits.push('usdz:' + q(it.usdz));
    if (it.tag)  bits.push('tag:' + q(it.tag));
    return '      { ' + bits.join(', ') + ' }';
  }).join(',\n');

  /* find this shop's block, then swap just its cats and items */
  const at = src.indexOf("slug: '" + slug + "'");
  if (at < 0) { console.log('  ! no block for ' + slug); return; }
  const stop = src.indexOf("  {\n    slug:", at + 5);
  const end = stop < 0 ? src.length : stop;
  let block = src.slice(at, end);

  block = block.replace(/cats: \[[^\]]*\]/,
    'cats: [' + cats.map(q).join(', ') + ']');
  block = block.replace(/items: \[[\s\S]*?\n {4}\]/,
    'items: [\n' + lines + '\n    ]');

  src = src.slice(0, at) + block + src.slice(end);
  console.log('  ' + slug.padEnd(8) + items.length + ' products, ' +
              (cats.length - 1) + ' categories: ' + cats.slice(1).join(', '));
});

fs.writeFileSync('stores.js', src, 'utf8');

/* prove it still parses and still says what we think it says */
const box = { window: {} };
new Function('window', fs.readFileSync('stores.js', 'utf8'))(box.window);
const total = box.window.ARQR_STORES.reduce((a, s) => a + s.items.length, 0);
console.log('\n  stores.js rewritten and parses — ' + total + ' products across ' +
            box.window.ARQR_STORES.length + ' shops');
