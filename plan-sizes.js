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
  /* size is not the only thing that can be wrong with a model. A rotation,
     a running animation or a wall anchor are asked for by name in the
     targets, and each is expressed as the state the file should end in
     rather than a change to make, so asking twice is the same as once. */
  const ops = !!(t.rotate || t.rotateUsdz || t.freeze || t.anchor || t.cutout);
  const change = uOff > 0.004 || gOff > 0.004 || ops;

  if (it.shop !== shop){ shop = it.shop; console.log(''); console.log('=== ' + shop + ' ==='); }
  const note = [];
  if (uOff > 0.004 || gOff > 0.004)
    note.push('iPhone ' + (uOff * 100).toFixed(0) + '% off, Android ' + (gOff * 100).toFixed(0) + '% off');
  if (t.rotate) note.push('rotate ' + t.rotate.join(',') + ' deg');
  if (t.rotateUsdz) note.push('usdz rotate ' + t.rotateUsdz.join(',') + ' deg');
  if (t.freeze) note.push('hold animation');
  if (t.anchor) note.push('anchor ' + t.anchor);
  if (t.cutout) note.push('cutout ' + Object.keys(t.cutout).join(', '));
  console.log('  ' + (change ? '* ' : '  ') + it.f.slice(0, 40).padEnd(41) +
    (note.length ? note.join('; ')
                 : 'correct — ' + t.usdz.map(v => Math.round(v * 100)).join(' x ') + ' cm'));

  plan.push({
    shop: it.shop, f: it.f, change, why: t.why,
    /* the scale op is absolute, so it is the current one moved by the ratio */
    usdzScale: sm[it.f] * (Math.max(...t.usdz) / Math.max(...uNow)),
    glbFactor: gNow ? Math.max(...t.glb) / Math.max(...gNow) : 1,
    /* the two formats are anchored differently, so they can legitimately
       want different orientations — a picture lies in the wall's plane for
       Quick Look and stands upright on the floor for Scene Viewer */
    rotate: t.rotate || null, rotateUsdz: t.rotateUsdz || null,
    freeze: !!t.freeze, anchor: t.anchor || null,
    cutout: t.cutout || null,
    want: t.usdz, wantGlb: t.glb
  });
}

fs.writeFileSync(TMP + 'plan.json', JSON.stringify(plan, null, 1));
console.log('');
console.log('  ' + plan.filter(p => p.change).length + ' need work, ' +
            plan.filter(p => !p.change).length + ' already the right size');
