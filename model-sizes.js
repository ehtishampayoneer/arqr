/* ------------------------------------------------------------------
   How big each product really is.

   Every one of these files came out of Sketchfab, and Sketchfab's
   converter writes a "normalise" scale onto a root Xform called
   /Meshes. When it works it writes exactly 100, which against
   metersPerUnit = 0.01 is a net x1 — the model keeps its own units.
   When it misfires it writes whatever number fits the model into a
   3-metre box, which is why a shoe and a sofa were both about 3 m.
   On the two flat carpets it divided by a zero thickness and wrote
   1.2e13, so those were being placed 45 billion kilometres wide.

   So nothing here rescales geometry. Each entry says what the model's
   own numbers mean, and the one bad number gets set to match.

     unit  the model is authored in these; multiply and you are done.
           Corroborated three ways: the raw numbers, the proportions,
           and the product photograph.
     fit   the model is authored at no real scale at all, so an
           absolute size is set instead, taken from the object in the
           photograph. `axis` is 'max' for the longest edge, or an
           index (1 = height).

   Anything not listed measures correctly already and is not touched.
   ------------------------------------------------------------------ */
'use strict';

module.exports = {
  /* ---------------- novara: furniture ---------------- */
  /* all four carry a 2-triangle FLOOR plane from the studio set, and
     all four are authored in centimetres */
  'flick-accent-chair-yolk-yellow':            { unit: 'cm', why: '78 x 69 x 76 cm accent chair' },
  'flippa-functional-coffee-table-w-storagewalnut': { unit: 'cm', why: '120 x 38 x 70 cm coffee table' },
  'miki-sofa-bed-quartz-blue':                 { unit: 'cm', why: '192 x 82 x 98 cm sofa bed' },
  'moby-2-seater-sofa':                        { unit: 'cm', why: '122 x 89 x 81 cm two-seater' },

  /* ---------------- corso: footwear ---------------- */
  /* the photographs settle it: every one is a single shoe except the
     high heels, which are a pair. So the longest edge is one shoe's
     length, and for the pair it is the length too — the width across
     the two is the second axis. */
  'high-heels':               { unit: 'cm', why: 'pair: 25 cm long, 15 cm heel, 20 cm across the two' },
  'cat-shoe-left':            { fit: 0.31, axis: 'max', why: 'work boot, EU 45' },
  'mule-dway-shoe-multicolor':{ fit: 0.27, axis: 'max', why: 'slide mule, EU 39' },
  'photorealistic-hoka-shoe': { fit: 0.30, axis: 'max', why: 'running shoe, EU 44' },
  'scanned-adidas-sports-shoe':{ fit: 0.29, axis: 'max', why: 'football boot, EU 43' },
  'sievi-racer-safety-shoe':  { fit: 0.30, axis: 'max', why: 'safety shoe, EU 44' },
  'gladiator-sandal-heels':   { fit: 0.24, axis: 'max', why: 'ankle-strap heel, EU 38' },
  'ysl-high-heels':           { fit: 0.24, axis: 'max', why: 'ankle-strap heel, EU 38' },

  /* ---------------- maison: decoration ---------------- */
  'ding-censer-with-an-openwork-cover': { unit: 'mm', why: '27 cm tall censer — matches the museum record' },
  'egyptian-cat-statue':      { unit: 'cm', why: '96 cm floor statue' },
  'cat-statue':               { fit: 0.30, axis: 'max', why: 'sleeping-cat ornament; it was 1.7 m long' },
  'lamp-marble-base-free':    { fit: 0.45, axis: 1, why: 'table lamp, 45 cm to the top of the shade' },
  'table-lamp-free':          { fit: 0.45, axis: 1, why: 'table lamp, 45 cm to the top of the shade' },
  'painting-rembrandt-landscape1': { unit: 'in', why: 'framed canvas, 52 x 37 cm' },
  'wall-decor-photoframe':    { unit: 'in', why: 'stretched canvas, 41 x 35 cm, 13 mm deep' },

  /* ---------------- terra: carpets and rugs ---------------- */
  'ava-large-geometric-hand-tufted-wool-rug': { unit: 'cm', why: '230 x 160 cm rug (also carries a FLOOR plane)' },
  'carpet-2':                 { unit: 'cm', why: '205 x 366 cm carpet' },
  'carpet-carpet':            { unit: 'cm', why: '261 x 400 cm carpet' },
  'antique-turkish-runner-carpet': { unit: 'm', why: '196 x 100 cm rug' },
  'boho-rug':                 { unit: 'm', why: '184 x 302 cm rug' },
  'game-ready-carpet':        { unit: 'm', why: '169 x 110 cm rug' },
  'persian-tabriz-pictorial-carpet': { unit: 'm', why: '361 x 262 cm carpet' }
};
