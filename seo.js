/* ------------------------------------------------------------------
   Everything a search engine or an AI assistant reads about this site,
   written from one place.

   The domain is the first line of the config below and appears nowhere
   else. Canonicals, Open Graph, the sitemap, robots.txt and every
   schema block are generated from it, so moving to a real domain is one
   edit here and one run of `npm run seo`.

   The FAQ is the part worth understanding. Google only honours FAQPage
   markup when the same questions and answers are visible on the page —
   marking up questions a visitor cannot see is against their guidelines
   and can cost you the rich result altogether. So the questions live
   here once, and this writes them into both the visible section and the
   JSON-LD. They cannot drift apart.

   Run:  npm run seo
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');

/* ---------------------------------------------------------------- config */
const SITE = {
  /* the one line to change when the real domain lands */
  origin: 'https://arqr360.com',
  name: 'ARQR',
  tagline: 'Your showroom, in their room',
  blurb: 'ARQR turns your products into an AR catalogue. One QR code and your ' +
         'customers see every piece at true size in their own room. No app to download.',
  /* These are real now. sameAs is how a search engine ties the site and
     the profiles into one entity rather than four strangers, so it is
     worth keeping in step with the footer. The Instagram link is the
     plain profile, not the share URL: that one carries a session token. */
  sameAs: [
    'https://www.instagram.com/arqr360',
    'https://x.com/arqr360',
    'https://www.linkedin.com/company/arqr360/'
  ]
};

const FAQ = [
  ['What is ARQR?',
   'ARQR360 builds true-to-size AR (Augmented Reality) views from your product photographs, so your customers can place each product in their own ' +
   'room at true size, through one QR code or one link. There is no app to download. It opens ' +
   'in the phone’s own camera on both iPhone and Android.'],

  ['How much does an AR catalogue cost?',
   'You pay once to have the catalogue built, then a monthly fee keeps it live. At founder pricing ' +
   'that is $249 for 10 products and then $29 a month, $549 for 25 and then $59 a month, or $999 ' +
   'for 50 and then $99 a month. Extra products are $20 each. Above 50 products, or for multiple ' +
   'stores and categories, we quote for the range.'],

  ['Do my customers need to install an app?',
   'No. The catalogue opens in the browser, and the AR view uses what is already built into the ' +
   'phone: Quick Look on iPhone and Scene Viewer on Android. Your customer scans the code or ' +
   'taps a link and the product appears in the room in front of them.'],

  ['How long does it take to get my catalogue?',
   'About seven days from your photographs arriving. Send your best-selling products first. Every product ' +
   'is built to its real measurements, so a three-metre sofa arrives as a three-metre sofa and the ' +
   'customer can see whether it fits.'],

  ['What do you need from me to start?',
   'Photographs of each product and its real dimensions. If you already have 3D files we can use ' +
   'those instead. We do the modelling, the hosting and the QR code, and orders come to you on ' +
   'WhatsApp or through your own site.']
];

/* name, products, one-time setup at founder pricing, then monthly */
const PLANS = [
  ['Starter',  10, 249, 29],
  ['Studio',   25, 549, 59],
  ['Showroom', 50, 999, 99]
];

const PAGES = [
  { file: 'index.html',   path: '/',        image: '/assets/og-home.jpg',
    title: 'ARQR | Your showroom, in their room',
    desc: SITE.blurb, schema: true, faq: true, priority: '1.0' },
  { file: 'catalogue.html', path: '/catalogue', image: '/assets/og-catalog.jpg',
    title: 'Sample AR catalogues: furniture, footwear, decor and rugs | ARQR360',
    desc: 'Four sample catalogues you can open on your phone. Every product at true size in your own room.',
    priority: '0.9' },
  { file: 'store.html',   path: '/store',   image: '/assets/og-catalog.jpg',
    title: 'AR catalogue', desc: null, perShop: true, priority: '0.7', noSitemap: true },

  { file: 'start.html',   path: '/start',   image: '/assets/og-home.jpg',
    title: 'What we need from you | ARQR360',
    desc: 'What happens after you order, exactly what to send us, and what makes a photograph we cannot use.',
    priority: '0.6' },

  /* The legal three. Low priority because nobody searches for them, but in
     the sitemap on purpose: a payment provider's reviewer and a business
     verification both go looking for these, and a page a crawler has never
     seen is a page they can decide is not really there. */
  { file: 'terms.html',   path: '/terms',   image: '/assets/og-home.jpg',
    title: 'Terms of Service | ARQR360',
    desc: 'The agreement between you and ARQR360 when we build and host an AR catalogue for your shop.',
    priority: '0.3' },
  { file: 'privacy.html', path: '/privacy', image: '/assets/og-home.jpg',
    title: 'Privacy Policy | ARQR360',
    desc: 'What this website collects, what it does not, and who else can see anything.',
    priority: '0.3' },
  { file: 'refund.html',  path: '/refund',  image: '/assets/og-home.jpg',
    title: 'Refund Policy | ARQR360',
    desc: 'When you get your money back, and when you do not. Written plainly.',
    priority: '0.3' }
];

const SHOPS = ['novara', 'corso', 'maison', 'terra'];

/* ---------------------------------------------------------------- helpers */
const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const START = '  <!-- seo:start | generated by seo.js, do not edit by hand -->';
const END   = '  <!-- seo:end -->';

/* A share card that changes its picture but not its address goes on
   being the old picture: every platform that shows a preview caches it,
   and several of them never come back on their own. So the address
   carries eight characters of the file's own hash. The content decides
   it, not the clock, so rebuilding an unchanged card leaves every URL in
   the repo exactly as it was. */
function stamp(file){
  const path = file.replace(/^[/]/, '');
  if (!fs.existsSync(path)) return '';
  return '?v=' + require('crypto').createHash('sha256')
    .update(fs.readFileSync(path)).digest('hex').slice(0, 8);
}

function headBlock(page){
  const url = SITE.origin + page.path;
  const img = SITE.origin + page.image + stamp(page.image);
  const desc = page.desc || 'An AR catalogue. Every product at true size, in your own space.';
  const L = [];

  L.push(START);
  L.push('  <link rel="canonical" href="' + url + '">');
  L.push('');
  L.push('  <meta property="og:type" content="website">');
  L.push('  <meta property="og:site_name" content="' + esc(SITE.name) + '">');
  L.push('  <meta property="og:title" content="' + esc(page.title) + '">');
  L.push('  <meta property="og:description" content="' + esc(desc) + '">');
  L.push('  <meta property="og:url" content="' + url + '">');
  L.push('  <meta property="og:image" content="' + img + '">');
  L.push('  <meta property="og:image:width" content="1200">');
  L.push('  <meta property="og:image:height" content="630">');
  L.push('  <meta property="og:locale" content="en">');
  L.push('');
  L.push('  <meta name="twitter:card" content="summary_large_image">');
  L.push('  <meta name="twitter:title" content="' + esc(page.title) + '">');
  L.push('  <meta name="twitter:description" content="' + esc(desc) + '">');
  L.push('  <meta name="twitter:image" content="' + img + '">');
  L.push('');
  L.push('  <link rel="icon" href="/favicon.png" type="image/png" sizes="192x192">');
  L.push('  <link rel="icon" href="/favicon.ico" sizes="32x32">');
  L.push('  <link rel="apple-touch-icon" href="/apple-touch-icon.png">');
  L.push('  <meta name="theme-color" content="#E0682A">');

  if (page.schema){
    const org = {
      '@context': 'https://schema.org', '@type': 'Organization',
      name: SITE.name, url: SITE.origin + '/',
      /* the lockup on paper rather than the transparent one the page
         loads: this is shown on backgrounds we do not choose */
      logo: SITE.origin + '/assets/logo-mark.png' + stamp('/assets/logo-mark.png'),
      description: SITE.blurb
    };
    if (SITE.sameAs.length) org.sameAs = SITE.sameAs;

    const site = {
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: SITE.name, url: SITE.origin + '/', inLanguage: 'en'
      /* no SearchAction: there is no site search, and claiming one that
         does not exist is the kind of thing that gets markup ignored */
    };

    const service = {
      '@context': 'https://schema.org', '@type': 'Service',
      name: 'AR product catalogue', provider: { '@type': 'Organization', name: SITE.name },
      description: SITE.blurb,
      /* two prices, and the markup says which is which. The setup fee is
         the Offer's price because it is what is paid to start; the monthly
         rides alongside it as its own specification rather than being
         averaged into one misleading number. */
      offers: PLANS.map(([name, count, setup, monthly]) => ({
        '@type': 'Offer', name: name,
        description: count + ' AR products, built for you',
        price: String(setup), priceCurrency: 'USD',
        priceSpecification: [
          {
            '@type': 'UnitPriceSpecification',
            name: 'One-time setup', price: String(setup), priceCurrency: 'USD'
          },
          {
            '@type': 'UnitPriceSpecification',
            name: 'Monthly platform fee', price: String(monthly), priceCurrency: 'USD',
            billingDuration: 1, billingIncrement: 1, unitCode: 'MON'
          }
        ]
      }))
    };

    L.push('');
    [org, site, service].forEach(o => {
      L.push('  <script type="application/ld+json">');
      L.push('  ' + JSON.stringify(o, null, 2).split('\n').join('\n  '));
      L.push('  </script>');
    });

    if (page.faq){
      const faq = {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: FAQ.map(([q, a]) => ({
          '@type': 'Question', name: q,
          acceptedAnswer: { '@type': 'Answer', text: a }
        }))
      };
      L.push('  <script type="application/ld+json">');
      L.push('  ' + JSON.stringify(faq, null, 2).split('\n').join('\n  '));
      L.push('  </script>');
    }
  }

  L.push(END);
  return L.join('\n');
}

/* the four shop routes are one file, so their canonical has to be set
   where the shop is known — which is in the page, at run time */
const SHOP_SCRIPT = `<script>
/* /novara, /corso, /maison and /terra are all this one file, so the
   canonical and the share tags cannot be static — they are written here
   once the shop is known. Search engines run this; it is the same
   rendering pass that already sets the title. */
(function (){
  var s = (window.ARQR_STORES || []).filter(function (x){
    var p = location.pathname.replace(/\\/+$/, '').split('/').pop().replace(/\\.html$/, '');
    return x.slug === (new URLSearchParams(location.search).get('s') ||
                       (location.hash || '').replace('#', '') || p);
  })[0];
  if (!s) return;
  var url = '${SITE.origin}/' + s.slug;
  var set = function (sel, attr, val){
    var el = document.head.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  };
  set('link[rel="canonical"]', 'href', url);
  set('meta[property="og:url"]', 'content', url);
  set('meta[property="og:title"]', 'content', s.name + ' | AR catalogue');
  set('meta[name="twitter:title"]', 'content', s.name + ' | AR catalogue');
})();
</script>`;

/* ---------------------------------------------------------------- write */
let changed = 0;

PAGES.forEach(page => {
  let s = fs.readFileSync(page.file, 'utf8');
  const block = headBlock(page);

  if (s.indexOf(START) > -1){
    s = s.slice(0, s.indexOf(START)) + block + s.slice(s.indexOf(END) + END.length);
  } else {
    const at = s.indexOf('</head>');
    if (at < 0) throw new Error('no </head> in ' + page.file);
    s = s.slice(0, at) + block + '\n' + s.slice(at);
  }

  if (page.perShop && s.indexOf('/novara, /corso, /maison and /terra are all this one file') < 0){
    const at = s.lastIndexOf('</body>');
    s = s.slice(0, at) + SHOP_SCRIPT + '\n' + s.slice(at);
  }

  fs.writeFileSync(page.file, s, 'utf8');
  changed++;
  console.log('  ' + page.file.padEnd(14) + 'canonical ' + SITE.origin + page.path);
});

/* ---- the visible FAQ, from the same source as the markup ---- */
{
  let s = fs.readFileSync('index.html', 'utf8');
  const a = '<!-- faq:start -->', b = '<!-- faq:end -->';
  if (s.indexOf(a) > -1){
    const html = FAQ.map(([q, ans]) =>
      '        <details class="qa rev">\n' +
      '          <summary><span>' + esc(q) + '</span>' +
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9.5 12 15.5 18 9.5" ' +
      'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</summary>\n' +
      '          <p>' + esc(ans) + '</p>\n' +
      '        </details>').join('\n');
    s = s.slice(0, s.indexOf(a) + a.length) + '\n' + html + '\n      ' + s.slice(s.indexOf(b));
    fs.writeFileSync('index.html', s, 'utf8');
    console.log('  index.html    ' + FAQ.length + ' questions written to the page and to the FAQ schema');
  } else {
    console.log('  ! no faq:start marker in index.html, schema written, section not');
  }
}

/* ---- robots.txt ---- */
fs.writeFileSync('robots.txt',
  'User-agent: *\n' +
  'Allow: /\n' +
  '\n' +
  '# the models are large and there is nothing to index inside them\n' +
  'Disallow: /assets/shops/\n' +
  '\n' +
  '# ARQR Studio: the admin page, and the model test pages for checking on a phone\n' +
  'Disallow: /test/\n' +
  'Disallow: /admin\n' +
  '# product samples made for a client, reached from their QR card\n' +
  'Disallow: /sample/\n' +
  '\n' +
  'Sitemap: ' + SITE.origin + '/sitemap.xml\n' +
  // the blog is served from Marketing Genie and keeps a sitemap of its own
  'Sitemap: ' + SITE.origin + '/blog/sitemap.xml\n', 'utf8');

/* ---- sitemap.xml ---- */
const today = new Date().toISOString().slice(0, 10);
const urls = PAGES.filter(p => !p.noSitemap).map(p => ({ loc: SITE.origin + p.path, pri: p.priority }))
  .concat(SHOPS.map(s => ({ loc: SITE.origin + '/' + s, pri: '0.7' })));
fs.writeFileSync('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u =>
    '  <url>\n' +
    '    <loc>' + u.loc + '</loc>\n' +
    '    <lastmod>' + today + '</lastmod>\n' +
    '    <priority>' + u.pri + '</priority>\n' +
    '  </url>').join('\n') + '\n' +
  '</urlset>\n', 'utf8');

console.log('  robots.txt    written');
console.log('  sitemap.xml   ' + urls.length + ' urls');
console.log('');
console.log('  domain lives on line 24 of this file and nowhere else');
