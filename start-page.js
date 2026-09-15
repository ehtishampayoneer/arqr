/* ------------------------------------------------------------------
   /start, the "what to send us" guide, as a page people can scan.

   The legal pages are documents and are read top to bottom, so they stay
   a narrow column of text. This one is instructions, read by someone with
   a phone in one hand and a chair in front of them, so it is built from
   steps, pictures and short lines instead of paragraphs. Every angle
   diagram is drawn here as SVG rather than shipped as images: eight
   pictures that stay sharp at any size and weigh nothing.

   Rendered by legal.js, which owns the shared header, footer and styles.
   ------------------------------------------------------------------ */
'use strict';

const I = (d, extra) => '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"' + (extra || '') + '>' + d + '</svg>';
const S = 'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

const ICON = {
  cart:    I('<path d="M3 4h2.2l2.1 10.6a1.6 1.6 0 0 0 1.6 1.3h7.6a1.6 1.6 0 0 0 1.6-1.2L20 8H6.2" ' + S + '/><circle cx="9.5" cy="19.6" r="1.3" fill="currentColor"/><circle cx="16.5" cy="19.6" r="1.3" fill="currentColor"/>'),
  camera:  I('<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.4-2.2h5.8L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" ' + S + '/><circle cx="12" cy="12.8" r="3.4" ' + S + '/>'),
  check:   I('<circle cx="12" cy="12" r="8.6" ' + S + '/><path d="m8.3 12.3 2.5 2.5 5-5.2" ' + S + '/>'),
  cube:    I('<path d="M12 2.8 20.2 7.4v9.2L12 21.2l-8.2-4.6V7.4z" ' + S + '/><path d="M3.8 7.4 12 12l8.2-4.6M12 12v9.2" ' + S + '/>'),
  eye:     I('<path d="M2.6 12S6 5.6 12 5.6 21.4 12 21.4 12 18 18.4 12 18.4 2.6 12 2.6 12z" ' + S + '/><circle cx="12" cy="12" r="2.8" ' + S + '/>'),
  live:    I('<path d="M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2M8 16a5.6 5.6 0 0 1 0-8M16 8a5.6 5.6 0 0 1 0 8" ' + S + '/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>'),
  tick:    I('<path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
  cross:   I('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
  ruler:   I('<path d="M3.5 15.8 15.8 3.5l4.7 4.7L8.2 20.5z" ' + S + '/><path d="m7.4 12 1.8 1.8M10 9.4l2.6 2.6M12.6 6.8l1.8 1.8" ' + S + '/>'),
  sofa:    I('<path d="M5 11V8.2A2.2 2.2 0 0 1 7.2 6h9.6A2.2 2.2 0 0 1 19 8.2V11" ' + S + '/><path d="M3.2 12.6a1.8 1.8 0 0 1 3.6 0V14h10.4v-1.4a1.8 1.8 0 0 1 3.6 0V17a1.5 1.5 0 0 1-1.5 1.5H4.7A1.5 1.5 0 0 1 3.2 17z" ' + S + '/><path d="M6 18.5V20M18 18.5V20" ' + S + '/>'),
  rug:     I('<rect x="4.5" y="4" width="15" height="16" rx="1.4" ' + S + '/><rect x="8" y="7.5" width="8" height="9" rx=".8" ' + S + '/><path d="M6.5 2v2M10 2v2M14 2v2M17.5 2v2M6.5 20v2M10 20v2M14 20v2M17.5 20v2" ' + S + '/>'),
  shoe:    I('<path d="M3 16.2V8.6h3.6l1.8 2.6 3.2-.8 4.3 2.4 3.9 1a2 2 0 0 1 1.5 1.9v.5H3z" ' + S + '/><path d="M3 18.8h18.2" ' + S + '/>'),
  lamp:    I('<path d="M8.2 3.5h7.6l2.7 7.5h-13z" ' + S + '/><path d="M12 11v8M8.2 20.5h7.6" ' + S + '/>'),
  file:    I('<path d="M13.4 3.4H7.2A1.8 1.8 0 0 0 5.4 5.2v13.6a1.8 1.8 0 0 0 1.8 1.8h9.6a1.8 1.8 0 0 0 1.8-1.8V8.4z" ' + S + '/><path d="M13.4 3.4v5h5" ' + S + '/>'),
  mail:    I('<rect x="3.2" y="5.2" width="17.6" height="13.6" rx="2" ' + S + '/><path d="m4 6.6 8 6 8-6" ' + S + '/>'),
  form:    I('<rect x="4" y="3.4" width="16" height="17.2" rx="2" ' + S + '/><path d="M8 8.2h8M8 12h8M8 15.8h5" ' + S + '/>'),
  link:    I('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" ' + S + '/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" ' + S + '/>'),
  qr:      I('<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" ' + S + '/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" ' + S + '/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" ' + S + '/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 18.5h1.5M18.5 14h2" ' + S + '/>'),
  store:   I('<path d="M4 9.6V20h16V9.6" ' + S + '/><path d="M3 9.6 5 4h14l2 5.6a3 3 0 0 1-5.6 1.6 3 3 0 0 1-5.6 0A3 3 0 0 1 3 9.6Z" ' + S + '/><path d="M10 20v-5.2h4V20" ' + S + '/>'),
  plus:    I('<circle cx="12" cy="12" r="8.6" ' + S + '/><path d="M12 8.4v7.2M8.4 12h7.2" ' + S + '/>'),
  wrench:  I('<path d="M14.6 6.2a4.2 4.2 0 0 0-5.4 5.4L3.8 17a1.9 1.9 0 0 0 2.7 2.7l5.4-5.4a4.2 4.2 0 0 0 5.4-5.4l-2.6 2.6-2.4-.3-.3-2.4z" ' + S + '/>'),
  arrow:   I('<path d="M5 12h13m0 0-5.5-5.5M18 12l-5.5 5.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  clock:   I('<circle cx="12" cy="12" r="8.6" ' + S + '/><path d="M12 7.4V12l3 2" ' + S + '/>'),
  phone:   I('<rect x="6.5" y="2.8" width="11" height="18.4" rx="2.4" ' + S + '/><path d="M10.6 18h2.8" ' + S + '/>')
};

const SOCIAL = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4.1" stroke="currentColor" stroke-width="1.7"/><circle cx="17.2" cy="6.8" r="1.15" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4l7.2 9.3L4.4 20h2l5.7-6 4.6 6H21l-7.5-9.7L20.3 4h-2l-5.3 5.6L8.7 4z" fill="currentColor"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3.4" stroke="currentColor" stroke-width="1.7"/><circle cx="7.6" cy="7.7" r="1.35" fill="currentColor"/><path d="M6.6 10.6h2v7h-2z" fill="currentColor"/><path d="M11 17.6v-7h1.9v1a2.9 2.9 0 0 1 2.5-1.2c1.8 0 2.9 1.15 2.9 3.3v3.9h-2v-3.6c0-1.1-.5-1.75-1.5-1.75s-1.7.7-1.7 1.8v3.55z" fill="currentColor"/></svg>'
};

/* ---------------------------------------------------------- angle diagrams
   A top-down plan: the product is the rounded block in the middle, the
   orange dot is where the phone stands, and the pale wedge is what it
   sees. Computed rather than hand-placed, so every wedge points at the
   middle of the product and they all read as the same kind of drawing. */
function angle(kind) {
  const W = 132, H = 96, cx = W / 2, cy = H / 2;
  const product = '<rect x="' + (cx - 24) + '" y="' + (cy - 15) + '" width="48" height="30" rx="7" fill="#FFFFFF" stroke="#191919" stroke-width="1.8"/>' +
    '<path d="M' + (cx - 24) + ' ' + (cy + 7) + 'h48" stroke="#191919" stroke-width="1.2" opacity=".35"/>';
  let under = '', over = '';
  const CAM = {
    front: [cx, H - 8], back: [cx, 8], left: [10, cy], right: [W - 10, cy],
    fl: [16, H - 10], fr: [W - 16, H - 10]
  };
  if (CAM[kind]) {
    const [x, y] = CAM[kind];
    const dx = cx - x, dy = cy - y, len = Math.hypot(dx, dy);
    const px = -dy / len, py = dx / len, spread = 27;
    const a = [cx + px * spread, cy + py * spread], b = [cx - px * spread, cy - py * spread];
    under = '<path d="M' + x + ' ' + y + 'L' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + 'Z" fill="#E0682A" opacity=".13"/>';
    over = '<circle cx="' + x + '" cy="' + y + '" r="7.5" fill="#E0682A"/><circle cx="' + x + '" cy="' + y + '" r="2.6" fill="#FFFFFF"/>';
  } else if (kind === 'above') {
    over = '<circle cx="' + cx + '" cy="' + cy + '" r="36" fill="none" stroke="#E0682A" stroke-width="1.6" stroke-dasharray="4 4" opacity=".7"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="7.5" fill="#E0682A"/><circle cx="' + cx + '" cy="' + cy + '" r="2.6" fill="#FFFFFF"/>';
  } else if (kind === 'close') {
    under = '<defs><pattern id="weave" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v5" stroke="#191919" stroke-width="1" opacity=".22"/></pattern></defs>';
    over = '<rect x="' + (cx - 24) + '" y="' + (cy - 15) + '" width="48" height="30" rx="7" fill="url(#weave)"/>' +
      '<circle cx="' + (cx + 14) + '" cy="' + (cy - 6) + '" r="15" fill="#FFFFFF" fill-opacity=".55" stroke="#E0682A" stroke-width="2.4"/>' +
      '<path d="m' + (cx + 25) + ' ' + (cy + 5) + ' 11 11" stroke="#E0682A" stroke-width="3.4" stroke-linecap="round"/>';
  }
  return '<svg class="ang-art" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + under + product + over + '</svg>';
}

/* a box with its three measurements on it, for the measurements section */
const DIMS = '<svg class="dims-art" viewBox="0 0 220 170" aria-hidden="true">' +
  '<path d="M60 70 130 42l62 26-70 30z" fill="#FDFBF7" stroke="#191919" stroke-width="1.8" stroke-linejoin="round"/>' +
  '<path d="M60 70v62l62 30V98z" fill="#F4EFE5" stroke="#191919" stroke-width="1.8" stroke-linejoin="round"/>' +
  '<path d="M122 98v64l70-32V68z" fill="#FFFFFF" stroke="#191919" stroke-width="1.8" stroke-linejoin="round"/>' +
  '<path d="M52 142 114 172" stroke="#E0682A" stroke-width="2" stroke-linecap="round"/><path d="M49 136v12M117 166v12" stroke="#E0682A" stroke-width="2" stroke-linecap="round"/>' +
  '<text x="18" y="160" font-size="12" font-weight="700" fill="#E0682A" font-family="Inter,Arial,sans-serif">Width</text>' +
  '<path d="M128 168 198 136" stroke="#E0682A" stroke-width="2" stroke-linecap="round"/>' +
  '<text x="170" y="164" font-size="12" font-weight="700" fill="#E0682A" font-family="Inter,Arial,sans-serif">Depth</text>' +
  '<path d="M204 64v66" stroke="#E0682A" stroke-width="2" stroke-linecap="round"/><path d="M198 64h12M198 130h12" stroke="#E0682A" stroke-width="2" stroke-linecap="round"/>' +
  '<text x="162" y="30" font-size="12" font-weight="700" fill="#E0682A" font-family="Inter,Arial,sans-serif">Height</text>' +
  '<path d="M190 34 204 58" stroke="#E0682A" stroke-width="1.4" stroke-dasharray="3 3"/>' +
  '</svg>';

/* ------------------------------------------------------------------ copy
   Every sentence sits in an element of its own, with no markup inside it.
   The translation layer matches whole elements against their English
   text, so "<b>Photos</b>from every side" would be one key nobody writes
   and two words that never translate. */
function body(BIZ) {
  const mail = '<a href="mailto:' + BIZ.email + '">' + BIZ.email + '</a>';

  const STEPS = [
    ['you', ICON.cart, 'You order', 'A confirmation email arrives straight away with a link to this page.'],
    ['you', ICON.camera, 'You send photos and sizes', '10 products for Starter, 25 for Studio. Everything on this page.'],
    ['us', ICON.check, 'We check them', 'Within 1 working day. If a photo will not work, we tell you before any modelling starts.'],
    ['us', ICON.cube, 'We build', 'About 7 working days, counted from the day we have usable photos.'],
    ['you', ICON.eye, 'You review', 'Your catalogue, QR code and link. Anything wrong, we fix at no cost.'],
    ['us', ICON.live, 'It goes live', 'Customers start placing your products in their rooms.']
  ];

  const ANGLES = [
    ['front', 'Front'], ['back', 'Back'], ['left', 'Left side'], ['right', 'Right side'],
    ['fl', 'Front-left corner'], ['fr', 'Front-right corner'], ['above', 'From above'], ['close', 'Material close-up']
  ];

  const DO = [
    ['The whole product in frame', 'Nothing cut off at the edges.'],
    ['One product per photo', 'So we can see where it starts and ends.'],
    ['Soft, even light', 'A window or an overcast day. No hard shadows.'],
    ['A plain background', 'A bare wall or floor behind it.'],
    ['True colour', 'No filters, beauty mode or heavy editing.'],
    ['Sharp and steady', 'Wipe the lens, brace your hands.']
  ];
  const DONT = [
    ['Part of the product cut off', 'We cannot invent what the camera did not see.'],
    ['Two products in one shot', 'We cannot tell where one ends.'],
    ['Strong sun or one side light', 'Hard shadows hide the shape.'],
    ['Busy or patterned backgrounds', 'A patterned rug on a patterned floor.'],
    ['Filters or edited colour', 'Customers are matching it to their room.'],
    ['Screenshots or supplier images', 'Too small, and often not yours to use.']
  ];

  const MEASURE = [
    [ICON.sofa, 'Furniture', ['Width', 'Depth', 'Height', 'Seat height (for seating)']],
    [ICON.rug, 'Rugs and carpets', ['Length', 'Width', 'Shape: rectangle, round or runner'], 'Photograph it flat, from directly above.'],
    [ICON.shoe, 'Footwear', ['The size you sell it as', 'Sole length in cm'], 'Photos: outer side, inner side, top, sole, front, back.'],
    [ICON.lamp, 'Lamps and decor', ['Height', 'Widest point', 'Drop, if it hangs']]
  ];

  const GET = [
    [ICON.store, 'Your own catalogue', 'At your own address, with only your products in it.'],
    [ICON.qr, 'A QR code', 'For your window, counter, packaging or ads.'],
    [ICON.phone, 'True-size AR', 'Every product at its real size, on iPhone and Android.'],
    [ICON.cube, 'Your 3D models', 'They are yours. Leave any time and we send you the files.']
  ];

  const li = (arr, cls) => arr.map(([t, d]) =>
    '<li class="' + cls + '"><span class="rule-ico">' + (cls === 'do' ? ICON.tick : ICON.cross) + '</span>' +
    '<span class="r-txt"><b>' + t + '</b><small>' + d + '</small></span></li>').join('\n          ');

  return `
<main class="guide">

  <!-- Two openings, one page. Someone arriving from checkout, or from the
       /welcome link in our emails, is thanked for an order. Anyone else
       reading ahead is not, because thanking a visitor for an order they
       never placed reads as a broken page. The class is set in <head>
       before anything paints, so neither one flashes. -->
  <section class="welcome w-order" aria-label="Order confirmed">
    <span class="w-ico">${ICON.check}</span>
    <div class="w-copy">
      <p class="w-chip">Order confirmed</p>
      <h2 class="w-title">Thank you, and welcome to ARQR360</h2>
      <p class="w-text">We will be in touch within 1 to 2 business days to get started.</p>
      <p class="w-text">In the meantime, please read through this page and get your photos and measurements ready, so we can begin building your catalogue as soon as they arrive.</p>
    </div>
  </section>
  <section class="welcome w-guest" aria-label="Welcome">
    <span class="w-ico">${ICON.cube}</span>
    <div class="w-copy">
      <p class="w-chip">Welcome to ARQR360</p>
      <h2 class="w-title">Planning your AR catalogue?</h2>
      <p class="w-text">This page shows exactly what we need from you. Get it ready now, and we can start building the moment you are on board.</p>
    </div>
    <a class="demo-btn w-demo" href="/catalogue">${ICON.phone}<span>See a live example</span></a>
  </section>

  <section class="g-hero">
    <div class="g-hero-copy">
      <p class="eyebrow">Your checklist</p>
      <h1>What we need from you</h1>
      <p class="lead">Everything to send us for your AR catalogue, in one page. Most shops have it ready in an afternoon with just a phone.</p>
      <nav class="g-jump" aria-label="On this page">
        <a href="#how-it-works">How it works</a>
        <a href="#photographs">Photos</a>
        <a href="#measurements">Measurements</a>
        <a href="#how-to-send-it">How to send</a>
        <a href="#questions">Questions</a>
      </nav>
    </div>
    <aside class="g-short" aria-label="In short">
      <p class="g-short-t">In short, for each product</p>
      <ul>
        <li><span class="g-num">8</span><span class="g-t"><b>Photos</b><small>from every side, taken on a phone</small></span></li>
        <li><span class="g-num">cm</span><span class="g-t"><b>Real measurements</b><small>measured, not from a supplier sheet</small></span></li>
        <li><span class="g-num">1</span><span class="g-t"><b>Email</b><small>with everything, named clearly</small></span></li>
      </ul>
    </aside>
  </section>

  <section class="g-sec" id="how-it-works">
    <div class="g-head">
      <p class="g-kicker">Step by step</p>
      <h2>How it works</h2>
    </div>
    <ol class="steps">
      ${STEPS.map(([who, ico, t, d], i) => `<li class="step">
        <div class="step-top"><span class="step-n">${i + 1}</span><span class="who who-${who}">${who === 'you' ? 'You' : 'Us'}</span></div>
        <span class="step-ico">${ico}</span>
        <h3>${t}</h3>
        <p>${d}</p>
      </li>`).join('\n      ')}
    </ol>
    <p class="note">${ICON.clock}<span>The 7 days start when we have photos we can work from, not the day you order. If one will not work, we tell you the same day.</span></p>
  </section>

  <section class="g-sec" id="photographs">
    <div class="g-head">
      <p class="g-kicker">Photos</p>
      <h2>8 photos of each product</h2>
      <p class="g-sub">We rebuild the product in 3D, so we need to see every side. A phone camera is perfect, no studio needed.</p>
    </div>
    <ul class="angles">
      ${ANGLES.map(([k, t], i) => `<li class="ang"><span class="ang-n">${i + 1}</span>${angle(k)}<b>${t}</b></li>`).join('\n      ')}
    </ul>
    <p class="legend"><span class="dot"></span><span>Where you stand with the phone, looking down at the product from above.</span></p>
  </section>

  <section class="g-sec" id="what-makes-a-photograph-unusable">
    <div class="g-head">
      <p class="g-kicker">Before you shoot</p>
      <h2>Good photos, and ones we send back</h2>
    </div>
    <div class="rules">
      <div class="rule-card rule-do">
        <p class="rule-t">${ICON.tick}Do</p>
        <ul>
          ${li(DO, 'do')}
        </ul>
      </div>
      <div class="rule-card rule-dont">
        <p class="rule-t">${ICON.cross}Avoid</p>
        <ul>
          ${li(DONT, 'dont')}
        </ul>
      </div>
    </div>
  </section>

  <section class="g-sec" id="measurements">
    <div class="g-head">
      <p class="g-kicker">Measurements</p>
      <h2>Real sizes, in centimetres</h2>
      <p class="g-sub">This is what makes it true-size AR. A customer is asking whether it fits their room, and a guessed size gives them the wrong answer.</p>
    </div>
    <div class="measure">
      <div class="measure-art">
        ${DIMS}
        <p class="m-lead">Measure it yourself.</p>
        <p>Supplier sheets are often rounded or wrong.</p>
        <p>Several sizes of one product? Send each one. They become separate items.</p>
      </div>
      <ul class="measure-grid">
        ${MEASURE.map(([ico, t, chips, extra]) => `<li class="m-card">
          <div class="m-top"><span class="m-ico">${ico}</span><h3>${t}</h3></div>
          <ul class="chips">${chips.map((c) => '<li>' + c + '</li>').join('')}</ul>
          ${extra ? '<p>' + extra + '</p>' : ''}
        </li>`).join('\n        ')}
      </ul>
    </div>
    <div class="files3d">
      <span class="f-ico">${ICON.cube}</span>
      <div>
        <h3>Already have 3D files?</h3>
        <p>Send them and we skip the modelling. Still tell us the real size, since files often arrive at the wrong scale.</p>
      </div>
      <ul class="chips chips-mono"><li>.glb</li><li>.gltf</li><li>.usdz</li><li>.fbx</li><li>.obj</li></ul>
    </div>
  </section>

  <section class="g-sec" id="how-to-send-it">
    <div class="g-head">
      <p class="g-kicker">Sending</p>
      <h2>How to send it</h2>
    </div>
    <ul class="send">
      <li class="send-card"><span class="s-ico">${ICON.mail}</span><h3>Email</h3><p>${mail}</p></li>
      <li class="send-card"><span class="s-ico">${ICON.form}</span><h3>The form</h3><p><a href="/#f-name">Attach files on our home page</a></p></li>
      <li class="send-card"><span class="s-ico">${ICON.link}</span><h3>Large files</h3><p>A Google Drive, Dropbox or WeTransfer link</p></li>
    </ul>
    <div class="naming">
      <div class="name-card">
        <p class="rule-t">${ICON.file}Name each file: product, then angle</p>
        <div class="name-row name-bad"><span class="rule-ico">${ICON.cross}</span><code>IMG_4471.jpg</code></div>
        <div class="name-row name-good"><span class="rule-ico">${ICON.tick}</span><code>oak-dining-chair-front.jpg</code></div>
      </div>
      <div class="name-card">
        <p class="rule-t">${ICON.ruler}Put the sizes in the email itself</p>
        <div class="email-eg">
          <span class="eg-name">Oak dining chair</span>
          <span>W 46 x D 52 x H 88 cm, seat 45 cm</span>
          <span class="eg-name">Round jute rug</span>
          <span>Diameter 160 cm</span>
        </div>
      </div>
    </div>
  </section>

  <section class="g-sec" id="what-you-get-at-the-end">
    <div class="g-head">
      <p class="g-kicker">The result</p>
      <h2>What you get at the end</h2>
    </div>
    <ul class="get">
      ${GET.map(([ico, t, d]) => `<li class="get-card"><span class="s-ico">${ico}</span><h3>${t}</h3><p>${d}</p></li>`).join('\n      ')}
    </ul>
    <div class="demo-band">
      <span class="demo-ico">${ICON.phone}</span>
      <div class="demo-copy">
        <h3>See what yours will look like</h3>
        <p>Open one of our sample catalogues on your phone and place a product in your own room.</p>
      </div>
      <a class="demo-btn" href="/catalogue">${ICON.phone}<span>See a live example</span></a>
    </div>
    <p class="note">${ICON.store}<span>Orders go straight to you. We are not a shop and we never touch your customers' money.</span></p>
  </section>

  <section class="g-sec g-pair" id="adding-products-later">
    <div class="pair-card">
      <span class="s-ico">${ICON.plus}</span>
      <h3>Adding products later</h3>
      <p>Send them the same way. Extra products are charged at the rate on the pricing page and join the same catalogue. You never start again.</p>
    </div>
    <div class="pair-card" id="if-something-is-not-right">
      <span class="s-ico">${ICON.wrench}</span>
      <h3>If something is not right</h3>
      <p>Wrong size, wrong colour, not what you asked for: we fix it at no cost, with no time limit on a mistake that is ours.</p>
    </div>
  </section>

  <section class="g-cta" id="questions">
    <div class="cta-copy">
      <p class="g-kicker">Ready, or not sure?</p>
      <h2>Send it over, or just ask</h2>
      <p>A real person reads every email and replies within one working day.</p>
    </div>
    <div class="cta-actions">
      <a class="btn-main" href="mailto:${BIZ.email}">${ICON.mail}<span>Email ${BIZ.email}</span></a>
      <a class="btn-alt" href="/#f-name">${ICON.form}<span>Use the contact form</span></a>
      <nav class="cta-social" aria-label="${BIZ.name} on social media">
        <span>Follow us</span>
        <a href="https://www.instagram.com/arqr360" target="_blank" rel="noopener" aria-label="${BIZ.name} on Instagram">${SOCIAL.instagram}</a>
        <a href="https://x.com/arqr360" target="_blank" rel="noopener" aria-label="${BIZ.name} on X">${SOCIAL.x}</a>
        <a href="https://www.linkedin.com/company/arqr360/" target="_blank" rel="noopener" aria-label="${BIZ.name} on LinkedIn">${SOCIAL.linkedin}</a>
      </nav>
    </div>
  </section>

</main>`;
}

const CSS = `
  body.is-guide{--wrap:min(1140px, calc(100% - 2 * var(--gutter)))}
  /* the switcher sits beside Back, not floating in the middle of the bar */
  body.is-guide .bar .lang{margin-inline-start:auto;margin-inline-end:10px}
  .guide{width:var(--wrap);margin:0 auto;padding:clamp(34px,5vw,64px) 0 clamp(40px,6vw,72px)}
  .guide h1,.guide h2{text-wrap:balance}
  .guide h1{font-size:clamp(34px,5.2vw,58px);line-height:1.04;margin:0 0 16px}
  .guide h2{border:0;padding:0;margin:0;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;line-height:1.15}
  .guide h3{font-family:var(--f-head);font-weight:700;font-size:17px;line-height:1.25;margin:0;letter-spacing:-.005em}
  /* resets at zero specificity: .guide li would outrank .step and strip
     every card that is also a list item of its padding */
  :where(.guide) ul,:where(.guide) ol{list-style:none;margin:0;padding:0}
  :where(.guide) li{padding:0;margin:0}
  .guide li::before{content:none}
  :where(.guide) p{margin:0}
  .guide svg{display:block}

  /* cards read as surfaces over the grid, not as holes in it */
  .card-surface,.step,.ang,.rule-card,.m-card,.measure-art,.files3d,.send-card,.name-card,.get-card,.pair-card,.g-short{
    background:#FFFFFF;border:1px solid var(--line);border-radius:18px;
    box-shadow:0 1px 0 rgba(25,25,25,.02),0 14px 30px -24px rgba(70,50,30,.35)}

  /* hero */
  .g-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);
    align-items:center;margin-bottom:clamp(44px,6vw,80px)}
  .g-hero .lead{font-size:clamp(17px,1.6vw,20px);max-width:44ch}
  .g-jump{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}
  .g-jump a{display:inline-flex;align-items:center;min-height:40px;padding:8px 16px;border-radius:100px;
    background:var(--page-hi);border:1px solid var(--line);font-size:14px;font-weight:600;
    text-decoration:none;color:var(--ink);transition:border-color .2s ease,color .2s ease}
  .g-jump a:hover{border-color:var(--accent);color:var(--accent)}
  .g-short{padding:clamp(20px,2.4vw,28px)}
  .g-short-t{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:14px!important}
  .g-short li{display:flex;align-items:center;gap:14px;padding:12px 0;border-top:1px solid var(--line)}
  .g-short li:first-child{border-top:0;padding-top:0}
  .g-num{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:14px;
    background:#FCE7D8;color:var(--accent);font-family:var(--f-head);font-weight:800;font-size:22px}
  .g-t b{display:block;font-size:16px;color:var(--ink)}
  .g-t small{display:block;font-size:14px;color:var(--ink-soft);line-height:1.45}

  /* sections */
  .g-sec{margin-bottom:clamp(48px,7vw,92px);scroll-margin-top:110px}
  .g-head{margin-bottom:clamp(20px,2.6vw,30px);max-width:640px}
  .g-kicker{font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:8px!important}
  .g-sub{margin-top:10px!important;font-size:16.5px;color:var(--ink-soft);line-height:1.6}

  /* steps */
  .steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;counter-reset:s}
  .step{padding:20px 20px 22px}
  .step-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
  .step-n{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;
    background:var(--ink);color:#fff;font-family:var(--f-head);font-weight:800;font-size:15px}
  .who{font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:5px 10px;border-radius:100px}
  .who-you{background:#FCE7D8;color:#A94A17}
  .who-us{background:#E7EFE9;color:#23633F}
  .step-ico{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:var(--page-alt);color:var(--ink);margin-bottom:12px}
  .step-ico svg{width:22px;height:22px}
  .step h3{margin-bottom:6px}
  .step p{font-size:14.5px;line-height:1.55;color:var(--ink-soft)}
  .note{display:flex;align-items:flex-start;gap:12px;margin-top:16px!important;padding:14px 18px;border-radius:14px;
    background:rgba(224,104,42,.08);border:1px solid rgba(224,104,42,.22);font-size:15px;line-height:1.55;color:var(--ink)}
  .note svg{flex:none;width:20px;height:20px;color:var(--accent);margin-top:1px}

  /* angles */
  .angles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
  .ang{position:relative;padding:14px 14px 16px;text-align:center}
  .ang-n{position:absolute;top:10px;left:10px;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;
    background:var(--page-alt);font-size:12px;font-weight:700;color:var(--ink-soft)}
  .ang-art{width:100%;max-width:170px;height:auto;margin:6px auto 10px}
  .ang b{display:block;font-size:14.5px;font-weight:600}
  .legend{display:flex;align-items:center;gap:10px;margin-top:14px!important;font-size:14px;color:var(--ink-soft)}
  .legend .dot{flex:none;width:14px;height:14px;border-radius:50%;background:var(--accent);box-shadow:inset 0 0 0 4px var(--accent),inset 0 0 0 7px #fff}

  /* do and avoid */
  .rules{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
  .rule-card{padding:clamp(18px,2.2vw,26px)}
  .rule-t{display:flex;align-items:center;gap:10px;font-family:var(--f-head);font-weight:700;font-size:18px;margin-bottom:12px!important}
  .rule-t svg{width:22px;height:22px}
  .rule-do .rule-t svg{color:#23633F}
  .rule-dont .rule-t svg{color:#C2412A}
  .rule-card li{display:flex;align-items:flex-start;gap:12px;padding:11px 0;border-top:1px solid var(--line)}
  .rule-card li:first-child{border-top:0}
  .rule-ico{flex:none;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;margin-top:1px}
  .rule-ico svg{width:14px;height:14px}
  .do .rule-ico,.name-good .rule-ico{background:#DDF1E4;color:#23633F}
  .dont .rule-ico,.name-bad .rule-ico{background:#FBE1DA;color:#C2412A}
  .r-txt b{display:block;font-size:15.5px;font-weight:600;line-height:1.35}
  .r-txt small{display:block;font-size:14.5px;color:var(--ink-soft);line-height:1.5}

  /* measurements */
  .measure{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.6fr);gap:16px;align-items:stretch}
  .measure-art{padding:22px;display:flex;flex-direction:column;gap:10px;justify-content:center}
  .dims-art{width:100%;max-width:260px;height:auto;margin:0 auto 6px}
  .measure-art p{font-size:14.5px;line-height:1.55;color:var(--ink-soft)}
  .measure-art .m-lead{color:var(--ink);font-weight:600}
  .measure-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
  .m-card{padding:20px}
  .m-top{display:flex;align-items:center;gap:12px;margin-bottom:14px}
  .m-ico,.s-ico,.f-ico{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#FCE7D8;color:var(--accent)}
  .m-ico svg,.s-ico svg,.f-ico svg{width:23px;height:23px}
  .chips{display:flex;flex-wrap:wrap;gap:7px}
  .chips li{padding:6px 11px;border-radius:9px;background:var(--page-alt);border:1px solid var(--line);font-size:13.5px;font-weight:600;line-height:1.3}
  .m-card p{margin-top:12px!important;font-size:14px;line-height:1.5;color:var(--ink-soft)}
  .files3d{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:16px;padding:18px 22px}
  .files3d > div{flex:1 1 280px;min-width:0}
  .files3d p{margin-top:4px!important;font-size:14.5px;line-height:1.5;color:var(--ink-soft)}
  .chips-mono li{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:500}

  /* sending */
  .send,.get{display:grid;gap:16px}
  .send{grid-template-columns:repeat(3,minmax(0,1fr))}
  .get{grid-template-columns:repeat(4,minmax(0,1fr))}
  .send-card,.get-card,.pair-card{padding:20px 20px 22px}
  .send-card h3,.get-card h3,.pair-card h3{margin:14px 0 6px}
  .send-card p,.get-card p,.pair-card p{font-size:14.5px;line-height:1.55;color:var(--ink-soft);overflow-wrap:anywhere}
  .send-card a{color:var(--accent);font-weight:600;text-decoration:none}
  .send-card a:hover{text-decoration:underline}
  .naming{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}
  .name-card{padding:20px 22px}
  .name-card .rule-t{font-size:16px}
  .name-card .rule-t svg{color:var(--accent)}
  .name-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:var(--page-hi);border:1px solid var(--line);margin-top:8px}
  .name-row code{background:none;border:0;padding:0;font-size:14.5px;overflow-wrap:anywhere}
  .name-bad code{text-decoration:line-through;text-decoration-color:rgba(194,65,42,.6);color:var(--ink-soft)}
  .email-eg{padding:14px 16px;border-radius:12px;background:var(--page-hi);border:1px solid var(--line);
    font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;line-height:1.6;color:var(--ink)}
  .email-eg span{display:block}
  .email-eg .eg-name{font-weight:700}
  .email-eg .eg-name + span + .eg-name{margin-top:12px}

  .g-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}

  /* the closing call, dark like the home page's contact block */
  .g-cta{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px 40px;align-items:center;
    padding:clamp(26px,4vw,48px);border-radius:24px;background:#191919;color:#fff;
    background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);
    background-size:34px 34px;scroll-margin-top:110px}
  .g-cta h2{color:#fff}
  .g-cta .cta-copy p:last-child{margin-top:10px!important;color:rgba(255,255,255,.72);font-size:16px}
  .cta-actions{display:flex;flex-direction:column;gap:10px;min-width:min(340px,100%)}
  .btn-main,.btn-alt{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:14px 22px;
    border-radius:12px;font-weight:700;font-size:15.5px;text-decoration:none;transition:transform .2s ease,background .2s ease}
  .btn-main{background:var(--accent);color:#fff;box-shadow:0 16px 30px -14px rgba(224,104,42,.9)}
  .btn-main:hover{color:#fff;transform:translateY(-2px)}
  .btn-alt{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.2)}
  .btn-alt:hover{color:#fff;background:rgba(255,255,255,.14)}
  .btn-main svg,.btn-alt svg{width:19px;height:19px;flex:none}
  .btn-main span{overflow-wrap:anywhere}
  .cta-social{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px}
  .cta-social span{font-size:13.5px;color:rgba(255,255,255,.6);margin-right:4px}
  .cta-social a{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;color:#fff;
    border:1px solid rgba(255,255,255,.18);transition:background .2s ease,border-color .2s ease}
  .cta-social a:hover{color:#fff;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.4)}
  .cta-social svg{width:20px;height:20px}

  .guide a:focus-visible,.g-jump a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}

  /* ---- the opening message: one of two, chosen in <head> ---- */
  .welcome{display:flex;align-items:center;gap:clamp(14px,2vw,22px);
    margin-bottom:clamp(30px,4.4vw,52px);padding:clamp(18px,2.6vw,28px);
    border-radius:20px;background:#FFFFFF;border:1px solid var(--line);
    box-shadow:0 18px 40px -30px rgba(70,50,30,.45)}
  .w-order{display:none;border-color:rgba(35,99,63,.25);
    background:linear-gradient(100deg,#F1F8F3 0%,#FFFFFF 62%)}
  html.is-welcome .w-order{display:flex}
  html.is-welcome .w-guest{display:none}
  .w-ico{flex:none;display:grid;place-items:center;width:56px;height:56px;border-radius:16px;
    background:#FCE7D8;color:var(--accent)}
  .w-order .w-ico{background:#DDF1E4;color:#23633F}
  .w-ico svg{width:28px;height:28px}
  .w-copy{flex:1 1 auto;min-width:0}
  .w-chip{display:inline-block;margin-bottom:8px!important;padding:4px 11px;border-radius:100px;
    font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
    background:#FCE7D8;color:#A94A17}
  .w-order .w-chip{background:#DDF1E4;color:#23633F}
  .welcome .w-title{font-size:clamp(21px,2.4vw,28px);margin-bottom:6px}
  .w-text{font-size:16px;line-height:1.6;color:var(--ink-soft);max-width:70ch}
  .w-text + .w-text{margin-top:4px!important}

  /* ---- the sample catalogues, in the accent rather than beside it ---- */
  /* the same button as the home page's: solid accent, light shadow */
  .demo-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:9px;
    min-height:48px;padding:12px 22px;border-radius:100px;border:0;
    background:var(--accent);color:#FFFFFF;font-weight:600;font-size:15px;
    text-decoration:none;white-space:nowrap;box-shadow:0 4px 12px -6px rgba(224,104,42,.55);
    transition:background .2s ease,transform .2s ease}
  .demo-btn:hover{background:#C9571E;color:#FFFFFF;transform:translateY(-1px)}
  .demo-btn svg{width:19px;height:19px}
  .demo-band{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:16px;
    padding:clamp(18px,2.4vw,26px);border-radius:18px;
    background:linear-gradient(100deg,#FDEBDD 0%,#FFF7F1 70%);border:1px solid rgba(224,104,42,.28)}
  .demo-ico{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:14px;
    background:#FFFFFF;color:var(--accent)}
  .demo-ico svg{width:26px;height:26px}
  .demo-copy{flex:1 1 260px;min-width:0}
  .demo-copy p{margin-top:4px!important;font-size:15px;line-height:1.55;color:var(--ink-soft)}

  [dir="rtl"] .ang-n{left:auto;right:10px}
  [dir="rtl"] .cta-social span{margin-right:0;margin-left:4px}

  @media(max-width:1000px){
    .g-hero{grid-template-columns:1fr}
    .angles{grid-template-columns:repeat(2,minmax(0,1fr))}
    .get{grid-template-columns:repeat(2,minmax(0,1fr))}
    .measure{grid-template-columns:1fr}
    .g-cta{grid-template-columns:1fr}
    .cta-actions{min-width:0}
  }
  @media(max-width:760px){
    .welcome{flex-wrap:wrap;align-items:flex-start}
    .w-demo{width:100%}
    .demo-btn{width:100%;white-space:normal}
    .steps,.rules,.send,.naming,.g-pair{grid-template-columns:1fr}
    .measure-grid{grid-template-columns:1fr}
  }
  @media(max-width:480px){
    .angles{gap:10px}
    .ang{padding:12px 8px 14px}
    .get{grid-template-columns:1fr}
    .g-jump a{min-height:44px}
  }
`;

module.exports = { body, CSS };
