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
      { n:'Armchair With Rattan Black', p:'$1,410', d:'77 × 96 cm', c:'Seating', i:'ic-chair', f:'armchair-with-rattan-black-themasie-emba', glb:'assets/shops/novara/armchair-with-rattan-black-themasie-emba.glb', usdz:'assets/shops/novara/armchair-with-rattan-black-themasie-emba.usdz' },
      { n:'Designer Chair', p:'$1,970', d:'75 × 97 cm', c:'Seating', i:'ic-chair', f:'designer-chair-02a', glb:'assets/shops/novara/designer-chair-02a.glb', usdz:'assets/shops/novara/designer-chair-02a.usdz' },
      { n:'Elegant Chair', p:'$1,100', d:'81 × 116 cm', c:'Seating', i:'ic-chair', f:'elegant-chair', glb:'assets/shops/novara/elegant-chair.glb', usdz:'assets/shops/novara/elegant-chair.usdz' },
      { n:'Flick Accent Chair Yolk Yellow', p:'$1,770', d:'78 × 69 cm', c:'Seating', i:'ic-chair', f:'flick-accent-chair-yolk-yellow', glb:'assets/shops/novara/flick-accent-chair-yolk-yellow.glb', usdz:'assets/shops/novara/flick-accent-chair-yolk-yellow.usdz' },
      { n:'Flippa Functional Coffee Table', p:'$1,850', d:'120 × 38 cm', c:'Tables', i:'ic-table', f:'flippa-functional-coffee-table-w-storagewalnut', glb:'assets/shops/novara/flippa-functional-coffee-table-w-storagewalnut.glb', usdz:'assets/shops/novara/flippa-functional-coffee-table-w-storagewalnut.usdz' },
      { n:'Miki Sofa Bed Quartz Blue', p:'$2,440', d:'192 × 82 cm', c:'Seating', i:'ic-sofa', f:'miki-sofa-bed-quartz-blue', glb:'assets/shops/novara/miki-sofa-bed-quartz-blue.glb', usdz:'assets/shops/novara/miki-sofa-bed-quartz-blue.usdz' },
      { n:'Moby 2 Seater Sofa', p:'$580', d:'122 × 89 cm', c:'Seating', i:'ic-sofa', f:'moby-2-seater-sofa', glb:'assets/shops/novara/moby-2-seater-sofa.glb', usdz:'assets/shops/novara/moby-2-seater-sofa.usdz' },
      { n:'Sofa 42', p:'$1,970', d:'201 × 81 cm', c:'Seating', i:'ic-sofa', f:'sofa-42', glb:'assets/shops/novara/sofa-42.glb', usdz:'assets/shops/novara/sofa-42.usdz' },
      { n:'Sofa', p:'$2,050', d:'280 × 101 cm', c:'Seating', i:'ic-sofa', f:'sofa-free', glb:'assets/shops/novara/sofa-free.glb', usdz:'assets/shops/novara/sofa-free.usdz' },
      { n:'Sofa M33523', p:'$1,190', d:'320 × 90 cm', c:'Seating', i:'ic-sofa', f:'sofa-m33523', glb:'assets/shops/novara/sofa-m33523.glb', usdz:'assets/shops/novara/sofa-m33523.usdz' },
      { n:'TV Table Vicco Lowboard Amber', p:'$1,700', d:'150 × 47 cm', c:'Tables', i:'ic-table', f:'tv-table-vicco-lowboard-amber-4096px2', glb:'assets/shops/novara/tv-table-vicco-lowboard-amber-4096px2.glb', usdz:'assets/shops/novara/tv-table-vicco-lowboard-amber-4096px2.usdz' }
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
      { n:'Asics Shoe', p:'$170', d:'28 cm long', c:'Casual', i:'ic-sneaker', f:'asics-shoe', glb:'assets/shops/corso/asics-shoe.glb', usdz:'assets/shops/corso/asics-shoe.usdz' },
      { n:'Carhartt Construction Boot', p:'$220', d:'29 cm long', c:'Boots', i:'ic-chelsea', f:'carhartt-construction-boot', glb:'assets/shops/corso/carhartt-construction-boot.glb', usdz:'assets/shops/corso/carhartt-construction-boot.usdz' },
      { n:'Cat Shoe', p:'$290', d:'31 cm long', c:'Casual', i:'ic-sneaker', f:'cat-shoe-left', glb:'assets/shops/corso/cat-shoe-left.glb', usdz:'assets/shops/corso/cat-shoe-left.usdz' },
      { n:'Gladiator Sandal Heels', p:'$130', d:'24 cm long', c:'Formal', i:'ic-oxford', f:'gladiator-sandal-heels', glb:'assets/shops/corso/gladiator-sandal-heels.glb', usdz:'assets/shops/corso/gladiator-sandal-heels.usdz' },
      { n:'High Heels', p:'$330', d:'25 cm long', c:'Formal', i:'ic-oxford', f:'high-heels', glb:'assets/shops/corso/high-heels.glb', usdz:'assets/shops/corso/high-heels.usdz' },
      { n:'Mule Shoe Multicolor', p:'$150', d:'27 cm long', c:'Formal', i:'ic-loafer', f:'mule-dway-shoe-multicolor', glb:'assets/shops/corso/mule-dway-shoe-multicolor.glb', usdz:'assets/shops/corso/mule-dway-shoe-multicolor.usdz' },
      { n:'Hoka Shoe', p:'$200', d:'30 cm long', c:'Casual', i:'ic-sneaker', f:'photorealistic-hoka-shoe', glb:'assets/shops/corso/photorealistic-hoka-shoe.glb', usdz:'assets/shops/corso/photorealistic-hoka-shoe.usdz' },
      { n:'Adidas Sports Shoe', p:'$160', d:'29 cm long', c:'Casual', i:'ic-sneaker', f:'scanned-adidas-sports-shoe', glb:'assets/shops/corso/scanned-adidas-sports-shoe.glb', usdz:'assets/shops/corso/scanned-adidas-sports-shoe.usdz' },
      { n:'Sievi Racer Safety Shoe', p:'$200', d:'30 cm long', c:'Casual', i:'ic-sneaker', f:'sievi-racer-safety-shoe', glb:'assets/shops/corso/sievi-racer-safety-shoe.glb', usdz:'assets/shops/corso/sievi-racer-safety-shoe.usdz' },
      { n:'YSL High Heels', p:'$330', d:'24 cm long', c:'Formal', i:'ic-oxford', f:'ysl-high-heels', glb:'assets/shops/corso/ysl-high-heels.glb', usdz:'assets/shops/corso/ysl-high-heels.usdz' }
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
      { n:'Cat Statue', p:'$640', d:'30 × 12 cm', c:'Objects', i:'ic-object', f:'cat-statue', glb:'assets/shops/maison/cat-statue.glb', usdz:'assets/shops/maison/cat-statue.usdz' },
      { n:'Ding Censer With An Openwork Cover', p:'$410', d:'H 27 cm', c:'Lighting', i:'ic-lantern', f:'ding-censer-with-an-openwork-cover', glb:'assets/shops/maison/ding-censer-with-an-openwork-cover.glb', usdz:'assets/shops/maison/ding-censer-with-an-openwork-cover.usdz' },
      { n:'Egyptian Cat Statue', p:'$730', d:'H 96 cm', c:'Objects', i:'ic-object', f:'egyptian-cat-statue', glb:'assets/shops/maison/egyptian-cat-statue.glb', usdz:'assets/shops/maison/egyptian-cat-statue.usdz' },
      { n:'Ibex Statue Berlin Tierpark', p:'$420', d:'H 200 cm', c:'Objects', i:'ic-object', f:'ibex-statue-scan-berlin-tierpark', glb:'assets/shops/maison/ibex-statue-scan-berlin-tierpark.glb', usdz:'assets/shops/maison/ibex-statue-scan-berlin-tierpark.usdz' },
      { n:'Lamp Marble Base', p:'$740', d:'H 45 cm', c:'Lighting', i:'ic-pendant', f:'lamp-marble-base-free', glb:'assets/shops/maison/lamp-marble-base-free.glb', usdz:'assets/shops/maison/lamp-marble-base-free.usdz' },
      { n:'Painting Rembrandt Landscape', p:'$490', d:'52 × 37 cm', c:'Wall', i:'ic-frame', f:'painting-rembrandt-landscape1', glb:'assets/shops/maison/painting-rembrandt-landscape1.glb', usdz:'assets/shops/maison/painting-rembrandt-landscape1.usdz', wall:1 },
      { n:'Plant Interior Decoration', p:'$540', d:'H 38 cm', c:'Objects', i:'ic-vase', f:'plant-interior-decoration', glb:'assets/shops/maison/plant-interior-decoration.glb', usdz:'assets/shops/maison/plant-interior-decoration.usdz' },
      { n:'Table Lamp', p:'$620', d:'H 74 cm', c:'Lighting', i:'ic-pendant', f:'table-lamp', glb:'assets/shops/maison/table-lamp.glb', usdz:'assets/shops/maison/table-lamp.usdz' },
      { n:'Table Lamp Free', p:'$480', d:'H 45 cm', c:'Lighting', i:'ic-pendant', f:'table-lamp-free', glb:'assets/shops/maison/table-lamp-free.glb', usdz:'assets/shops/maison/table-lamp-free.usdz' },
      { n:'Torsion Pendulum Clock', p:'$170', d:'H 27 cm', c:'Wall', i:'ic-lantern', f:'torsion-pendulum-clock-animation', glb:'assets/shops/maison/torsion-pendulum-clock-animation.glb', usdz:'assets/shops/maison/torsion-pendulum-clock-animation.usdz' },
      { n:'Victorian Framed Painting', p:'$550', d:'114 × 84 cm', c:'Wall', i:'ic-frame', f:'victorian-framed-painting-pbr-game-ready', glb:'assets/shops/maison/victorian-framed-painting-pbr-game-ready.glb', usdz:'assets/shops/maison/victorian-framed-painting-pbr-game-ready.usdz', wall:1 },
      { n:'Vintage Painting Dani', p:'$690', d:'65 × 89 cm', c:'Wall', i:'ic-frame', f:'vintage-painting-dani', glb:'assets/shops/maison/vintage-painting-dani.glb', usdz:'assets/shops/maison/vintage-painting-dani.usdz', wall:1 },
      { n:'Wall Decor Photoframe', p:'$260', d:'35 × 41 cm', c:'Wall', i:'ic-frame', f:'wall-decor-photoframe', glb:'assets/shops/maison/wall-decor-photoframe.glb', usdz:'assets/shops/maison/wall-decor-photoframe.usdz', wall:1 }
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
      { n:'Antique Turkish Runner Carpet', p:'$1,410', d:'196 × 100 cm', c:'Runners', i:'ic-runner', f:'antique-turkish-runner-carpet', glb:'assets/shops/terra/antique-turkish-runner-carpet.glb', usdz:'assets/shops/terra/antique-turkish-runner-carpet.usdz' },
      { n:'Ava Large Geometric Hand Tufted Wool Rug', p:'$1,290', d:'230 × 160 cm', c:'Hand-knotted', i:'ic-rug', f:'ava-large-geometric-hand-tufted-wool-rug', glb:'assets/shops/terra/ava-large-geometric-hand-tufted-wool-rug.glb', usdz:'assets/shops/terra/ava-large-geometric-hand-tufted-wool-rug.usdz' },
      { n:'Bess Arabian Gallery Kilim Runner', p:'$990', d:'300 × 147 cm', c:'Runners', i:'ic-runner', f:'bess-arabian-gallery-kilim-i-runner', glb:'assets/shops/terra/bess-arabian-gallery-kilim-i-runner.glb', usdz:'assets/shops/terra/bess-arabian-gallery-kilim-i-runner.usdz' },
      { n:'Bhadoi Rug', p:'$1,630', d:'241 × 172 cm', c:'Hand-knotted', i:'ic-rug', f:'bhadoi-rug', glb:'assets/shops/terra/bhadoi-rug.glb', usdz:'assets/shops/terra/bhadoi-rug.usdz' },
      { n:'Boho Rug', p:'$2,130', d:'300 × 183 cm', c:'Flatweave', i:'ic-rug', f:'boho-rug', glb:'assets/shops/terra/boho-rug.glb', usdz:'assets/shops/terra/boho-rug.usdz' },
      { n:'Carpet II', p:'$540', d:'300 × 168 cm', c:'Flatweave', i:'ic-rug', f:'carpet-2', glb:'assets/shops/terra/carpet-2.glb', usdz:'assets/shops/terra/carpet-2.usdz' },
      { n:'Carpet Carpet', p:'$1,070', d:'300 × 196 cm', c:'Flatweave', i:'ic-rug', f:'carpet-carpet', glb:'assets/shops/terra/carpet-carpet.glb', usdz:'assets/shops/terra/carpet-carpet.usdz' },
      { n:'Fine Persian Heriz Carpet', p:'$970', d:'300 × 220 cm', c:'Hand-knotted', i:'ic-rug', f:'fine-persian-heriz-carpet', glb:'assets/shops/terra/fine-persian-heriz-carpet.glb', usdz:'assets/shops/terra/fine-persian-heriz-carpet.usdz' },
      { n:'Carpet', p:'$330', d:'169 × 110 cm', c:'Flatweave', i:'ic-rug', f:'game-ready-carpet', glb:'assets/shops/terra/game-ready-carpet.glb', usdz:'assets/shops/terra/game-ready-carpet.usdz' },
      { n:'Persian Nain Carpet', p:'$1,970', d:'300 × 223 cm', c:'Hand-knotted', i:'ic-rug', f:'persian-nain-carpet', glb:'assets/shops/terra/persian-nain-carpet.glb', usdz:'assets/shops/terra/persian-nain-carpet.usdz' },
      { n:'Persian Tabriz Pictorial Carpet', p:'$980', d:'300 × 218 cm', c:'Hand-knotted', i:'ic-rug', f:'persian-tabriz-pictorial-carpet', glb:'assets/shops/terra/persian-tabriz-pictorial-carpet.glb', usdz:'assets/shops/terra/persian-tabriz-pictorial-carpet.usdz' },
      { n:'Signed Persian Nain Square Carpet', p:'$510', d:'288 × 262 cm', c:'Hand-knotted', i:'ic-rug', f:'signed-persian-nain-square-carpet', glb:'assets/shops/terra/signed-persian-nain-square-carpet.glb', usdz:'assets/shops/terra/signed-persian-nain-square-carpet.usdz' }
    ]
  }
];
