/* ------------------------------------------------------------------
   Works out what, if anything, each model needs doing to it.

   model-targets.json holds the size every product must be, in metres,
   for each format — a fact about the furniture, not about the files.
   This measures what the files currently are and asks for the ratio
   between the two.

   Which means running it twice is safe: the second time every ratio is
   1 and nothing is touched. That matters. The first version of this
   pipeline expressed the correction as "these are centimetres, divide
   by a hundred", and running that twice would have shrunk every model
   by ten thousand.

   Run:  npm run plan     (npm run sizes does it first)
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');

const TARGETS = JSON.parse(fs.readFileSync('model-targets.json', 'utf8'));
const TMP = 'C:/Users/Ehtisham/AppData/Local/Temp/claude/';
const usd = JSON.parse(fs.readFileSync(TMP + 'usdz-true.json', 'utf8'));
const glb = JSON.parse(fs.readFileSync(TMP + 'audit.json', 'utf8'));
const scales = JSON.parse(fs.readFileSync(TMP + 'usdz-scales.json', 'utf8'));

const gm = {}, sm = {};
glb.forEach(o => gm[o.f] = o);
scales.forEach(o => sm[o.f] = o.scales[0] ? o.scales[0][1] : null);

/* how far off a measurement is, as a fraction of the object's own size */
const off = (now, want) => {
  const s = Math.max(...want) || 1;
  return Math.max(...[0, 1, 2].map(i => Math.abs(now[i] - want[i]) / s));
};

const plan = [];
let shop = '';
for (const it of usd){
  const t = TARGETS[it.f];
  if (!t){ console.log('  ! no target for ' + it.f); continue; }
  const g = gm[it.f];
  const uNow = it.metres, gNow = g ? g.product : null;
  const uOff = off(uNow, t.usdz), gOff = gNow ? off(gNow, t.glb) : 0;
  const change = uOff > 0.004 || gOff > 0.004;

  if (it.shop !== shop){ shop = it.shop; console.log(''); console.log('=== ' + shop + ' ==='); }
  console.log('  ' + (change ? '* ' : '  ') + it.f.slice(0, 40).padEnd(41) +
    (change ? 'iPhone ' + (uOff * 100).toFixed(0) + '% off, Android ' + (gOff * 100).toFixed(0) + '% off'
            : 'correct — ' + t.usdz.map(v => Math.round(v * 100)).join(' x ') + ' cm'));

  plan.push({
    shop: it.shop, f: it.f, change, why: t.why,
    /* the scale op is absolute, so it is the current one moved by the ratio */
    usdzScale: sm[it.f] * (Math.max(...t.usdz) / Math.max(...uNow)),
    glbFactor: gNow ? Math.max(...t.glb) / Math.max(...gNow) : 1,
    want: t.usdz, wantGlb: t.glb
  });
}

fs.writeFileSync(TMP + 'plan.json', JSON.stringify(plan, null, 1));
console.log('');
console.log('  ' + plan.filter(p => p.change).length + ' need work, ' +
            plan.filter(p => !p.change).length + ' already the right size');
