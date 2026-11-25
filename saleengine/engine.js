/* ------------------------------------------------------------------
   ARQR360 Sales Engine (demo).

   The store owner's dashboard: which products shoppers place in their
   rooms, who is ready to buy, what to fix, and a QR code for any product
   in one click (download, print as a showroom tag, share, save).

   Products, photos and 3D models are the real ones from the four sample
   catalogues on arqr360.com (stores.js + shop-products.json). Visitor
   numbers, leads and sales are generated from a fixed seed so the demo
   looks the same every time; the page says "Sample data" at the top.
   Every QR code made here is real: it opens that product in AR.
   ------------------------------------------------------------------ */
(function () {
'use strict';
var BASE = 'https://arqr360.com';
var STORES = window.ARQR_STORES || [];
var PRODUCTS = {};
var S = { store: 'novara', range: 30, view: 'overview', arg: null, q: '', cat: 'All', status: 'All', layout: 'grid',
          qr: { slug: null, layout: 'tag', color: null, label: 'Scan to see it in your room', price: true, logo: true }, leadFilter: 'All' };
try { var sv = JSON.parse(localStorage.getItem('arqr.se.state') || '{}'); if (sv.store) S.store = sv.store; if (sv.range) S.range = sv.range; if (sv.layout) S.layout = sv.layout; } catch (e) {}
function save() { try { localStorage.setItem('arqr.se.state', JSON.stringify({ store: S.store, range: S.range, layout: S.layout })); } catch (e) {} }

/* ---------------------------------------------------------------- helpers */
var $ = function (s, el) { return (el || document).querySelector(s); };
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmt(n) { return Math.round(n).toLocaleString('en-AU'); }
function money(n) { return '$' + Math.round(n).toLocaleString('en-AU'); }
function pct(a, b) { return b ? (100 * a / b) : 0; }
function p1(x) { return (Math.round(x * 10) / 10).toFixed(1) + '%'; }
function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function store() { for (var i = 0; i < STORES.length; i++) if (STORES[i].slug === S.store) return STORES[i]; return STORES[0]; }
function priceOf(p) { return parseFloat(String(p.p || '0').replace(/[^0-9.]/g, '')) || 0; }
function img(st, p) { return '/assets/shops/' + st + '/' + p.f + '.webp'; }
function arUrl(st, slug, abs) { return (abs ? BASE : '') + '/saleengine/ar/?s=' + st + '&p=' + encodeURIComponent(slug) + (abs ? '&src=qr' : ''); }
function ago(min) { if (min < 1) return 'just now'; if (min < 60) return Math.round(min) + ' min ago'; if (min < 1440) return Math.round(min / 60) + ' h ago'; return Math.round(min / 1440) + ' d ago'; }
function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 2600); }
var I = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  box: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.6c2.4.2 4 1.8 4.6 4.4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.8-.7-.7-2.8z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  down: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  save: '<path d="M5 3h11l3 3v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.2a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6"/>',
  money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  msg: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  alert: '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  zip: '<path d="M6 2h9l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M11 4h2M11 7h2M11 10h2M11 13h2v3h-2z"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>'
};
function ic(n, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '>' + I[n] + '</svg>'; }

/* ---------------------------------------------------------------- sample data */
var DAYS = 90;
var CITY = { novara: ['Surry Hills', 'Bondi', 'Parramatta', 'Chatswood', 'Newtown', 'Manly', 'Mosman', 'Penrith', 'Ryde', 'Randwick'],
             corso: ['Fitzroy', 'St Kilda', 'Richmond', 'Carlton', 'Brunswick', 'Southbank', 'Footscray', 'Docklands', 'Toorak', 'Prahran'],
             maison: ['Fortitude Valley', 'New Farm', 'Paddington', 'West End', 'Toowong', 'Bulimba', 'Ascot', 'Kangaroo Point', 'Chermside', 'Indooroopilly'],
             terra: ['Ponsonby', 'Remuera', 'Parnell', 'Takapuna', 'Mt Eden', 'Grey Lynn', 'Devonport', 'Epsom', 'Newmarket', 'Herne Bay'] };
var FIRST = ['Olivia', 'Jack', 'Amelia', 'Noah', 'Isla', 'Liam', 'Mia', 'Oliver', 'Charlotte', 'Leo', 'Ava', 'Lucas', 'Grace', 'Henry', 'Zara', 'Ethan', 'Chloe', 'Arjun', 'Sophie', 'Mateo', 'Priya', 'Hannah'];
var LAST = ['Nguyen', 'Smith', 'Patel', 'Brown', 'Wilson', 'Taylor', 'Kim', 'Martin', 'Singh', 'Chen', 'Walker', 'Hall', 'Young', 'Lee', 'Khan', 'Roberts'];
var CACHE = {};
function data(st) {
  if (CACHE[st]) return CACHE[st];
  var R = rng(hash('arqr-se-' + st)), items = (PRODUCTS[st] || []).map(function (p, i) {
    var r = rng(hash(st + '/' + p.f)), w = 0.35 + r() * 1.5, price = priceOf(p);
    var conv = Math.max(0.035, 0.16 - Math.log10(Math.max(price, 20)) * 0.03 + r() * 0.04), ord = 0.28 + r() * 0.14;
    var daily = [];
    for (var d = 0; d < DAYS; d++) {
      var trend = 0.75 + 0.5 * (d / DAYS), wk = (d % 7 === 5 || d % 7 === 6) ? 1.35 : 1, wave = 1 + 0.18 * Math.sin((d + i * 3) / 5);
      var o = Math.max(0, Math.round(6.5 * w * trend * wk * wave * (0.7 + r() * 0.6)));
      var qr = Math.round(o * (0.25 + r() * 0.2));
      var placed = Math.round(o * (0.66 + r() * 0.12)), carts = Math.round(placed * conv * (0.8 + r() * 0.4));
      var orders = placed * conv * ord;                                   // kept fractional: totals round, not each day
      daily.push({ o: o, qr: qr, placed: placed, carts: carts, orders: orders, views: Math.round(o * (2.6 + r())) });
    }
    var status = 'live';
    if (i === 2) status = 'premium'; if (i === 6) status = 'premium';
    if (i === items_fix(st)) status = 'fix'; if (i === items_check(st)) status = 'check';
    return { p: p, slug: p.f, name: p.n, price: price, cat: p.c, size: (p.d || '').replace('�', '×'), daily: daily, status: status,
             dev: [0.55 + r() * 0.1, 0.3 + r() * 0.08], sizesTried: Math.round(1 + r() * 3), seed: r() };
  });
  var cities = CITY[st] || CITY.novara, leads = [];
  for (var k = 0; k < 16; k++) {
    var it = items[Math.floor(R() * items.length)]; if (!it) break;
    var hot = R() < 0.42, via = R() < 0.55 ? 'WhatsApp' : 'Email';
    var acts = hot ? ['Placed it in their room ' + (3 + Math.floor(R() * 4)) + ' times', 'Added to cart, did not check out', 'Came back 3 days in a row', 'Asked on WhatsApp about delivery']
                   : ['Placed it in their room twice', 'Opened it from your showroom tag', 'Saved a photo of it in their room', 'Compared 2 sizes'];
    leads.push({ id: 'L' + k, name: FIRST[Math.floor(R() * FIRST.length)] + ' ' + LAST[Math.floor(R() * LAST.length)], city: cities[Math.floor(R() * cities.length)],
                 item: it, hot: hot, via: via, act: acts[Math.floor(R() * acts.length)], seen: Math.floor(R() * (hot ? 300 : 4000)) + 2,
                 src: ['Showroom QR', 'Product page', 'Instagram link', 'Email'][Math.floor(R() * 4)], score: hot ? 70 + Math.floor(R() * 29) : 35 + Math.floor(R() * 30), offer: null });
  }
  leads.sort(function (a, b) { return b.score - a.score; });
  var heat = [];
  for (var dd = 0; dd < 7; dd++) { heat.push([]); for (var h = 0; h < 24; h++) { var base = h < 7 ? 0.05 : h < 11 ? 0.35 : h < 17 ? 0.55 : h < 22 ? 1 : 0.35; heat[dd].push(base * (dd >= 5 ? 1.3 : 1) * (0.7 + R() * 0.5)); } }
  return (CACHE[st] = { items: items, leads: leads, heat: heat, cities: cities });
}
function items_fix(st) { return { novara: 9, corso: 7, maison: 10, terra: 8 }[st] || 5; }
function items_check(st) { return { novara: 4, corso: 3, maison: 5, terra: 11 }[st] || 3; }
function sum(it, n, off) {
  off = off || 0; var t = { o: 0, qr: 0, placed: 0, carts: 0, orders: 0, views: 0 };
  for (var d = DAYS - n - off; d < DAYS - off; d++) { var x = it.daily[d]; if (!x) continue; for (var k in t) t[k] += x[k]; }
  t.rev = t.orders * it.price; return t;
}
function totals(items, n, off) {
  var t = { o: 0, qr: 0, placed: 0, carts: 0, orders: 0, views: 0, rev: 0 };
  items.forEach(function (it) { var s = sum(it, n, off); for (var k in t) t[k] += s[k]; });
  return t;
}
function series(items, n) {
  var a = [];
  for (var d = DAYS - n; d < DAYS; d++) { var o = 0, q = 0; items.forEach(function (it) { o += it.daily[d].o; q += it.daily[d].qr; }); a.push({ o: o, qr: q, d: d }); }
  return a;
}
function dayLabel(d) { var t = new Date(); t.setDate(t.getDate() - (DAYS - 1 - d)); return t.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); }

/* ---------------------------------------------------------------- shell */
var NAV = [['overview', 'Overview', 'home'], ['products', 'Products', 'box'], ['qr', 'QR Studio', 'qr'], ['leads', 'Ready to buy', 'users'],
           ['reports', 'Reports', 'chart'], ['activity', 'Live activity', 'pulse'], ['health', 'Model health', 'wrench'], ['settings', 'Settings', 'gear']];
function shell() {
  var st = store(), D = data(st.slug);
  document.documentElement.style.setProperty('--tone', st.tone);
  $('#storeBtn').innerHTML = '<span class="storedot" style="background:' + st.tone + '">' + esc(st.name[0]) + '</span><span style="flex:1;min-width:0"><b style="font-weight:600">' + esc(st.name) +
    '</b><small>' + esc(st.kind) + ' · ' + D.items.length + ' products</small></span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 10 5 5 5-5"/></svg>';
  $('#storeMenu').innerHTML = '<div class="small muted" style="padding:6px 10px">Switch store (demo)</div>' + STORES.map(function (s) {
    return '<button type="button" data-store="' + s.slug + '"><span class="storedot" style="background:' + s.tone + '">' + esc(s.name[0]) + '</span><span><b style="font-weight:600">' + esc(s.name) + '</b><br><span class="small muted">' + esc(s.kind) + '</span></span></button>';
  }).join('');
  var fixN = D.items.filter(function (i) { return i.status === 'fix' || i.status === 'check'; }).length, hotN = D.leads.filter(function (l) { return l.hot; }).length;
  $('#nav').innerHTML = '<div class="navsec">Sell</div>' + NAV.map(function (n, i) {
    var c = n[0] === 'leads' ? '<span class="cnt">' + hotN + '</span>' : n[0] === 'health' && fixN ? '<span class="cnt">' + fixN + '</span>' : '';
    return (i === 4 ? '<div class="navsec">Understand</div>' : i === 6 ? '<div class="navsec">Manage</div>' : '') +
      '<a class="nav' + (S.view === n[0] || (S.view === 'product' && n[0] === 'products') ? ' on' : '') + '" href="#/' + n[0] + '">' + ic(n[2]) + n[1] + c + '</a>';
  }).join('');
  $('#avatar').textContent = st.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2);
}
function rangeChips() {
  return '<div class="chips">' + [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']].map(function (r) {
    return '<button class="chip' + (S.range === r[0] ? ' on' : '') + '" data-range="' + r[0] + '">' + r[1] + '</button>'; }).join('') + '</div>';
}
function head(title, crumb) { $('#title').textContent = title; $('#crumb').textContent = crumb || store().name; document.title = title + ' · ' + store().name + ' · ARQR360 Sales Engine'; }
function delta(a, b) { if (!b) return '<span class="d muted">new</span>'; var x = pct(a - b, b); return '<span class="d ' + (x >= 0 ? 'up' : 'down') + '">' + (x >= 0 ? '▲ ' : '▼ ') + Math.abs(x).toFixed(1) + '% <span class="muted" style="font-weight:500">vs previous ' + S.range + ' days</span></span>'; }
function spark(vals, col) {
  var w = 200, h = 34, mx = Math.max.apply(null, vals) || 1, n = vals.length;
  var pts = vals.map(function (v, i) { return (i * w / (n - 1)).toFixed(1) + ',' + (h - 3 - (v / mx) * (h - 6)).toFixed(1); }).join(' ');
  return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" width="100%"><polyline fill="none" stroke="' + col + '" stroke-width="2" points="' + pts + '" vector-effect="non-scaling-stroke"/></svg>';
}
function kpi(label, val, cur, prev, icon, col, sp) {
  return '<div class="card kpi"><div class="lbl"><span class="ico" style="width:26px;height:26px;border-radius:8px;background:' + col + '1A;color:' + col + '">' + ic(icon, ' style="width:14px;height:14px"') + '</span>' + label + '</div>' +
    '<div class="val num">' + val + '</div>' + delta(cur, prev) + (sp ? spark(sp, col) : '') + '</div>';
}
function statusPill(s) { return { live: '<span class="pill live">● Live</span>', premium: '<span class="pill prem">★ Premium</span>', fix: '<span class="pill fix">Needs photos</span>', check: '<span class="pill check">In quality check</span>' }[s]; }

function areaChart(pts) {
  var W = 900, H = 240, L = 40, B = 26, T = 10, n = pts.length, mx = Math.max.apply(null, pts.map(function (p) { return p.o; })) || 1;
  mx = Math.ceil(mx / 10) * 10;
  var x = function (i) { return L + i * (W - L - 8) / (n - 1); }, y = function (v) { return T + (H - T - B) * (1 - v / mx); };
  var all = pts.map(function (p, i) { return x(i).toFixed(1) + ',' + y(p.o).toFixed(1); }), qr = pts.map(function (p, i) { return x(i).toFixed(1) + ',' + y(p.qr).toFixed(1); });
  var g = '';
  for (var k = 0; k <= 4; k++) { var v = mx * k / 4; g += '<line x1="' + L + '" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#EFEAE1"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="#9A9187">' + Math.round(v) + '</text>'; }
  var step = Math.ceil(n / 7), lab = '';
  for (var i = 0; i < n; i += step) lab += '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="#9A9187">' + dayLabel(pts[i].d) + '</text>';
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" id="areachart">' + g +
    '<polygon fill="rgba(224,104,42,.14)" points="' + x(0) + ',' + y(0) + ' ' + all.join(' ') + ' ' + x(n - 1) + ',' + y(0) + '"/>' +
    '<polyline fill="none" stroke="#E0682A" stroke-width="2.4" points="' + all.join(' ') + '" vector-effect="non-scaling-stroke"/>' +
    '<polygon fill="rgba(47,95,168,.16)" points="' + x(0) + ',' + y(0) + ' ' + qr.join(' ') + ' ' + x(n - 1) + ',' + y(0) + '"/>' +
    '<polyline fill="none" stroke="#2F5FA8" stroke-width="2" points="' + qr.join(' ') + '" vector-effect="non-scaling-stroke"/>' + lab +
    '<rect x="' + L + '" y="0" width="' + (W - L) + '" height="' + (H - B) + '" fill="transparent" data-chart="1"/></svg>';
}
function wireChart(pts) {
  var el = $('#areachart'); if (!el) return; var tip = $('#tip');
  el.addEventListener('mousemove', function (e) {
    var r = el.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width * 900, i = Math.round((fx - 40) / (860 / (pts.length - 1)));
    i = Math.max(0, Math.min(pts.length - 1, i)); var p = pts[i];
    tip.innerHTML = '<b>' + dayLabel(p.d) + '</b><br>' + p.o + ' room opens · ' + p.qr + ' from QR codes'; tip.style.display = 'block';
    tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY - 10) + 'px';
  });
  el.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
}

/* ---------------------------------------------------------------- views */
function vOverview() {
  var st = store(), D = data(st.slug), n = S.range, cur = totals(D.items, n), prev = totals(D.items, n, n), pts = series(D.items, n);
  var noArConv = 1.1, arConv = pct(cur.orders, cur.o);
  head('Overview');
  var top = D.items.slice().sort(function (a, b) { return sum(b, n).o - sum(a, n).o; }).slice(0, 6), mxTop = sum(top[0], n).o || 1;
  var lots = D.items.filter(function (it) { var s = sum(it, n); return s.o > mxTop * 0.45 && pct(s.orders, s.o) < 2.2; })[0];
  var hot = D.leads.filter(function (l) { return l.hot; }), fix = D.items.filter(function (i) { return i.status === 'fix'; })[0];
  var focus = [];
  if (hot[0]) focus.push(['users', '#E0682A', hot.length + ' shoppers are ready to buy', hot[0].name + ' placed the ' + hot[0].item.name + ' in their room. Send an offer while it is warm.', 'Send offers', '#/leads']);
  if (lots) focus.push(['bulb', '#A86400', 'Lots of looks, few sales: ' + lots.name, fmt(sum(lots, n).o) + ' room opens but only ' + sum(lots, n).orders + ' orders. Try a limited offer or check the price.', 'See report', '#/product/' + lots.slug]);
  if (fix) focus.push(['alert', '#B4362B', fix.name + ' needs better photos', 'Shoppers see a softer model. Upload 3 close-ups and it goes live again in 48 hours.', 'Fix it', '#/health']);
  focus.push(['qr', '#2F5FA8', 'Put QR codes in your showroom', 'QR scans brought ' + fmt(cur.qr) + ' room opens. Print tags for the ' + Math.max(0, D.items.length - 6) + ' products without one.', 'Open QR Studio', '#/qr']);
  var srcs = [['Showroom QR codes', cur.qr, '#2F5FA8'], ['"View in your room" on product pages', Math.round((cur.o - cur.qr) * 0.72), '#E0682A'], ['Instagram & social links', Math.round((cur.o - cur.qr) * 0.19), '#6B3FA0'], ['Emails & WhatsApp', Math.round((cur.o - cur.qr) * 0.09), '#1E7F4F']];
  var smx = Math.max.apply(null, srcs.map(function (s) { return s[1]; }));
  return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px"><div><div class="h" style="font-size:18px;font-weight:700">Good afternoon 👋</div><div class="muted">Here is how ' + esc(st.name) + ' is selling with AR.</div></div>' + rangeChips() + '</div>' +
    '<div class="grid g5" style="margin-bottom:16px">' +
      kpi('Room opens', fmt(cur.o), cur.o, prev.o, 'eye', '#E0682A', pts.map(function (p) { return p.o; })) +
      kpi('Placed in a room', fmt(cur.placed), cur.placed, prev.placed, 'box', '#6B3FA0') +
      kpi('Added to cart after AR', fmt(cur.carts), cur.carts, prev.carts, 'cart', '#2F5FA8') +
      kpi('Sales after AR', money(cur.rev), cur.rev, prev.rev, 'money', '#1E7F4F') +
      '<div class="card kpi"><div class="lbl"><span class="ico" style="width:26px;height:26px;border-radius:8px;background:#1E7F4F1A;color:#1E7F4F">' + ic('bolt', ' style="width:14px;height:14px"') + '</span>Buy rate with AR</div><div class="val num">' + p1(arConv) + '</div><span class="d up">' + (arConv / noArConv).toFixed(1) + '× shoppers who did not use AR (' + p1(noArConv) + ')</span>' +
      '<div class="bar" style="margin-top:12px"><i style="width:' + Math.min(100, arConv * 12) + '%;background:#1E7F4F"></i></div><div class="bar" style="margin-top:6px"><i style="width:' + noArConv * 12 + '%;background:#C9C1B6"></i></div></div>' +
    '</div>' +
    '<div class="grid g3" style="margin-bottom:16px">' +
      '<div class="card span2"><div class="ch"><h2>Room opens per day</h2><div class="grow"></div><div class="legend"><span><i style="background:#E0682A"></i>All room opens</span><span><i style="background:#2F5FA8"></i>From QR codes</span></div></div><div class="pad">' + areaChart(pts) + '</div></div>' +
      '<div class="card"><div class="ch"><h2>Today\'s focus</h2><div class="grow"></div><span class="small muted">' + focus.length + ' things</span></div>' +
        focus.map(function (f) { return '<div class="li"><span class="ico" style="background:' + f[1] + '1A;color:' + f[1] + '">' + ic(f[0]) + '</span><div class="grow"><b style="font-weight:600">' + esc(f[2]) + '</b><div class="small muted">' + esc(f[3]) + '</div><a class="btn sm ghost" style="margin-top:8px" href="' + f[5] + '">' + f[4] + '</a></div></div>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="grid g3">' +
      '<div class="card span2"><div class="ch"><h2>Top products</h2><span class="sub">most placed in rooms</span><div class="grow"></div><a class="btn sm ghost" href="#/products">All products</a></div><div class="tblwrap"><table class="tbl"><thead><tr><th>Product</th><th class="hide-m">Room opens</th><th class="r">Buy rate</th><th class="r hide-m">Sales</th><th class="r">QR</th></tr></thead><tbody>' +
        top.map(function (it) { var s = sum(it, n); return '<tr class="click" data-go="#/product/' + it.slug + '"><td><div class="prod"><img class="thumb" src="' + img(st.slug, it.p) + '" alt="" loading="lazy"><div><b>' + esc(it.name) + '</b><span>' + esc(it.cat) + ' · ' + esc(it.p.p) + '</span></div></div></td>' +
          '<td class="hide-m" style="min-width:160px"><div style="display:flex;align-items:center;gap:10px"><div class="bar" style="flex:1"><i style="width:' + (100 * s.o / mxTop) + '%"></i></div><span class="num" style="width:38px;text-align:right">' + fmt(s.o) + '</span></div></td>' +
          '<td class="r num">' + p1(pct(s.orders, s.o)) + '</td><td class="r num hide-m">' + money(s.rev) + '</td><td class="r"><a class="iconbtn" title="Make QR code" href="#/qr/' + it.slug + '" onclick="event.stopPropagation()">' + ic('qr') + '</a></td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<div class="card"><div class="ch"><h2>Where room opens come from</h2></div><div class="pad" style="display:grid;gap:14px">' +
        srcs.map(function (s) { return '<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>' + s[0] + '</span><b class="num">' + fmt(s[1]) + '</b></div><div class="bar"><i style="width:' + (100 * s[1] / smx) + '%;background:' + s[2] + '"></i></div></div>'; }).join('') +
        '<div class="note">' + ic('info') + '<span>Every QR code you make in the QR Studio is counted separately, so you can see which showroom tag sells.</span></div></div></div>' +
    '</div>' +
    '<div class="card" style="margin-top:16px"><div class="ch"><span class="livedot"></span><h2>Live right now</h2><span class="sub">shoppers using AR on your products</span><div class="grow"></div><a class="btn sm ghost" href="#/activity">Open live activity</a></div><div class="feed" id="feed">' + feedHTML(5) + '</div></div>';
}

var FEED = [];
function makeEvent(st, D, R, minAgo) {
  var it = D.items[Math.floor(R() * D.items.length)], city = D.cities[Math.floor(R() * D.cities.length)];
  var dev = R() < 0.6 ? 'iPhone' : 'Android', k = R();
  var e = k < 0.45 ? ['eye', '#E0682A', 'Someone in ' + city + ' placed the <b>' + esc(it.name) + '</b> in their room']
        : k < 0.62 ? ['qr', '#2F5FA8', 'Showroom QR scanned for the <b>' + esc(it.name) + '</b>']
        : k < 0.78 ? ['cart', '#1E7F4F', 'Added to cart after AR: <b>' + esc(it.name) + '</b> (' + esc(it.p.p) + ')']
        : k < 0.9 ? ['msg', '#6B3FA0', 'A shopper asked on WhatsApp about the <b>' + esc(it.name) + '</b>']
        : ['star', '#A86400', 'Saved a photo of the <b>' + esc(it.name) + '</b> in their room'];
  return { icon: e[0], col: e[1], html: e[2], dev: dev, city: city, t: Date.now() - minAgo * 60000, slug: it.slug };
}
function feedHTML(n) {
  var st = store(), D = data(st.slug);
  if (!FEED.length || FEED.store !== st.slug) {
    FEED = []; FEED.store = st.slug; var R = rng(hash('feed' + st.slug + new Date().toDateString()));
    for (var i = 0; i < 30; i++) FEED.push(makeEvent(st, D, R, 1 + i * 3.7 + R() * 3));
  }
  return FEED.slice(0, n).map(function (e) {
    return '<div class="li"><span class="ico" style="background:' + e.col + '1A;color:' + e.col + '">' + ic(e.icon) + '</span><div class="grow">' + e.html + '<div class="small muted">' + e.dev + ' · ' + esc(e.city) + '</div></div><span class="t">' + ago((Date.now() - e.t) / 60000) + '</span></div>';
  }).join('');
}
setInterval(function () {
  if (!PRODUCTS[S.store]) return; var st = store(), D = data(st.slug);
  if (FEED.store === st.slug) FEED.unshift(makeEvent(st, D, Math.random, 0));
  var f = $('#feed'); if (f) f.innerHTML = feedHTML(S.view === 'activity' ? 14 : 5);
}, 7000);

function vProducts() {
  var st = store(), D = data(st.slug), n = S.range;
  head('Products', st.name + ' · ' + D.items.length + ' products in AR');
  var cats = ['All'].concat(Array.from(new Set(D.items.map(function (i) { return i.cat; }))));
  var list = D.items.filter(function (it) {
    return (S.cat === 'All' || it.cat === S.cat) && (S.status === 'All' || it.status === S.status) && (!S.q || it.name.toLowerCase().indexOf(S.q.toLowerCase()) >= 0);
  });
  var bar = '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px"><div class="chips">' + cats.map(function (c) { return '<button class="chip' + (S.cat === c ? ' on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
    '<select class="field" style="width:auto" id="statusSel">' + [['All', 'Any status'], ['live', 'Live'], ['premium', 'Premium'], ['check', 'In quality check'], ['fix', 'Needs photos']].map(function (o) { return '<option value="' + o[0] + '"' + (S.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
    '<div style="flex:1"></div>' + rangeChips() + '<div class="seg" style="width:150px"><button data-layout="grid" class="' + (S.layout === 'grid' ? 'on' : '') + '">Cards</button><button data-layout="table" class="' + (S.layout === 'table' ? 'on' : '') + '">Table</button></div>' +
    '<button class="btn brand" data-act="bulkzip">' + ic('zip') + 'All QR codes (ZIP)</button></div>';
  if (!list.length) return bar + '<div class="card empty">No products match. Try another filter.</div>';
  if (S.layout === 'table') {
    return bar + '<div class="card tblwrap"><table class="tbl"><thead><tr><th>Product</th><th>Status</th><th class="r">Price</th><th class="r hide-m">Room opens</th><th class="r hide-m">QR scans</th><th class="r">Buy rate</th><th class="r hide-m">Sales</th><th class="r">Actions</th></tr></thead><tbody>' +
      list.map(function (it) { var s = sum(it, n); return '<tr class="click" data-go="#/product/' + it.slug + '"><td><div class="prod"><img class="thumb" src="' + img(st.slug, it.p) + '" alt="" loading="lazy"><div><b>' + esc(it.name) + '</b><span>' + esc(it.cat) + ' · ' + esc(it.size) + '</span></div></div></td><td>' + statusPill(it.status) + '</td><td class="r num">' + esc(it.p.p) + '</td><td class="r num hide-m">' + fmt(s.o) + '</td><td class="r num hide-m">' + fmt(s.qr) + '</td><td class="r num">' + p1(pct(s.orders, s.o)) + '</td><td class="r num hide-m">' + money(s.rev) + '</td>' +
        '<td class="r" style="white-space:nowrap"><a class="iconbtn" title="QR code" href="#/qr/' + it.slug + '" onclick="event.stopPropagation()">' + ic('qr') + '</a> <a class="iconbtn" title="Open in AR" target="_blank" href="' + arUrl(st.slug, it.slug) + '" onclick="event.stopPropagation()">' + ic('ext') + '</a></td></tr>'; }).join('') +
      '</tbody></table></div>';
  }
  return bar + '<div class="pgrid">' + list.map(function (it) {
    var s = sum(it, n);
    return '<div class="card pcard"><div class="img" data-go="#/product/' + it.slug + '"><img src="' + img(st.slug, it.p) + '" alt="' + esc(it.name) + '" loading="lazy">' + statusPill(it.status) + '</div><div class="body">' +
      '<div><b style="font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(it.name) + '</b><span class="small muted">' + esc(it.p.p) + ' · ' + esc(it.size) + '</span></div>' +
      '<div class="stats"><span><b class="num">' + fmt(s.o) + '</b>room opens</span><span><b class="num">' + fmt(s.qr) + '</b>QR scans</span><span><b class="num">' + p1(pct(s.orders, s.o)) + '</b>buy rate</span></div>' +
      '<div class="acts"><a class="btn sm ghost" style="flex:1" href="#/product/' + it.slug + '">Report</a><a class="btn sm brand" style="flex:1" href="#/qr/' + it.slug + '">' + ic('qr') + 'QR code</a></div></div></div>';
  }).join('') + '</div>';
}

function vProduct(slug) {
  var st = store(), D = data(st.slug), it = D.items.filter(function (i) { return i.slug === slug; })[0];
  if (!it) { location.hash = '#/products'; return ''; }
  var n = S.range, s = sum(it, n), sp = sum(it, n, n), pts = series([it], n);
  head(it.name, st.name + ' · Products');
  var fun = [['Saw the product page', s.views], ['Opened it in their room', s.o], ['Placed it on the floor / wall', s.placed], ['Added to cart', s.carts], ['Ordered', s.orders]];
  var leads = D.leads.filter(function (l) { return l.item === it; });
  var iph = it.dev[0], and = it.dev[1], desk = Math.max(0.02, 1 - iph - and);
  return '<div style="margin-bottom:14px"><a class="btn sm ghost" href="#/products">← All products</a></div>' +
    '<div class="card pad" style="margin-bottom:16px"><div class="hero" style="flex-wrap:wrap"><img class="thumb lg" src="' + img(st.slug, it.p) + '" alt=""><div style="flex:1;min-width:220px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + statusPill(it.status) + '<span class="pill mute">' + esc(it.cat) + '</span></div>' +
      '<div class="h" style="font-size:24px;font-weight:800;margin:6px 0 4px">' + esc(it.name) + '</div><div class="muted">' + esc(it.p.p) + ' · real size ' + esc(it.size) + ' · locked to true size in AR</div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn ghost" target="_blank" href="' + arUrl(st.slug, it.slug) + '">' + ic('eye') + 'Try it in AR</a><button class="btn ghost" data-act="copylink" data-slug="' + it.slug + '">' + ic('link') + 'Copy AR link</button><a class="btn brand" href="#/qr/' + it.slug + '">' + ic('qr') + 'Generate QR code</a></div></div></div>' +
    '<div style="display:flex;justify-content:flex-end;margin-bottom:12px">' + rangeChips() + '</div>' +
    '<div class="grid g4" style="margin-bottom:16px">' + kpi('Room opens', fmt(s.o), s.o, sp.o, 'eye', '#E0682A', pts.map(function (p) { return p.o; })) + kpi('QR scans', fmt(s.qr), s.qr, sp.qr, 'qr', '#2F5FA8', pts.map(function (p) { return p.qr; })) +
      kpi('Orders after AR', fmt(s.orders), s.orders, sp.orders, 'cart', '#1E7F4F') + kpi('Sales after AR', money(s.rev), s.rev, sp.rev, 'money', '#6B3FA0') + '</div>' +
    '<div class="grid g3" style="margin-bottom:16px"><div class="card span2"><div class="ch"><h2>From first look to order</h2></div><div class="pad fun">' +
      fun.map(function (f, i) { return '<div class="st"><span class="small">' + f[0] + '</span><div class="b"><i style="width:' + Math.max(2, 100 * f[1] / fun[0][1]) + '%;opacity:' + (1 - i * 0.12) + '"></i></div><span class="num small" style="text-align:right"><b>' + fmt(f[1]) + '</b> ' + (i ? '· ' + p1(pct(f[1], fun[i - 1][1])) : '') + '</span></div>'; }).join('') +
      '</div></div>' +
      '<div class="card"><div class="ch"><h2>Phones used</h2></div><div class="pad" style="display:grid;gap:12px">' +
        [['iPhone (Quick Look)', iph, '#1D1A17'], ['Android (Scene Viewer)', and, '#1E7F4F'], ['Computer (scanned the QR)', desk, '#9A9187']].map(function (d) { return '<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>' + d[0] + '</span><b>' + Math.round(d[1] * 100) + '%</b></div><div class="bar"><i style="width:' + d[1] * 100 + '%;background:' + d[2] + '"></i></div></div>'; }).join('') +
        '<dl class="kv" style="margin-top:6px"><dt>Average time in AR</dt><dd>' + (40 + Math.round(it.seed * 70)) + ' seconds</dd><dt>Came back to look again</dt><dd>' + (18 + Math.round(it.seed * 20)) + '% of shoppers</dd><dt>Photos saved in rooms</dt><dd>' + fmt(s.placed * 0.08) + '</dd></dl></div></div></div>' +
    '<div class="grid g2"><div class="card"><div class="ch"><h2>Room opens per day</h2><div class="grow"></div><div class="legend"><span><i style="background:#E0682A"></i>All</span><span><i style="background:#2F5FA8"></i>QR</span></div></div><div class="pad">' + areaChart(pts) + '</div></div>' +
      '<div class="card"><div class="ch"><h2>Ready to buy this product</h2><div class="grow"></div><a class="btn sm ghost" href="#/leads">All shoppers</a></div>' +
        (leads.length ? leads.map(leadRow).join('') : '<div class="empty">No named shoppers yet for this product.<br><span class="small">' + fmt(s.o * 0.6) + ' people looked without leaving a name.</span></div>') + '</div></div>';
}

function leadRow(l) {
  return '<div class="li"><span class="avatar" style="width:36px;height:36px;font-size:12px;background:' + (l.hot ? '#E0682A' : '#C9A86A') + '">' + l.name.split(' ').map(function (w) { return w[0]; }).join('') + '</span>' +
    '<div class="grow"><b style="font-weight:600">' + esc(l.name) + '</b> <span class="pill ' + (l.hot ? 'hot' : 'warm') + '">' + (l.hot ? 'Hot' : 'Warm') + ' · ' + l.score + '</span><div class="small muted">' + esc(l.act) + ' · ' + esc(l.item.name) + ' · ' + esc(l.city) + ' · ' + ago(l.seen) + '</div></div>' +
    (l.offer ? '<span class="pill ok">' + ic('check', ' style="width:12px;height:12px"') + 'Offer sent</span>' : '<button class="btn sm brand" data-act="offer" data-lead="' + l.id + '">Send offer</button>') + '</div>';
}

function vLeads() {
  var st = store(), D = data(st.slug);
  head('Ready to buy', st.name + ' · shoppers who opted in to hear from you');
  var list = D.leads.filter(function (l) { return S.leadFilter === 'All' || (S.leadFilter === 'Hot' ? l.hot : !l.hot); });
  var hot = D.leads.filter(function (l) { return l.hot; }), val = hot.reduce(function (a, l) { return a + l.item.price; }, 0);
  return '<div class="grid g4" style="margin-bottom:16px">' +
    '<div class="card kpi"><div class="lbl">Hot shoppers</div><div class="val">' + hot.length + '</div><span class="d muted">placed it 3+ times or added to cart</span></div>' +
    '<div class="card kpi"><div class="lbl">Warm shoppers</div><div class="val">' + (D.leads.length - hot.length) + '</div><span class="d muted">looked more than once</span></div>' +
    '<div class="card kpi"><div class="lbl">Value waiting</div><div class="val">' + money(val) + '</div><span class="d muted">hot shoppers\' products</span></div>' +
    '<div class="card kpi"><div class="lbl">Offers sent</div><div class="val" id="offerCount">' + D.leads.filter(function (l) { return l.offer; }).length + '</div><span class="d muted">from your own store\'s email / WhatsApp</span></div></div>' +
    '<div class="card"><div class="ch"><h2>Shoppers you can contact</h2><div class="grow"></div><div class="chips">' + ['All', 'Hot', 'Warm'].map(function (c) { return '<button class="chip' + (S.leadFilter === c ? ' on' : '') + '" data-lf="' + c + '">' + c + '</button>'; }).join('') + '</div></div>' +
    '<div class="tblwrap"><table class="tbl"><thead><tr><th>Shopper</th><th>What they did</th><th class="hide-m">Product</th><th class="hide-m">Came from</th><th>Last seen</th><th class="r">Action</th></tr></thead><tbody>' +
    list.map(function (l) {
      return '<tr><td><div class="prod"><span class="avatar" style="width:34px;height:34px;font-size:12px;background:' + (l.hot ? '#E0682A' : '#C9A86A') + '">' + l.name.split(' ').map(function (w) { return w[0]; }).join('') + '</span><div><b>' + esc(l.name) + '</b><span>' + esc(l.city) + ' · via ' + l.via + '</span></div></div></td>' +
        '<td><span class="pill ' + (l.hot ? 'hot' : 'warm') + '">' + (l.hot ? 'Hot' : 'Warm') + ' · ' + l.score + '</span><div class="small" style="margin-top:4px">' + esc(l.act) + '</div></td>' +
        '<td class="hide-m"><div class="prod"><img class="thumb" src="' + img(st.slug, l.item.p) + '" alt=""><div><b>' + esc(l.item.name) + '</b><span>' + esc(l.item.p.p) + '</span></div></div></td><td class="hide-m small">' + esc(l.src) + '</td><td class="small num">' + ago(l.seen) + '</td>' +
        '<td class="r">' + (l.offer ? '<span class="pill ok">Offer sent · ' + esc(l.offer) + '</span>' : '<button class="btn sm brand" data-act="offer" data-lead="' + l.id + '">Send offer</button>') + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<div class="pad" style="border-top:1px solid var(--line2)"><div class="note">' + ic('info') + '<span>Only shoppers who ticked "Send me offers for this product" in AR appear by name. Everyone else is counted without a name, as the privacy law asks.</span></div></div></div>';
}

function vReports() {
  var st = store(), D = data(st.slug), n = S.range, cur = totals(D.items, n);
  head('Reports');
  var cats = {}; D.items.forEach(function (it) { var s = sum(it, n); var c = cats[it.cat] || (cats[it.cat] = { o: 0, orders: 0, rev: 0 }); c.o += s.o; c.orders += s.orders; c.rev += s.rev; });
  var cmx = Math.max.apply(null, Object.keys(cats).map(function (k) { return cats[k].o; }));
  var fun = [['Product page views', cur.views], ['Opened in a room', cur.o], ['Placed', cur.placed], ['Added to cart', cur.carts], ['Ordered', cur.orders]];
  var rows = D.items.slice().sort(function (a, b) { return sum(b, n).rev - sum(a, n).rev; });
  return '<div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:16px">' + rangeChips() + '<div style="display:flex;gap:8px"><button class="btn ghost" data-act="csv">' + ic('down') + 'Export CSV</button><button class="btn ghost" data-act="weekly">' + ic('mail') + 'Email me this weekly</button></div></div>' +
    '<div class="grid g2" style="margin-bottom:16px"><div class="card"><div class="ch"><h2>From visitor to buyer</h2><span class="sub">all products</span></div><div class="pad fun">' +
      fun.map(function (f, i) { return '<div class="st"><span class="small">' + f[0] + '</span><div class="b"><i style="width:' + Math.max(2, 100 * f[1] / fun[0][1]) + '%;opacity:' + (1 - i * 0.12) + '"></i></div><span class="num small" style="text-align:right"><b>' + fmt(f[1]) + '</b> ' + (i ? '· ' + p1(pct(f[1], fun[i - 1][1])) : '') + '</span></div>'; }).join('') + '</div></div>' +
    '<div class="card"><div class="ch"><h2>AR vs no AR</h2><span class="sub">how often a visitor buys</span></div><div class="pad">' +
      '<div style="display:flex;align-items:flex-end;gap:40px;height:170px;padding:0 20px">' +
        [['Did not use AR', 1.1, '#C9C1B6'], ['Used AR', pct(cur.orders, cur.o), '#1E7F4F']].map(function (b) { return '<div style="flex:1;text-align:center"><div class="h num" style="font-size:22px;font-weight:800">' + p1(b[1]) + '</div><div style="height:' + Math.min(130, b[1] * 26) + 'px;background:' + b[2] + ';border-radius:10px 10px 4px 4px;margin-top:6px"></div><div class="small muted" style="margin-top:8px">' + b[0] + '</div></div>'; }).join('') +
      '</div><div class="note" style="margin-top:14px">' + ic('bolt') + '<span>Shoppers who placed a product in their room bought <b>' + (pct(cur.orders, cur.o) / 1.1).toFixed(1) + '×</b> as often. That is ' + money(cur.rev - cur.rev / (pct(cur.orders, cur.o) / 1.1)) + ' extra sales in ' + n + ' days.</span></div></div></div></div>' +
    '<div class="grid g3" style="margin-bottom:16px"><div class="card"><div class="ch"><h2>By category</h2></div><div class="pad" style="display:grid;gap:14px">' +
      Object.keys(cats).map(function (k) { var c = cats[k]; return '<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>' + esc(k) + '</span><span class="num"><b>' + fmt(c.o) + '</b> opens · ' + money(c.rev) + '</span></div><div class="bar"><i style="width:' + 100 * c.o / cmx + '%"></i></div></div>'; }).join('') + '</div></div>' +
    '<div class="card span2"><div class="ch"><h2>When shoppers use AR</h2><span class="sub">darker = busier</span></div><div class="pad">' + heatHTML(D) + '</div></div></div>' +
    '<div class="card tblwrap"><div class="ch"><h2>Every product</h2><span class="sub">sorted by sales after AR</span></div><table class="tbl"><thead><tr><th>Product</th><th class="r">Room opens</th><th class="r hide-m">QR scans</th><th class="r hide-m">Carts</th><th class="r">Orders</th><th class="r">Sales</th></tr></thead><tbody>' +
      rows.map(function (it) { var s = sum(it, n); return '<tr class="click" data-go="#/product/' + it.slug + '"><td><div class="prod"><img class="thumb" src="' + img(st.slug, it.p) + '" alt="" loading="lazy"><div><b>' + esc(it.name) + '</b><span>' + esc(it.cat) + '</span></div></div></td><td class="r num">' + fmt(s.o) + '</td><td class="r num hide-m">' + fmt(s.qr) + '</td><td class="r num hide-m">' + fmt(s.carts) + '</td><td class="r num">' + fmt(s.orders) + '</td><td class="r num"><b>' + money(s.rev) + '</b></td></tr>'; }).join('') +
    '</tbody></table></div>';
}
function heatHTML(D) {
  var mx = 0; D.heat.forEach(function (r) { r.forEach(function (v) { mx = Math.max(mx, v); }); });
  var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], h = '<div class="heat"><span></span>';
  for (var k = 0; k < 24; k++) h += '<span style="text-align:center">' + (k % 3 === 0 ? (k === 0 ? '12a' : k < 12 ? k + 'a' : k === 12 ? '12p' : (k - 12) + 'p') : '') + '</span>';
  D.heat.forEach(function (r, i) { h += '<span>' + days[i] + '</span>' + r.map(function (v) { return '<i title="' + days[i] + ' ' + '" style="background:rgba(224,104,42,' + (0.06 + 0.94 * v / mx).toFixed(2) + ')"></i>'; }).join(''); });
  return h + '</div><div class="small muted" style="margin-top:10px">Busiest: weekday evenings 6–9 pm and weekend afternoons. Send offers just before then.</div>';
}

function vActivity() {
  var st = store(), D = data(st.slug);
  head('Live activity');
  var counts = {}; D.cities.forEach(function (c, i) { counts[c] = Math.round(240 / (i + 1.6) + 18); });
  var cmx = Math.max.apply(null, Object.keys(counts).map(function (k) { return counts[k]; }));
  return '<div class="grid g3"><div class="card span2"><div class="ch"><span class="livedot"></span><h2>What shoppers are doing now</h2><span class="sub">updates by itself</span></div><div class="feed" id="feed">' + feedHTML(14) + '</div></div>' +
    '<div style="display:grid;gap:16px;align-content:start"><div class="card"><div class="ch"><h2>Where they are</h2><span class="sub">last 30 days</span></div><div class="pad" style="display:grid;gap:12px">' +
      Object.keys(counts).map(function (c) { return '<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span>' + ic('pin', ' style="width:13px;height:13px;display:inline;vertical-align:-2px;margin-right:4px;color:#9A9187"') + esc(c) + '</span><b class="num">' + counts[c] + '</b></div><div class="bar"><i style="width:' + 100 * counts[c] / cmx + '%"></i></div></div>'; }).join('') + '</div></div>' +
    '<div class="card"><div class="ch"><h2>When they look</h2></div><div class="pad">' + heatHTML(D) + '</div></div></div></div>';
}

function vHealth() {
  var st = store(), D = data(st.slug);
  head('Model health', st.name + ' · every 3D model is checked before shoppers see it');
  var bad = D.items.filter(function (i) { return i.status === 'fix' || i.status === 'check'; }), good = D.items.length - bad.length;
  return '<div class="grid g4" style="margin-bottom:16px"><div class="card kpi"><div class="lbl">Live in AR</div><div class="val">' + good + '</div><span class="d up">passed the quality check</span></div>' +
    '<div class="card kpi"><div class="lbl">Premium close-ups</div><div class="val">' + D.items.filter(function (i) { return i.status === 'premium'; }).length + '</div><span class="d muted">real texture when shoppers lean in</span></div>' +
    '<div class="card kpi"><div class="lbl">Being checked</div><div class="val">' + D.items.filter(function (i) { return i.status === 'check'; }).length + '</div><span class="d muted">usually done in 24 h</span></div>' +
    '<div class="card kpi"><div class="lbl">Needs your help</div><div class="val" style="color:var(--bad)">' + D.items.filter(function (i) { return i.status === 'fix'; }).length + '</div><span class="d muted">better photos needed</span></div></div>' +
    '<div class="card"><div class="ch"><h2>To do</h2></div>' + (bad.length ? bad.map(function (it) {
      var fix = it.status === 'fix';
      return '<div class="li"><img class="thumb" src="' + img(st.slug, it.p) + '" alt=""><div class="grow"><b style="font-weight:600">' + esc(it.name) + '</b> ' + statusPill(it.status) + '<div class="small muted">' + (fix ? 'The photos were taken in low light, so the texture looks soft up close. Three close-ups in daylight fix it.' : 'New model received. Size, colour and texture are being checked against your photos.') + '</div></div>' +
        (fix ? '<button class="btn sm brand" data-act="upload">' + ic('down', ' style="transform:rotate(180deg)"') + 'Upload photos</button>' : '<span class="pill check">ETA 24 h</span>') + '</div>';
    }).join('') : '<div class="empty">All models are healthy.</div>') + '</div>' +
    '<div class="card" style="margin-top:16px"><div class="ch"><h2>What we check on every model</h2></div><div class="pad grid g4">' +
      [['Real size', 'Matches the size on your product page to the millimetre'], ['Colour', 'Checked against your photos in daylight'], ['Detail up close', 'Texture holds when a shopper leans in'], ['Loads fast', 'Opens in under 3 seconds on 4G']].map(function (c) { return '<div><span class="ico" style="background:#E4F4EB;color:#1E7F4F;margin-bottom:8px">' + ic('check') + '</span><b style="font-weight:600">' + c[0] + '</b><div class="small muted">' + c[1] + '</div></div>'; }).join('') + '</div></div>';
}

var CONN = { Shopify: true, WooCommerce: false, Klaviyo: true, 'WhatsApp Business': true, 'Google Analytics': false, 'Meta Pixel': false };
function vSettings() {
  var st = store();
  head('Settings');
  return '<div class="grid g2"><div class="card"><div class="ch"><h2>Connections</h2><span class="sub">orders, emails and offers</span></div>' +
    Object.keys(CONN).map(function (k) { return '<div class="li"><span class="ico" style="background:#F2EEE8;color:var(--ink2)">' + ic(k === 'Klaviyo' ? 'mail' : k === 'WhatsApp Business' ? 'msg' : k.indexOf('Google') === 0 || k.indexOf('Meta') === 0 ? 'chart' : 'cart') + '</span><div class="grow"><b style="font-weight:600">' + k + '</b><div class="small muted">' +
      ({ Shopify: 'Products, prices and real orders after AR', WooCommerce: 'Products and orders from WordPress stores', Klaviyo: 'Offers to opted-in shoppers go out from your flows', 'WhatsApp Business': 'The "Ask on WhatsApp" button in AR', 'Google Analytics': 'Send AR events to GA4', 'Meta Pixel': 'Retarget shoppers who used AR' })[k] + '</div></div><button class="toggle' + (CONN[k] ? ' on' : '') + '" data-conn="' + k + '" aria-label="' + k + '"></button></div>'; }).join('') + '</div>' +
    '<div style="display:grid;gap:16px;align-content:start"><div class="card"><div class="ch"><h2>Your AR button</h2></div><div class="pad" style="display:grid;gap:12px">' +
      '<div><label class="lab">Button text</label><input class="field" value="' + esc(st.cta || 'See it in your room') + '"></div><div><label class="lab">WhatsApp number shoppers can message from AR</label><input class="field" value="+61 4XX XXX XXX"></div>' +
      '<div style="display:flex;gap:10px;align-items:center"><button class="toggle on" data-t="1"></button><span>Ask shoppers if they want offers for this product</span></div>' +
      '<div style="display:flex;gap:10px;align-items:center"><button class="toggle on" data-t="1"></button><span>Lock products to their real size (no pinch to resize)</span></div></div></div>' +
    '<div class="card"><div class="ch"><h2>Plan</h2></div><div class="pad"><div style="display:flex;align-items:center;gap:12px"><div class="grow" style="flex:1"><b class="h" style="font-size:18px">Growth · yearly</b><div class="small muted">Up to 100 products in AR · unlimited QR codes · Sales Engine</div></div><a class="btn ghost" href="/#pricing">Change plan</a></div></div></div>' +
    '<div class="card"><div class="ch"><h2>Team</h2></div>' + [['Store owner', 'Owner'], ['Showroom manager', 'Can send offers'], ['Sales staff', 'Can view and print QR codes']].map(function (t) { return '<div class="li"><span class="avatar" style="width:32px;height:32px;font-size:12px">' + t[0][0] + '</span><div class="grow"><b style="font-weight:600">' + t[0] + '</b><div class="small muted">' + t[1] + '</div></div></div>'; }).join('') + '</div></div></div>';
}

/* ---------------------------------------------------------------- QR studio */
var QR_COL = ['#1D1A17', null, '#E0682A', '#2F5FA8', '#1E7F4F', '#6B3FA0'];
function vQR(slug) {
  var st = store(), D = data(st.slug);
  if (slug) S.qr.slug = slug;
  if (!S.qr.slug || !D.items.some(function (i) { return i.slug === S.qr.slug; })) S.qr.slug = D.items[0] && D.items[0].slug;
  if (!S.qr.color) S.qr.color = '#1D1A17';
  head('QR Studio', st.name + ' · a QR code for any product, ready to print or share');
  var list = D.items.filter(function (it) { return !S.q || it.name.toLowerCase().indexOf(S.q.toLowerCase()) >= 0; });
  var it = D.items.filter(function (i) { return i.slug === S.qr.slug; })[0];
  return '<div class="qrwrap">' +
    '<div class="card"><div class="ch"><h2>1. Pick a product</h2></div><div class="plist">' + list.map(function (p) {
      return '<button class="pick' + (p.slug === S.qr.slug ? ' on' : '') + '" data-pick="' + p.slug + '"><img class="thumb" src="' + img(st.slug, p.p) + '" alt="" loading="lazy"><span><b>' + esc(p.name) + '</b><span class="small muted">' + esc(p.p.p) + ' · ' + esc(p.cat) + '</span></span></button>'; }).join('') + '</div></div>' +
    '<div class="card"><div class="ch"><h2>2. Your QR code</h2><span class="sub">' + esc(it ? it.name : '') + '</span><div class="grow"></div><span class="pill ok">' + ic('check', ' style="width:12px;height:12px"') + 'Scans straight into AR</span></div><div class="stage"><canvas id="qrCanvas" width="1200" height="1600"></canvas></div></div>' +
    '<div class="card opts"><div class="ch"><h2>3. Style &amp; share</h2></div>' +
      '<div class="opt"><label class="lab">Layout</label><div class="seg">' + [['tag', 'Showroom tag'], ['card', 'Square card'], ['plain', 'QR only']].map(function (l) { return '<button data-ql="' + l[0] + '" class="' + (S.qr.layout === l[0] ? 'on' : '') + '">' + l[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="opt"><label class="lab">Colour</label><div class="swatches">' + QR_COL.map(function (c) { c = c || st.tone; return '<span class="sw' + (S.qr.color === c ? ' on' : '') + '" data-qc="' + c + '" style="background:' + c + '" title="' + (c === st.tone ? 'Store colour' : c) + '"></span>'; }).join('') + '</div></div>' +
      '<div class="opt"><label class="lab">Text under the code</label><input class="field" id="qrLabel" maxlength="40" value="' + esc(S.qr.label) + '">' +
        '<div style="display:flex;gap:10px;align-items:center;margin-top:12px"><button class="toggle' + (S.qr.price ? ' on' : '') + '" data-qt="price"></button><span class="small">Show price and size</span></div>' +
        '<div style="display:flex;gap:10px;align-items:center;margin-top:10px"><button class="toggle' + (S.qr.logo ? ' on' : '') + '" data-qt="logo"></button><span class="small">AR badge in the middle</span></div></div>' +
      '<div class="opt"><div class="actgrid">' +
        '<button class="btn brand" data-act="png">' + ic('down') + 'PNG</button><button class="btn ghost" data-act="svg">' + ic('down') + 'SVG</button>' +
        '<button class="btn ghost" data-act="share">' + ic('share') + 'Share</button><button class="btn ghost" data-act="print">' + ic('print') + 'Print</button>' +
        '<button class="btn ghost" data-act="copylink" data-slug="' + (it ? it.slug : '') + '">' + ic('link') + 'Copy link</button><button class="btn ghost" data-act="savelib">' + ic('save') + 'Save</button></div>' +
        '<a class="btn ghost" style="width:100%;margin-top:8px" target="_blank" href="' + (it ? arUrl(st.slug, it.slug) : '#') + '">' + ic('eye') + 'Test what shoppers see</a>' +
        '<div class="small muted" style="margin-top:10px;word-break:break-all">Link: ' + esc(it ? arUrl(st.slug, it.slug, true) : '') + '</div></div></div>' +
    '</div>' +
    '<div class="card" style="margin-top:16px"><div class="ch"><h2>Saved QR codes</h2><span class="sub" id="libCount"></span><div class="grow"></div><button class="btn sm ghost" data-act="bulkzip">' + ic('zip') + 'Download all products as ZIP</button></div><div id="lib"></div></div>';
}
function qrMatrix(text) { var q = qrcode(0, 'H'); q.addData(text); q.make(); return q; }
var IMG_CACHE = {};
function loadImg(src) { return IMG_CACHE[src] || (IMG_CACHE[src] = new Promise(function (ok) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; })); }
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function drawQR(c, q, x, y, size, col, logo) {
  var n = q.getModuleCount(), m = size / n;
  c.fillStyle = col;
  for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) {
    var finder = (r < 7 && k < 7) || (r < 7 && k >= n - 7) || (r >= n - 7 && k < 7);
    if (finder) continue;
    if (q.isDark(r, k)) c.fillRect(Math.floor(x + k * m), Math.floor(y + r * m), Math.ceil(m), Math.ceil(m));
  }
  [[0, 0], [0, n - 7], [n - 7, 0]].forEach(function (f) {               // rounded finder eyes
    var fx = x + f[1] * m, fy = y + f[0] * m;
    c.fillStyle = col; roundRect(c, fx, fy, 7 * m, 7 * m, m * 1.6); c.fill();
    c.fillStyle = '#fff'; roundRect(c, fx + m, fy + m, 5 * m, 5 * m, m * 1.1); c.fill();
    c.fillStyle = col; roundRect(c, fx + 2 * m, fy + 2 * m, 3 * m, 3 * m, m * 0.8); c.fill();
  });
  if (logo) {
    var b = size * 0.2, bx = x + size / 2 - b / 2, by = y + size / 2 - b / 2;
    c.fillStyle = '#fff'; roundRect(c, bx - m * 0.6, by - m * 0.6, b + m * 1.2, b + m * 1.2, b * 0.24); c.fill();
    c.fillStyle = col; roundRect(c, bx, by, b, b, b * 0.22); c.fill();
    c.fillStyle = '#fff'; c.font = '800 ' + Math.round(b * 0.42) + 'px Archivo, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('AR', bx + b / 2, by + b / 2 + b * 0.03);
  }
}
function wrapText(c, text, maxW) { var w = text.split(' '), lines = [], line = ''; w.forEach(function (x) { var t = line ? line + ' ' + x : x; if (c.measureText(t).width > maxW && line) { lines.push(line); line = x; } else line = t; }); if (line) lines.push(line); return lines; }
function renderTag(canvas, st, it, o) {
  var url = arUrl(st.slug, it.slug, true), q = qrMatrix(url), c = canvas.getContext('2d');
  var col = o.color, tone = st.tone;
  return Promise.all([loadImg(img(st.slug, it.p)), document.fonts ? document.fonts.ready : null]).then(function (res) {
    var pic = res[0];
    if (o.layout === 'plain') {
      canvas.width = 1000; canvas.height = 1120; c.fillStyle = '#fff'; c.fillRect(0, 0, 1000, 1120);
      drawQR(c, q, 90, 70, 820, col, o.logo);
      c.fillStyle = col; c.font = '700 44px Archivo, Arial'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(o.label, 500, 1010);
      c.fillStyle = '#8A8178'; c.font = '500 26px Inter, Arial'; c.fillText(it.name, 500, 1058); return;
    }
    if (o.layout === 'card') {
      canvas.width = 1200; canvas.height = 1200; c.fillStyle = '#FBF8F3'; c.fillRect(0, 0, 1200, 1200);
      c.fillStyle = '#fff'; roundRect(c, 40, 40, 1120, 1120, 48); c.fill(); c.strokeStyle = '#E7E2DA'; c.lineWidth = 3; c.stroke();
      if (pic) { var s = Math.min(460 / pic.width, 420 / pic.height); c.drawImage(pic, 90 + (480 - pic.width * s) / 2, 120 + (440 - pic.height * s) / 2, pic.width * s, pic.height * s); }
      c.fillStyle = tone; c.font = '700 26px Inter, Arial'; c.textAlign = 'left'; c.fillText(st.name.toUpperCase(), 90, 640);
      c.fillStyle = '#1D1A17'; c.font = '800 54px Archivo, Arial'; wrapText(c, it.name, 470).slice(0, 3).forEach(function (l, i) { c.fillText(l, 90, 710 + i * 62); });
      if (o.price) { c.fillStyle = '#4A443D'; c.font = '600 34px Inter, Arial'; c.fillText(it.p.p + '  ·  ' + it.size, 90, 960); }
      drawQR(c, q, 610, 150, 500, col, o.logo);
      c.fillStyle = col; c.font = '700 32px Archivo, Arial'; c.textAlign = 'center'; wrapText(c, o.label, 480).forEach(function (l, i) { c.fillText(l, 860, 720 + i * 40); });
      c.fillStyle = '#8A8178'; c.font = '500 24px Inter, Arial'; c.fillText('No app needed · real size', 860, 810);
      c.textAlign = 'left'; c.fillStyle = '#8A8178'; c.font = '500 24px Inter, Arial'; c.fillText('Powered by', 90, 1080); c.fillStyle = '#1D1A17'; c.font = '800 30px Archivo, Arial'; c.fillText('ARQR', 222, 1081); c.fillStyle = '#E0682A'; c.fillText('360', 222 + c.measureText('ARQR').width, 1081);
      return;
    }
    canvas.width = 1200; canvas.height = 1600; c.fillStyle = '#FBF8F3'; c.fillRect(0, 0, 1200, 1600);
    c.fillStyle = '#fff'; roundRect(c, 40, 40, 1120, 1520, 48); c.fill(); c.strokeStyle = '#E7E2DA'; c.lineWidth = 3; c.stroke();
    c.fillStyle = tone; roundRect(c, 40, 40, 1120, 110, 48); c.fill(); c.fillRect(40, 100, 1120, 50);
    c.fillStyle = '#fff'; c.font = '800 40px Archivo, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(st.name, 600, 98);
    c.textBaseline = 'alphabetic';
    if (pic) { var sc = Math.min(560 / pic.width, 330 / pic.height); c.drawImage(pic, 600 - pic.width * sc / 2, 190 + (340 - pic.height * sc) / 2, pic.width * sc, pic.height * sc); }
    c.fillStyle = '#1D1A17'; c.font = '800 52px Archivo, Arial'; var ln = wrapText(c, it.name, 980).slice(0, 2); ln.forEach(function (l, i) { c.fillText(l, 600, 600 + i * 60); });
    var yb = 600 + ln.length * 60;
    if (o.price) { c.fillStyle = '#4A443D'; c.font = '600 34px Inter, Arial'; c.fillText(it.p.p + '  ·  ' + it.size, 600, yb + 6); }
    drawQR(c, q, 330, yb + 50, 540, col, o.logo);
    c.fillStyle = col; c.font = '800 42px Archivo, Arial'; c.fillText(o.label, 600, yb + 660);
    c.fillStyle = '#8A8178'; c.font = '500 28px Inter, Arial'; c.fillText('Point your phone camera at the code · no app needed', 600, yb + 708);
    c.strokeStyle = '#EFEAE1'; c.lineWidth = 2; c.beginPath(); c.moveTo(120, 1470); c.lineTo(1080, 1470); c.stroke();
    c.fillStyle = '#8A8178'; c.font = '500 26px Inter, Arial'; var pw = c.measureText('Powered by ').width; c.font = '800 30px Archivo, Arial'; var aw = c.measureText('ARQR360').width, x0 = 600 - (pw + aw) / 2;
    c.textAlign = 'left'; c.font = '500 26px Inter, Arial'; c.fillText('Powered by ', x0, 1520); c.font = '800 30px Archivo, Arial'; c.fillStyle = '#1D1A17'; c.fillText('ARQR', x0 + pw, 1521); c.fillStyle = '#E0682A'; c.fillText('360', x0 + pw + c.measureText('ARQR').width, 1521);
  });
}
function currentItem() { var D = data(S.store); return D.items.filter(function (i) { return i.slug === S.qr.slug; })[0]; }
function redrawQR() { var cv = $('#qrCanvas'), it = currentItem(); if (cv && it) renderTag(cv, store(), it, S.qr); }
function canvasBlob(cv) { return new Promise(function (ok) { cv.toBlob(ok, 'image/png'); }); }
function fileName(it, ext) { return store().slug + '-' + it.slug + '-qr.' + ext; }
function download(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
function qrSVG(it) {
  var q = qrMatrix(arUrl(S.store, it.slug, true)), n = q.getModuleCount(), quiet = 4, d = '';
  for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) if (q.isDark(r, k)) d += 'M' + (k + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
  var N = n + 2 * quiet;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + N + ' ' + N + '" width="1000" height="1000" shape-rendering="crispEdges"><title>' + esc(it.name) + ' · AR</title><rect width="100%" height="100%" fill="#fff"/><path fill="' + S.qr.color + '" d="' + d + '"/></svg>';
}
var LIBKEY = 'arqr.se.lib';
function lib() { try { return JSON.parse(localStorage.getItem(LIBKEY) || '[]'); } catch (e) { return []; } }
function setLib(a) { try { localStorage.setItem(LIBKEY, JSON.stringify(a)); return true; } catch (e) { toast('Your browser is full: delete a saved code first'); return false; } }
function renderLib() {
  var el = $('#lib'); if (!el) return;
  var all = lib().filter(function (x) { return x.store === S.store; });
  $('#libCount').textContent = all.length ? all.length + ' saved in this browser' : '';
  el.innerHTML = all.length ? '<div class="lib">' + all.map(function (x) {
    return '<div class="libitem"><img src="' + x.thumb + '" alt=""><div><b style="font-weight:600;font-size:13px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(x.name) + '</b><span class="small muted">' + esc(x.layoutName) + ' · ' + new Date(x.at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) + ' · ' + x.scans + ' scans</span></div>' +
      '<div style="display:flex;gap:6px"><button class="btn sm ghost" style="flex:1" data-act="libopen" data-id="' + x.id + '">Open</button><button class="iconbtn" title="Delete" data-act="libdel" data-id="' + x.id + '">' + ic('trash') + '</button></div></div>';
  }).join('') + '</div>' : '<div class="empty">Nothing saved yet. Press <b>Save</b> on a code to keep it here with its settings.</div>';
}

/* ---------------------------------------------------------------- modal: send offer */
function offerModal(id) {
  var D = data(S.store), l = D.leads.filter(function (x) { return x.id === id; })[0]; if (!l) return;
  $('#dlg').innerHTML = '<div class="ch"><h2>Send an offer to ' + esc(l.name.split(' ')[0]) + '</h2><div class="grow"></div><button class="iconbtn" data-act="close" aria-label="Close">✕</button></div><div class="pad" style="display:grid;gap:14px">' +
    '<div class="li" style="padding:0;border:0"><img class="thumb lg" style="width:64px;height:64px" src="' + img(S.store, l.item.p) + '" alt=""><div class="grow"><b>' + esc(l.item.name) + '</b><div class="small muted">' + esc(l.item.p.p) + ' · ' + esc(l.act) + '</div></div></div>' +
    '<div><label class="lab">Offer</label><div class="seg" id="offSeg">' + ['5% off', '10% off', 'Free delivery', 'Custom'].map(function (o, i) { return '<button data-off="' + o + '" class="' + (i === 1 ? 'on' : '') + '">' + o + '</button>'; }).join('') + '</div></div>' +
    '<div><label class="lab">Send by</label><div class="seg" id="viaSeg">' + ['WhatsApp', 'Email'].map(function (o) { return '<button data-via="' + o + '" class="' + (l.via === o ? 'on' : '') + '">' + o + '</button>'; }).join('') + '</div></div>' +
    '<div><label class="lab">Message</label><textarea class="field" id="offMsg" rows="5">Hi ' + esc(l.name.split(' ')[0]) + ', thanks for trying the ' + esc(l.item.name) + ' in your room! Here is 10% off it this week with code ROOM10. Any questions, just reply here. ' + esc(store().name) + '</textarea></div>' +
    '<div class="note">' + ic('info') + '<span>Goes out from your own store\'s WhatsApp or email (Klaviyo / Shopify Email), never from ARQR360. In this demo nothing is sent.</span></div>' +
    '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost" data-act="close">Cancel</button><button class="btn brand" data-act="sendoffer" data-lead="' + l.id + '">' + ic('msg') + 'Send offer</button></div></div>';
  $('#modal').classList.add('open');
}

/* ---------------------------------------------------------------- router */
function route() {
  var h = (location.hash || '#/overview').slice(2).split('/'); S.view = h[0] || 'overview'; S.arg = h[1] ? decodeURIComponent(h[1]) : null;
  if (S.view === 'qr' && S.arg) S.qr.slug = S.arg;
  render();
}
function render() {
  if (!PRODUCTS[S.store]) return;
  shell();
  var v = { overview: vOverview, products: vProducts, product: function () { return vProduct(S.arg); }, qr: function () { return vQR(S.arg); }, leads: vLeads,
            reports: vReports, activity: vActivity, health: vHealth, settings: vSettings }[S.view] || vOverview;
  $('#view').innerHTML = v();
  if ($('#areachart')) wireChart(S.view === 'product' ? series(data(S.store).items.filter(function (i) { return i.slug === S.arg; }), S.range) : series(data(S.store).items, S.range));
  if (S.view === 'qr') { redrawQR(); renderLib(); }
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route);

document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-store],[data-range],[data-cat],[data-layout],[data-go],[data-pick],[data-ql],[data-qc],[data-qt],[data-act],[data-lf],[data-conn],[data-t],[data-off],[data-via]');
  if (!e.target.closest('.storepick')) $('#storeMenu').classList.remove('open');
  if (e.target.closest('#storeBtn')) { $('#storeMenu').classList.toggle('open'); return; }
  if (!t) return;
  var d = t.dataset;
  if (d.store) { S.store = d.store; S.cat = 'All'; S.status = 'All'; S.qr.slug = null; S.qr.color = null; save(); $('#storeMenu').classList.remove('open'); if (S.view === 'product') location.hash = '#/products'; else render(); return; }
  if (d.range) { S.range = +d.range; save(); render(); return; }
  if (d.cat) { S.cat = d.cat; render(); return; }
  if (d.layout) { S.layout = d.layout; save(); render(); return; }
  if (d.lf) { S.leadFilter = d.lf; render(); return; }
  if (d.go) { location.hash = d.go; return; }
  if (d.pick) { location.hash = '#/qr/' + d.pick; return; }
  if (d.ql) { S.qr.layout = d.ql; t.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === t); }); redrawQR(); return; }
  if (d.qc) { S.qr.color = d.qc; document.querySelectorAll('[data-qc]').forEach(function (b) { b.classList.toggle('on', b === t); }); redrawQR(); return; }
  if (d.qt) { S.qr[d.qt] = !S.qr[d.qt]; t.classList.toggle('on', S.qr[d.qt]); redrawQR(); return; }
  if (d.conn) { CONN[d.conn] = !CONN[d.conn]; t.classList.toggle('on', CONN[d.conn]); toast(d.conn + (CONN[d.conn] ? ' connected (demo)' : ' disconnected (demo)')); return; }
  if (d.t) { t.classList.toggle('on'); toast('Saved (demo)'); return; }
  if (d.off || d.via) { t.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === t); }); if (d.off) { var m = $('#offMsg'); m.value = m.value.replace(/Here is .*? this week( with code \w+)?\.|Here is free delivery on it this week\./, d.off === 'Free delivery' ? 'Here is free delivery on it this week.' : d.off === 'Custom' ? 'Here is [your offer] this week.' : 'Here is ' + d.off + ' it this week with code ROOM' + parseInt(d.off) + '.'); } return; }
  act(d.act, t, e);
});
function act(a, t) {
  var it = currentItem(), st = store();
  if (a === 'close') { $('#modal').classList.remove('open'); return; }
  if (a === 'offer') { offerModal(t.dataset.lead); return; }
  if (a === 'sendoffer') { var l = data(S.store).leads.filter(function (x) { return x.id === t.dataset.lead; })[0]; var o = $('#offSeg .on'); l.offer = o ? o.dataset.off : 'offer'; $('#modal').classList.remove('open'); toast('Offer sent to ' + l.name.split(' ')[0] + ' (demo, nothing was sent)'); render(); return; }
  if (a === 'copylink') { var u = arUrl(st.slug, t.dataset.slug || (it && it.slug), true); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { toast('AR link copied'); }, function () { prompt('Copy this link', u); }); return; }
  if (a === 'png' && it) { canvasBlob($('#qrCanvas')).then(function (b) { download(b, fileName(it, 'png')); toast('QR code downloaded'); }); return; }
  if (a === 'svg' && it) { download(new Blob([qrSVG(it)], { type: 'image/svg+xml' }), fileName(it, 'svg')); toast('Vector QR code downloaded (for printers)'); return; }
  if (a === 'share' && it) {
    var url = arUrl(st.slug, it.slug, true);
    canvasBlob($('#qrCanvas')).then(function (b) {
      var f = new File([b], fileName(it, 'png'), { type: 'image/png' }), data_ = { title: it.name + ' in AR', text: 'See the ' + it.name + ' in your room: ' + url, files: [f] };
      if (navigator.canShare && navigator.canShare(data_)) return navigator.share(data_).catch(function () {});
      if (navigator.share) return navigator.share({ title: data_.title, text: data_.text, url: url }).catch(function () {});
      shareModal(it, url);
    });
    return;
  }
  if (a === 'print' && it) {
    var w = window.open('', '_blank'); var src = $('#qrCanvas').toDataURL('image/png');
    w.document.write('<!doctype html><title>Print · ' + esc(it.name) + '</title><style>@page{margin:12mm}body{margin:0;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:96vh}</style><img src="' + src + '" onload="setTimeout(function(){print()},250)">'); w.document.close(); return;
  }
  if (a === 'savelib' && it) {
    var cv = $('#qrCanvas'), sm = document.createElement('canvas'), sc = 360 / Math.max(cv.width, cv.height); sm.width = cv.width * sc; sm.height = cv.height * sc; sm.getContext('2d').drawImage(cv, 0, 0, sm.width, sm.height);
    var all = lib(); all.unshift({ id: 'q' + Date.now(), store: st.slug, slug: it.slug, name: it.name, layout: S.qr.layout, layoutName: { tag: 'Showroom tag', card: 'Square card', plain: 'QR only' }[S.qr.layout], color: S.qr.color, label: S.qr.label, price: S.qr.price, logo: S.qr.logo, at: Date.now(), scans: 0, thumb: sm.toDataURL('image/jpeg', 0.82) });
    if (setLib(all.slice(0, 40))) { renderLib(); toast('Saved to your QR codes'); }
    return;
  }
  if (a === 'libopen') { var x = lib().filter(function (y) { return y.id === t.dataset.id; })[0]; if (!x) return; S.qr.layout = x.layout; S.qr.color = x.color; S.qr.label = x.label; S.qr.price = x.price; S.qr.logo = x.logo; location.hash = '#/qr/' + x.slug; if (S.arg === x.slug) render(); return; }
  if (a === 'libdel') { setLib(lib().filter(function (y) { return y.id !== t.dataset.id; })); renderLib(); toast('Deleted'); return; }
  if (a === 'bulkzip') { bulkZip(t); return; }
  if (a === 'csv') { csv(); return; }
  if (a === 'weekly') { toast('Every Monday 8 am, this report goes to your inbox (demo)'); return; }
  if (a === 'upload') { toast('Opens the photo uploader: 3 close-ups in daylight (demo)'); return; }
}
function shareModal(it, url) {
  var enc = encodeURIComponent, txt = enc('See the ' + it.name + ' in your room: ' + url);
  $('#dlg').innerHTML = '<div class="ch"><h2>Share ' + esc(it.name) + '</h2><div class="grow"></div><button class="iconbtn" data-act="close" aria-label="Close">✕</button></div><div class="pad" style="display:grid;gap:10px">' +
    '<a class="btn ghost" target="_blank" href="https://wa.me/?text=' + txt + '">' + ic('msg') + 'WhatsApp</a>' +
    '<a class="btn ghost" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=' + enc(url) + '">' + ic('share') + 'Facebook</a>' +
    '<a class="btn ghost" href="mailto:?subject=' + enc(it.name + ' in AR') + '&body=' + txt + '">' + ic('mail') + 'Email</a>' +
    '<button class="btn brand" data-act="copylink" data-slug="' + it.slug + '">' + ic('link') + 'Copy link</button>' +
    '<div class="small muted">Tip: on a phone, Share also lets you send the QR picture itself to Instagram, Messages or AirDrop.</div></div>';
  $('#modal').classList.add('open');
}
function bulkZip(btn) {
  if (!window.JSZip) { toast('ZIP tool did not load. Check your connection.'); return; }
  var st = store(), D = data(st.slug), z = new JSZip(), cv = document.createElement('canvas'), o = Object.assign({}, S.qr, { color: S.qr.color || '#1D1A17' }), i = 0;
  btn.disabled = true; var lbl = btn.innerHTML;
  (function next() {
    if (i >= D.items.length) {
      z.generateAsync({ type: 'blob' }).then(function (b) { download(b, st.slug + '-qr-codes.zip'); btn.disabled = false; btn.innerHTML = lbl; toast(D.items.length + ' QR codes downloaded'); });
      return;
    }
    var it = D.items[i++]; btn.textContent = 'Making ' + i + ' of ' + D.items.length + '…';
    renderTag(cv, st, it, o).then(function () { return canvasBlob(cv); }).then(function (b) { z.file(st.slug + '-' + it.slug + '-qr.png', b); next(); });
  })();
}
function csv() {
  var st = store(), D = data(st.slug), n = S.range, rows = [['Product', 'Category', 'Price', 'Room opens', 'QR scans', 'Placed', 'Added to cart', 'Orders', 'Sales', 'AR link']];
  D.items.forEach(function (it) { var s = sum(it, n); rows.push([it.name, it.cat, it.price, s.o, s.qr, s.placed, s.carts, s.orders, Math.round(s.rev), arUrl(st.slug, it.slug, true)]); });
  var txt = rows.map(function (r) { return r.map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n');
  download(new Blob([txt], { type: 'text/csv' }), st.slug + '-ar-report-' + n + 'd.csv'); toast('Report downloaded (sample data)');
}
document.addEventListener('input', function (e) {
  if (e.target.id === 'qrLabel') { S.qr.label = e.target.value || 'Scan to see it in your room'; redrawQR(); }
  if (e.target.id === 'q') { S.q = e.target.value; if (S.view !== 'products' && S.view !== 'qr') { location.hash = '#/products'; } else { var pos = e.target.selectionStart; render(); var q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); } }
});
document.addEventListener('change', function (e) { if (e.target.id === 'statusSel') { S.status = e.target.value; render(); } });
$('#modal').addEventListener('click', function (e) { if (e.target.id === 'modal') $('#modal').classList.remove('open'); });
addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#modal').classList.remove('open'); });

fetch('/shop-products.json').then(function (r) { return r.json(); }).then(function (j) {
  PRODUCTS = j; if (!PRODUCTS[S.store]) S.store = 'novara'; route();
}).catch(function () { $('#view').innerHTML = '<div class="card empty">Could not load the catalogue. Refresh the page.</div>'; });
})();
