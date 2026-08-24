/* ------------------------------------------------------------------
   The four sample shops.

   These are NOT a marketplace. Each one is a single shop's own catalog,
   living at its own address, carrying its own name, its own colour and
   its own products — which is exactly what a seller gets when they come
   on board. Four of them exist only to show that the same thing works
   whatever you sell.

   Shared by catalog.html (the sampler) and store.html (one shop).
   ------------------------------------------------------------------ */
window.ARQR_STORES = [
  {
    slug: 'novara',
    kind: 'Furniture',
    name: 'Novara Living',
    tagline: 'Curated furniture for contemporary living',
    mark: 'mk-novara',
    tone: '#B4623A',
    lead: 'Modern pieces for every space',
    sub: 'Sofas, tables and storage — every one to scale in your room.',
    cta: 'See it in your room',
    note: 'Furniture is the hardest thing to buy online. Nobody knows if a 244cm sofa fits until it is in the room.',
    cats: ['All', 'Seating', 'Tables', 'Storage'],
    items: [
      { n:'Luna Modular Sofa',    p:'$2,480', d:'244 × 168 cm',  c:'Seating', i:'ic-sofa',  tag:'Bestseller' },
      { n:'Aurelia Lounge Chair', p:'$890',   d:'78 × 82 cm',    c:'Seating', i:'ic-chair' },
      { n:'Arche Dining Table',   p:'$1,640', d:'220 × 100 cm',  c:'Tables',  i:'ic-table' },
      { n:'Como Sideboard',       p:'$1,220', d:'180 × 45 cm',   c:'Storage', i:'ic-side' },
      { n:'Solace Bed',           p:'$1,950', d:'King · 193 cm', c:'Seating', i:'ic-bed',   tag:'New' },
      { n:'Linea Bookshelf',      p:'$760',   d:'90 × 200 cm',   c:'Storage', i:'ic-shelf' }
    ]
  },
  {
    slug: 'corso',
    kind: 'Footwear',
    name: 'Corso Footwear',
    tagline: 'Leather shoes, made in Italy',
    mark: 'mk-corso',
    tone: '#2E5E52',
    lead: 'Shoes you can see on your own feet',
    sub: 'Point your camera down. Every pair, in your size, on you.',
    /* a shoe does not go on the floor — it goes on the customer */
    cta: 'Try them on',
    note: 'Shoes come back more than anything else online. Seeing them on your own foot, in your own size, stops most of it.',
    cats: ['All', 'Formal', 'Boots', 'Casual'],
    items: [
      { n:'Verona Leather Derby', p:'$210', d:'EU 39–46',      c:'Formal', i:'ic-derby',  tag:'Bestseller' },
      { n:'Rialto Chelsea Boot',  p:'$265', d:'EU 40–46',      c:'Boots',  i:'ic-chelsea' },
      { n:'Lido Suede Loafer',    p:'$180', d:'EU 39–45',      c:'Casual', i:'ic-loafer' },
      { n:'Corsa Runner',         p:'$145', d:'EU 38–46',      c:'Casual', i:'ic-sneaker', tag:'New' },
      { n:'Milano Oxford',        p:'$240', d:'EU 40–45',      c:'Formal', i:'ic-oxford' },
      { n:'Nadia Ankle Boot',     p:'$230', d:'EU 36–42',      c:'Boots',  i:'ic-ankle' }
    ]
  },
  {
    slug: 'maison',
    kind: 'Decoration',
    name: 'Maison Ora',
    tagline: 'Lighting, mirrors and objects',
    mark: 'mk-maison',
    tone: '#6E6BA8',
    lead: 'The last thing you furnish is the wall',
    sub: 'Hang it, stand it, light it — before you buy it.',
    cta: 'See it in your room',
    note: 'Decor is bought on feel. A pendant that looks right in a studio photo can be twice the size you pictured.',
    cats: ['All', 'Lighting', 'Wall', 'Objects'],
    items: [
      { n:'Halo Pendant Light',    p:'$380', d:'Ø 45 cm',     c:'Lighting', i:'ic-pendant', tag:'Bestseller' },
      { n:'Brass Arch Mirror',     p:'$680', d:'80 × 180 cm', c:'Wall',     i:'ic-mirror' },
      { n:'Coastline No. 4',       p:'$340', d:'70 × 100 cm', c:'Wall',     i:'ic-frame' },
      { n:'Monolith Vase',         p:'$180', d:'H 42 cm',     c:'Objects',  i:'ic-vase' },
      { n:'Ember Lantern',         p:'$150', d:'H 34 cm',     c:'Lighting', i:'ic-lantern' },
      { n:'Cirque Wall Sculpture', p:'$450', d:'Ø 60 cm',     c:'Objects',  i:'ic-object',  tag:'New' }
    ]
  },
  {
    slug: 'terra',
    kind: 'Rugs & carpets',
    name: 'Terra & Weave',
    tagline: 'Hand-finished rugs, woven in small batches',
    mark: 'mk-terra',
    tone: '#9C7A2E',
    lead: 'Floors worth standing on',
    sub: 'Roll it out on your own floor and walk around it.',
    cta: 'See it on your floor',
    note: 'A rug is all about proportion. 240 × 170 means nothing until it is lying between your own sofa and wall.',
    cats: ['All', 'Hand-knotted', 'Flatweave', 'Runners'],
    items: [
      { n:'Anatolia Hand-Knotted', p:'$1,180', d:'240 × 170 cm', c:'Hand-knotted', i:'ic-rug',    tag:'Bestseller' },
      { n:'Dune Flatweave 8×10',   p:'$640',   d:'305 × 244 cm', c:'Flatweave',    i:'ic-rug' },
      { n:'Cirrus Wool Round',     p:'$520',   d:'Ø 200 cm',     c:'Hand-knotted', i:'ic-round' },
      { n:'Kilim Runner 2.5×8',    p:'$310',   d:'244 × 76 cm',  c:'Runners',      i:'ic-runner' },
      { n:'Ashfield Jute Square',  p:'$420',   d:'200 × 200 cm', c:'Flatweave',    i:'ic-rug' },
      { n:'Meridian Silk Blend',   p:'$2,240', d:'300 × 200 cm', c:'Hand-knotted', i:'ic-rug',    tag:'New' }
    ]
  }
];
