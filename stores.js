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
    cats: ['All', 'Seating', 'Tables'],
    items: [
      { n:'Armchair With Rattan Black', p:'$1,410', d:'77 × 96 cm', c:'Seating', i:'ic-chair', f:'armchair-with-rattan-black-themasie-emba' },
      { n:'Designer Chair', p:'$1,970', d:'75 × 97 cm', c:'Seating', i:'ic-chair', f:'designer-chair-02a' },
      { n:'Elegant Chair', p:'$1,100', d:'81 × 116 cm', c:'Seating', i:'ic-chair', f:'elegant-chair' },
      { n:'Flick Accent Chair Yolk Yellow', p:'$1,770', d:'210 × 90 cm', c:'Seating', i:'ic-chair', f:'flick-accent-chair-yolk-yellow' },
      { n:'Flippa Functional Coffee Table', p:'$1,850', d:'180 × 85 cm', c:'Tables', i:'ic-table', f:'flippa-functional-coffee-table-w-storagewalnut' },
      { n:'Miki Sofa Bed Quartz Blue', p:'$2,440', d:'78 × 82 cm', c:'Seating', i:'ic-sofa', f:'miki-sofa-bed-quartz-blue' },
      { n:'Moby 2 Seater Sofa', p:'$580', d:'120 × 45 cm', c:'Seating', i:'ic-sofa', f:'moby-2-seater-sofa' },
      { n:'Sofa 42', p:'$1,970', d:'201 × 81 cm', c:'Seating', i:'ic-sofa', f:'sofa-42' },
      { n:'Sofa', p:'$2,050', d:'280 × 101 cm', c:'Seating', i:'ic-sofa', f:'sofa-free' },
      { n:'Sofa M33523', p:'$1,190', d:'320 × 92 cm', c:'Seating', i:'ic-sofa', f:'sofa-m33523' },
      { n:'TV Table Vicco Lowboard Amber', p:'$1,700', d:'150 × 47 cm', c:'Tables', i:'ic-table', f:'tv-table-vicco-lowboard-amber-4096px2' }
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
    cats: ['All', 'Boots', 'Casual', 'Formal'],
    items: [
      { n:'Asics Shoe', p:'$170', d:'EU 36–46', c:'Casual', i:'ic-sneaker', f:'asics-shoe' },
      { n:'Carhartt Construction Boot', p:'$220', d:'EU 36–46', c:'Boots', i:'ic-chelsea', f:'carhartt-construction-boot' },
      { n:'Cat Shoe', p:'$290', d:'EU 36–46', c:'Casual', i:'ic-sneaker', f:'cat-shoe-left' },
      { n:'Gladiator Sandal Heels', p:'$130', d:'EU 36–46', c:'Formal', i:'ic-oxford', f:'gladiator-sandal-heels' },
      { n:'High Heels', p:'$330', d:'EU 36–46', c:'Formal', i:'ic-oxford', f:'high-heels' },
      { n:'Mule Shoe Multicolor', p:'$150', d:'EU 36–46', c:'Formal', i:'ic-loafer', f:'mule-dway-shoe-multicolor' },
      { n:'Hoka Shoe', p:'$200', d:'EU 36–46', c:'Casual', i:'ic-sneaker', f:'photorealistic-hoka-shoe' },
      { n:'Adidas Sports Shoe', p:'$160', d:'EU 36–46', c:'Casual', i:'ic-sneaker', f:'scanned-adidas-sports-shoe' },
      { n:'Sievi Racer Safety Shoe', p:'$200', d:'EU 36–46', c:'Casual', i:'ic-sneaker', f:'sievi-racer-safety-shoe' },
      { n:'YSL High Heels', p:'$330', d:'EU 36–46', c:'Formal', i:'ic-oxford', f:'ysl-high-heels' }
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
    cats: ['All', 'Lighting', 'Objects', 'Wall'],
    items: [
      { n:'Cat Statue', p:'$640', d:'170 × 77 cm', c:'Objects', i:'ic-object', f:'cat-statue' },
      { n:'Ding Censer With An Openwork Cover', p:'$410', d:'H 27 cm', c:'Lighting', i:'ic-lantern', f:'ding-censer-with-an-openwork-cover' },
      { n:'Egyptian Cat Statue', p:'$730', d:'H 96 cm', c:'Objects', i:'ic-object', f:'egyptian-cat-statue' },
      { n:'Ibex Statue Berlin Tierpark', p:'$420', d:'H 200 cm', c:'Objects', i:'ic-object', f:'ibex-statue-scan-berlin-tierpark' },
      { n:'Lamp Marble Base', p:'$740', d:'H 42 cm', c:'Lighting', i:'ic-pendant', f:'lamp-marble-base-free' },
      { n:'Painting Rembrandt Landscape', p:'$490', d:'H 28 cm', c:'Wall', i:'ic-frame', f:'painting-rembrandt-landscape1' },
      { n:'Plant Interior Decoration', p:'$540', d:'H 38 cm', c:'Objects', i:'ic-vase', f:'plant-interior-decoration' },
      { n:'Table Lamp', p:'$620', d:'H 74 cm', c:'Lighting', i:'ic-pendant', f:'table-lamp' },
      { n:'Table Lamp Free', p:'$480', d:'H 42 cm', c:'Lighting', i:'ic-pendant', f:'table-lamp-free' },
      { n:'Torsion Pendulum Clock', p:'$170', d:'H 27 cm', c:'Wall', i:'ic-lantern', f:'torsion-pendulum-clock-animation' },
      { n:'Victorian Framed Painting', p:'$550', d:'114 × 84 cm', c:'Wall', i:'ic-frame', f:'victorian-framed-painting-pbr-game-ready' },
      { n:'Vintage Painting Dani', p:'$690', d:'H 89 cm', c:'Wall', i:'ic-frame', f:'vintage-painting-dani' },
      { n:'Wall Decor Photoframe', p:'$260', d:'H 16 cm', c:'Wall', i:'ic-frame', f:'wall-decor-photoframe' }
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
    cats: ['All', 'Flatweave', 'Hand-knotted', 'Runners'],
    items: [
      { n:'Antique Turkish Runner Carpet', p:'$1,410', d:'196 × 100 cm', c:'Runners', i:'ic-runner', f:'antique-turkish-runner-carpet' },
      { n:'Ava Large Geometric Hand Tufted Wool Rug', p:'$1,290', d:'334 × 334 cm', c:'Hand-knotted', i:'ic-rug', f:'ava-large-geometric-hand-tufted-wool-rug' },
      { n:'Bess Arabian Gallery Kilim Runner', p:'$990', d:'424 × 208 cm', c:'Runners', i:'ic-runner', f:'bess-arabian-gallery-kilim-i-runner' },
      { n:'Bhadoi Rug', p:'$1,630', d:'241 × 172 cm', c:'Hand-knotted', i:'ic-rug', f:'bhadoi-rug' },
      { n:'Boho Rug', p:'$2,130', d:'302 × 184 cm', c:'Flatweave', i:'ic-rug', f:'boho-rug' },
      { n:'Carpet II', p:'$540', d:'200 × 140 cm', c:'Flatweave', i:'ic-rug', f:'carpet-2' },
      { n:'Carpet Carpet', p:'$1,070', d:'300 × 200 cm', c:'Flatweave', i:'ic-rug', f:'carpet-carpet' },
      { n:'Fine Persian Heriz Carpet', p:'$970', d:'393 × 288 cm', c:'Hand-knotted', i:'ic-rug', f:'fine-persian-heriz-carpet' },
      { n:'Carpet', p:'$330', d:'240 × 170 cm', c:'Flatweave', i:'ic-rug', f:'game-ready-carpet' },
      { n:'Persian Nain Carpet', p:'$1,970', d:'417 × 310 cm', c:'Hand-knotted', i:'ic-rug', f:'persian-nain-carpet' },
      { n:'Persian Tabriz Pictorial Carpet', p:'$980', d:'361 × 262 cm', c:'Hand-knotted', i:'ic-rug', f:'persian-tabriz-pictorial-carpet' },
      { n:'Signed Persian Nain Square Carpet', p:'$510', d:'288 × 262 cm', c:'Hand-knotted', i:'ic-rug', f:'signed-persian-nain-square-carpet' }
    ]
  }
];
