/* ------------------------------------------------------------------
   Writes the size printed on each product card, from the size the
   model actually is.

   These two had drifted apart. The numbers on the cards were worked out
   from the files as they were first imported, and the files have since
   been corrected — so a rug advertised at 424 cm was by then 300, and
   every shoe said "EU 36-46", which is a size range the model cannot
   have because a model is one shoe.

   So nothing here is typed in. Each figure is the measurement taken out
   of the usdz that the customer's phone will open, rounded to the
   centimetre, and phrased the way that kind of object is normally
   described:

     furniture   width x height, the two you judge a chair by
     footwear    length, because that is what a shoe's size means
     rugs        length x width, the footprint on the floor
     wall art    width x height
     ornaments   height, where the object is taller than it is wide

   Run:  npm run cards
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');

const TMP = 'C:/Users/Ehtisham/AppData/Local/Temp/claude/';
const measured = JSON.parse(fs.readFileSync(TMP + 'usdz-true.json', 'utf8'));
const targets = JSON.parse(fs.readFileSync('model-targets.json', 'utf8'));
const list = JSON.parse(fs.readFileSync('shop-products.json', 'utf8'));

const cm = v => Math.round(v * 100);

function describe(shop, f, m){
  const [x, y, z] = m;
  const floor = [cm(x), cm(z)].sort((a, b) => b - a);
  const wide = Math.max(cm(x), cm(z));

  if (shop === 'terra') return floor[0] + ' × ' + floor[1] + ' cm';
  if (shop === 'corso') return Math.max(cm(x), cm(y), cm(z)) + ' cm long';
  if (shop === 'novara') return wide + ' × ' + cm(y) + ' cm';

  /* Maison is mixed: framed art hangs, everything else stands.
     A wall piece is measured from its glb, not the usdz on the desk beside
     it. The usdz for those lies flat in the wall's plane so Quick Look can
     hang it, which makes its y axis the thickness of the frame — printing
     "41 x 1 cm" on the card. The glb keeps the picture upright, so width
     and height still mean what they say. */
  if (targets[f] && targets[f].anchor === 'vertical'){
    const g = targets[f].glb;
    return Math.max(cm(g[0]), cm(g[2])) + ' × ' + cm(g[1]) + ' cm';
  }
  if (cm(y) >= wide) return 'H ' + cm(y) + ' cm';
  return wide + ' × ' + cm(y) + ' cm';
}

const by = {};
measured.forEach(m => by[m.f] = m);

let changed = 0, shop = '';
for (const slug of Object.keys(list)){
  for (const it of list[slug]){
    const m = by[it.f];
    if (!m){ console.log('  ! not measured: ' + it.f); continue; }
    const want = describe(slug, it.f, m.metres);
    if (slug !== shop){ shop = slug; console.log(''); console.log('=== ' + slug + ' ==='); }
    /* the page words its placing guide differently for something that
       hangs on a wall, so the fact travels with the product */
    if (targets[it.f] && targets[it.f].anchor === 'vertical') it.wall = true;
    else delete it.wall;

    if (want !== it.d){
      console.log('  ' + it.f.slice(0, 40).padEnd(42) + String(it.d).padEnd(16) + '->  ' + want);
      it.d = want; changed++;
    } else {
      console.log('  ' + it.f.slice(0, 40).padEnd(42) + it.d + '   (unchanged)');
    }
  }
}

fs.writeFileSync('shop-products.json', JSON.stringify(list, null, 2));
console.log('');
console.log('  ' + changed + ' card sizes rewritten from the models themselves');
