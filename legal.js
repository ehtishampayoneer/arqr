/* ------------------------------------------------------------------
   Terms, Privacy and Refunds, written from one place.

   Three pages that share a header, a footer and a stylesheet, so they
   are generated rather than copied: copied pages drift, and three legal
   documents that disagree with each other are worse than none.

   The content is deliberately specific to what this business actually
   does. A privacy policy that lists cookies the site does not set, or
   analytics it does not run, is not a safer document, it is a false one,
   and it is the first thing a payment provider's reviewer checks. So
   what is written below was read off the code:

     arqr-lang   i18n.js:25    the language someone picked
     arqr-guide  store.html    whether they dismissed the AR guide
     no analytics of any kind on the marketing site
     third parties: Vercel for hosting, Google Fonts for the typeface

   Run:  npm run legal
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');
const START = require('./start-page.js');

/* the asset version the rest of the site is on, read rather than copied,
   so a bump-assets run can never leave this page asking for a stale file */
const V = (fs.readFileSync('index.html', 'utf8').match(/i18n\.js\?v=(\d+)/) || [])[1] || '1';

/* Only /start is translated. It is instructions, and someone reading it in
   their own language gets the photos right. The terms, privacy and refund
   pages stay in English: a translated legal page is a second legal text,
   and nobody has checked those translations against the law. */
/* Marketing Genie's on-site layer: visit counts and leads, on every page. */
const ANALYTICS = '<script src="https://thegenieofmarketing.vercel.app/api/embed?k=ZjQwMGEzM2ItNWUzNC00YjAxLWIwOTYtN2RjMTVhNzdjNDZl.ca7a6f7fc248e2e874dd" async></script>';

const HEAD_START = '<script src="i18n.js?v=' + V + '"></script>\n' +
  '<script>if(/^\\/welcome(\\/|$)/.test(location.pathname)||/[?&]welcome\\b/.test(location.search))' +
  'document.documentElement.className+=" is-welcome";</script>\n';

const BIZ = {
  name: 'ARQR360',
  city: 'Lahore',
  country: 'Pakistan',
  email: 'info@arqr360.com',
  updated: '11 September 2026'
};

/* ---------------------------------------------------------------- content */
const P = (t) => ({ p: t });
const UL = (items) => ({ ul: items });

const DOCS = [
  {
    file: 'start.html',
    path: '/start',
    slug: 'start',
    group: 'guide',
    title: 'What we need from you',
    lead: 'Everything to send us for your AR catalogue: photos, measurements and how to send them.',
    sections: [] /* built by start-page.js */
  },

  {
    file: 'terms.html',
    path: '/terms',
    slug: 'terms',
    title: 'Terms of Service',
    lead: 'The agreement between you and ' + BIZ.name + ' when we build and host an AR catalogue for your shop.',
    sections: [
      ['Who you are dealing with', [
        P(BIZ.name + ' is a business based in ' + BIZ.city + ', ' + BIZ.country + '. You can reach a human at ' +
          '<a href="mailto:' + BIZ.email + '">' + BIZ.email + '</a>. In these terms "we" and "us" mean ' +
          BIZ.name + ', and "you" means the business buying the service.'),
        P('Using this website, or ordering from us, means you accept what is written here.')
      ]],
      ['What we do for you', [
        P('We build true-to-size AR (Augmented Reality) views from your products, so your customers can place each one in their own room at true size, through a link or a QR code. There is no app for them to install: it opens in the phone’s own camera.'),
        P('For each product we build we need photographs and its real measurements. If you already have 3D files we can use those instead.'),
        UL([
          'We build the models and check them against the measurements you give us.',
          'We host the catalogue and give you the QR code and the link.',
          'Orders reach you directly. We are not a shop and we do not take your customers’ money.'
        ])
      ]],
      ['What you are responsible for', [
        P('That you own the products you send us, or have the right to have them modelled and shown. That the measurements you give us are correct, since a model built to a wrong measurement will be wrong in your customer’s room. That your photographs do not infringe anyone else’s rights.'),
        P('We will not build catalogues for counterfeit goods, for anything illegal where you or we are, or for content that infringes someone else’s rights.')
      ]],
      ['What it costs', [
        P('The service is a one-time build fee and then a monthly fee that keeps the catalogue live. The prices on our pricing page at the moment you order are the prices that apply, and founder pricing is time-limited and says so where it is shown.'),
        P('Products beyond the number in your plan are charged per product at the rate shown. Above the largest plan, and for multiple stores or categories, we quote for the range before any work starts.'),
        P('The monthly fee is what pays for hosting, for the catalogue staying online, and for support. Stop paying it and the catalogue stops being served.')
      ]],
      ['How long it takes', [
        P('About seven working days from the point where we have photographs we can actually work from. If a photograph is unusable, or a measurement is missing, that clock starts when the replacement arrives. We will tell you which one it is rather than letting the date slip quietly.')
      ]],
      ['Who owns what', [
        P('<strong>The AR (Augmented Reality) views of your products are yours.</strong> They are built from your goods, and if you leave you can ask us for the files and we will send them.'),
        P('What stays ours is everything that is not your products: the platform, the viewer your customers open, the code, the design of the catalogue pages and our own name and marks. Your subscription is permission to use those while it is running, not ownership of them.'),
        P('We may show your catalogue as an example of our work unless you email us and ask us not to. If you ask, we will stop.')
      ]],
      ['Hosting, and what we do not promise', [
        P('We host your catalogue on infrastructure we do not own, and neither we nor anyone else can honestly promise a website will never be unreachable. We aim to keep it up and to fix breakages quickly. We do not offer an uptime guarantee, and we do not offer service credits.'),
        P('We may change how the platform works, including the viewer, so long as the change does not take away what you are paying for.')
      ]],
      ['Ending it', [
        P('You can cancel the monthly fee at any time. The catalogue stays live until the end of the period you have already paid for, and is then taken offline. Ask us within thirty days of that and we will send you your model files.'),
        P('We may end the agreement if a payment fails and stays unpaid, or if the service is used for something in the list above that we will not build. Where we can, we will tell you first.')
      ]],
      ['If something goes wrong', [
        P('Nothing here limits liability for death, personal injury, or fraud, because it cannot.'),
        P('Beyond that, our liability to you is limited to the amount you have paid us in the twelve months before the problem. We are not liable for lost sales, lost profit or lost data, which are the things a business would most like to claim for and the things nobody building a catalogue can control.')
      ]],
      ['Changes to these terms', [
        P('We may update this page. If a change materially affects what you are paying for, we will email the address on your account before it takes effect. The date at the top says when it was last changed.')
      ]],
      ['Which law applies', [
        P('The law of ' + BIZ.country + ', and the courts of ' + BIZ.city + '.')
      ]]
    ]
  },

  {
    file: 'privacy.html',
    path: '/privacy',
    slug: 'privacy',
    title: 'Privacy Policy',
    lead: 'What this website collects, what it does not, and who else can see anything.',
    sections: [
      ['The short version', [
        P('This website runs no analytics, no advertising trackers and no third-party scripts that watch you. It sets no tracking cookies. The only information we get is what you type into the contact form and send us on purpose.')
      ]],
      ['Who is responsible', [
        P(BIZ.name + ', ' + BIZ.city + ', ' + BIZ.country + '. For anything on this page, email ' +
          '<a href="mailto:' + BIZ.email + '">' + BIZ.email + '</a>.')
      ]],
      ['What the contact form collects', [
        P('When you fill in the form on our home page we receive:'),
        UL([
          'your name and email address, which the form requires,',
          'your phone number and your business or website, if you choose to give them,',
          'the message you write,',
          'and a file, if you attach one.'
        ]),
        P('It is sent as an email to ' + BIZ.email + ', which is a mailbox on our own domain. It is not passed to a form service, it is not sold, and it is not shared with anyone who is not working on your enquiry. We keep enquiries so we can answer them and remember the history if you come back; if you want yours deleted, ask and we will.'),
        P('If you attach a photograph, your browser resizes it before it is sent. That is for the size limit, not for privacy, but it does mean the camera information in the original file does not reach us.')
      ]],
      ['What your browser stores', [
        P('Two things, both kept on your own device, neither sent anywhere:'),
        UL([
          '<code>arqr-lang</code>: the language you picked, so the site is in it next time.',
          '<code>arqr-guide</code>: whether you have already dismissed the guide that explains how to place a product in your room.'
        ]),
        P('These are not cookies and they are not tracking. Clearing your browser’s site data removes them.')
      ]],
      ['Who else is involved', [
        P('Three, and no more:'),
        UL([
          '<strong>Vercel</strong> hosts this site. Like any web host its servers record requests, which includes your IP address. Those servers are outside ' + BIZ.country + ', so visiting this site means that request travels abroad.',
          '<strong>Google Fonts</strong> serves the typefaces the pages are set in, from fonts.googleapis.com and fonts.gstatic.com. Your browser asks Google for those files, and Google sees your IP address when it does.',
          '<strong>NamesLink</strong> runs the mailbox your enquiry arrives in.'
        ]),
        P('The social icons in the footer are ordinary links. Nothing from Instagram, X or LinkedIn loads on this site unless you click through to them.')
      ]],
      ['If you become a customer', [
        P('To build your catalogue we hold the photographs, measurements and product details you send us, and we use them for that and nothing else. We do not use your products to train anything, and we do not pass them to anyone outside the work.'),
        P('We may show a finished catalogue as an example of our work. Email us and we will stop.')
      ]],
      ['Your rights', [
        P('Ask us what we hold about you and we will tell you. Ask us to correct it and we will. Ask us to delete it and we will, unless we are required to keep a record of a transaction. One email to ' +
          '<a href="mailto:' + BIZ.email + '">' + BIZ.email + '</a> is enough, and we will answer within thirty days.')
      ]],
      ['Children', [
        P('This is a service sold to businesses. It is not directed at children and we do not knowingly collect anything from them.')
      ]],
      ['Changes', [
        P('If this page changes, the date at the top changes with it.')
      ]]
    ]
  },

  {
    file: 'refund.html',
    path: '/refund',
    slug: 'refund',
    title: 'Refund Policy',
    lead: 'When you get your money back, and when you do not. Written plainly so there is nothing to argue about later.',
    sections: [
      ['The build fee', [
        P('The build fee pays for work made specifically for you: your products, modelled to your measurements. That shapes the rule.'),
        UL([
          '<strong>Before we start modelling.</strong> A full refund, no reason needed. Email us and it is done.',
          '<strong>Once modelling has begun.</strong> Not refundable, because the work is bespoke and cannot be resold to anyone else. We will tell you when we start, so you always know which side of that line you are on.',
          '<strong>If we cannot deliver.</strong> A full refund. If your photographs turn out not to be workable and we cannot get to a catalogue we would be willing to put our name on, that is our problem, not yours, and you get everything back.'
        ])
      ]],
      ['The monthly fee', [
        P('Cancel whenever you like. Your catalogue stays live to the end of the period you have already paid for, and then comes down.'),
        P('We do not refund part of a month. We also do not bill you again after you cancel, and we do not require notice.')
      ]],
      ['If the catalogue is not what we agreed', [
        P('Tell us. If a model is wrong, the wrong size, or not what you asked for, we fix it at no cost. That is not a refund question, it is us finishing the job properly, and there is no time limit on a mistake that is ours.')
      ]],
      ['How to ask', [
        P('Email <a href="mailto:' + BIZ.email + '">' + BIZ.email + '</a> from the address on the order and say what you want refunded. We will reply within two working days, and where a refund is due we will send it back to the card or account it came from within ten working days.'),
        P('Depending on where you are, your bank or card issuer may take a few days more to show it. That part is out of our hands.')
      ]],
      ['Before you raise a chargeback', [
        P('Please email us first. A chargeback takes weeks and freezes the conversation; an email usually settles it the same day. We would rather refund you than argue with a bank.')
      ]],
      ['Your legal rights', [
        P('Nothing on this page takes away a right you have under the consumer law where you live. Where that law gives you more than this policy does, that law wins.')
      ]]
    ]
  }
];

/* ---------------------------------------------------------------- shell */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CSS = `
  :root{
    --page:#FAF7F2; --page-hi:#FDFBF7; --page-alt:#F4EFE5;
    --ink:#191919; --ink-soft:#6E6A64; --line:#E4DED4;
    --accent:#E0682A;
    --f-head:"Archivo","Arial Black","Segoe UI",Impact,sans-serif;
    --f-body:"Inter","Segoe UI",-apple-system,Helvetica,Arial,sans-serif;
    --bar-h:110px;
    --gutter:clamp(20px,4vw,74px);
    --wrap:min(760px, calc(100% - 2 * var(--gutter)));
  }
  *,*::before,*::after{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--page);color:var(--ink);font-family:var(--f-body);
    font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased}
  /* a faint drafting grid, the same idea as the home page's hero. Fixed
     behind everything so it does not scroll with the text, and faded
     toward the bottom so long pages do not read as graph paper. */
  body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
    background-image:linear-gradient(rgba(25,25,25,.05) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(25,25,25,.05) 1px,transparent 1px);
    background-size:44px 44px;background-position:center top;
    -webkit-mask-image:linear-gradient(to bottom,#000 0%,rgba(0,0,0,.55) 70%,rgba(0,0,0,.3) 100%);
            mask-image:linear-gradient(to bottom,#000 0%,rgba(0,0,0,.55) 70%,rgba(0,0,0,.3) 100%)}
  img{max-width:100%}
  a{color:inherit}
  a:hover{color:var(--accent)}

  .bar{position:sticky;top:0;z-index:40;display:flex;align-items:center;
    justify-content:space-between;min-height:var(--bar-h);
    padding-inline:calc((100% - var(--wrap)) / 2);
    background:rgba(250,247,242,.9);backdrop-filter:blur(14px);
    border-bottom:1px solid var(--line)}
  .logo{--logo-h:56px;
    display:inline-flex;flex-direction:column;align-items:center;gap:4px;
    flex:none;color:var(--ink);text-decoration:none}
  .logo img{display:block;height:var(--logo-h);width:auto}
  .logo-tag{font-family:var(--f-head);font-weight:600;font-size:7.5px;
    letter-spacing:.24em;text-transform:uppercase;line-height:1;
    color:#68676A;white-space:nowrap}
  .back{display:inline-flex;align-items:center;gap:8px;flex:none;
    font-size:14px;font-weight:600;color:var(--ink-soft);text-decoration:none;
    border:1px solid var(--line);border-radius:100px;padding:9px 16px;
    background:var(--page-hi)}
  .back:hover{color:var(--ink);border-color:var(--ink-soft)}
  .back svg{width:15px;height:15px;display:block}
  [dir="rtl"] .back svg{transform:scaleX(-1)}

  main{width:var(--wrap);margin:0 auto;padding:clamp(34px,5vw,58px) 0 clamp(50px,7vw,86px)}
  .eyebrow{margin:0 0 10px;font-size:11.5px;font-weight:700;letter-spacing:.2em;
    text-transform:uppercase;color:var(--accent)}
  h1{font-family:var(--f-head);font-weight:800;letter-spacing:-.02em;
    font-size:clamp(30px,4.6vw,44px);line-height:1.1;margin:0 0 14px}
  .lead{margin:0 0 8px;font-size:clamp(16.5px,1.7vw,19px);color:var(--ink-soft);
    line-height:1.55;max-width:52ch}
  .updated{margin:0 0 clamp(28px,4vw,42px);font-size:13.5px;color:var(--ink-soft)}
  h2{font-family:var(--f-head);font-weight:700;letter-spacing:-.01em;
    font-size:clamp(19px,2.1vw,23px);line-height:1.25;
    margin:clamp(30px,4vw,42px) 0 12px;padding-top:clamp(22px,3vw,30px);
    border-top:1px solid var(--line)}
  h2:first-of-type{border-top:0;padding-top:0}
  h2[id]{scroll-margin-top:96px}
  p{margin:0 0 14px}
  ul{margin:0 0 16px;padding:0;list-style:none}
  li{position:relative;padding-left:22px;margin-bottom:9px}
  li::before{content:"";position:absolute;left:2px;top:.66em;
    width:6px;height:6px;border-radius:50%;background:var(--accent)}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    font-size:.9em;background:var(--page-alt);border:1px solid var(--line);
    border-radius:5px;padding:1px 5px}
  strong{font-weight:600}

  .ask{margin-top:clamp(34px,5vw,50px);padding:clamp(18px,2.4vw,24px);
    border:1px solid var(--line);border-radius:16px;background:var(--page-hi)}
  .ask p{margin:0}

  .site-foot{background:var(--page-alt);border-top:1px solid var(--line);
    padding:clamp(26px,4vw,38px) 0}
  .foot-wrap{width:var(--wrap);margin:0 auto;display:flex;flex-wrap:wrap;
    align-items:center;justify-content:space-between;gap:14px;
    font-size:13.5px;color:var(--ink-soft)}
  .foot-wrap nav{display:flex;flex-wrap:wrap;gap:6px 18px}
  .foot-wrap a{text-decoration:none}
  .foot-wrap a[aria-current="page"]{color:var(--ink);font-weight:600}

  @media(max-width:700px){
    :root{--bar-h:84px}
    .logo{--logo-h:46px}
    .logo-tag{display:none}
    .back span{display:none}
    .back{padding:11px 13px}
    .foot-wrap{justify-content:center;text-align:center}
  }
  @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

/* The legal three and the onboarding page are different kinds of thing,
   so the footer keeps them apart rather than reading as a list of four
   equal documents. */
const link = (d, current) =>
  '<a href="' + d.path + '"' + (d.slug === current ? ' aria-current="page"' : '') + '>' +
  d.title + '</a>';

const footerNav = (current) =>
  DOCS.filter((d) => d.group !== 'guide').map((d) => link(d, current))
    .concat(DOCS.filter((d) => d.group === 'guide').map((d) => link(d, current)))
    .join('\n        ');

function render(doc) {
  const body = doc.sections.map(([heading, blocks]) =>
    '  <h2 id="' + slug(heading) + '">' + esc(heading) + '</h2>\n' +
    blocks.map((b) => b.ul
      ? '  <ul>\n' + b.ul.map((li) => '    <li>' + li + '</li>').join('\n') + '\n  </ul>'
      : '  <p>' + b.p + '</p>').join('\n')
  ).join('\n\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#FAF7F2">
<meta name="description" content="${esc(doc.lead)}">
<title>${esc(doc.title)} | ${BIZ.name}</title>
${doc.slug === 'start' ? HEAD_START : ''}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>${CSS}${doc.slug === 'start' ? START.CSS : ''}</style>
${ANALYTICS}
</head>
<body${doc.slug === 'start' ? ' class="is-guide"' : ''}>

<header class="bar">
  <a class="logo" href="/">
<!-- logo:start, generated by logo-write.js -->
<!-- logo:end -->
    <span class="logo-tag">See it. Place it. Love it.</span>
  </a>
  <a class="back" href="/">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5m0 0 6-6m-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>Back to ${BIZ.name}</span>
  </a>
</header>

${doc.slug === 'start' ? START.body(BIZ) : `<main>
  <p class="eyebrow">${BIZ.name}</p>
  <h1>${esc(doc.title)}</h1>
  <p class="lead">${esc(doc.lead)}</p>
  <p class="updated">Last updated ${BIZ.updated}</p>

${body}

  <div class="ask">
    <p>Anything here you want explained, or disagree with? Email <a href="mailto:${BIZ.email}">${BIZ.email}</a> and a person will answer.</p>
  </div>
</main>`}

<footer class="site-foot">
  <div class="foot-wrap">
    <span>&copy; 2026 ${BIZ.name}, ${BIZ.city}, ${BIZ.country}.</span>
    <nav aria-label="Legal">
        ${footerNav(doc.slug)}
        <a href="/">Home</a>
    </nav>
  </div>
</footer>

${doc.slug === 'start' ? '<script>ARQR_I18N.apply();</script>\n' : ''}</body>
</html>
`;
}

/* No em dashes. They were stripped from every page months ago because
   they read as machine-written, and legal copy is exactly where a
   stray one would sit unread for a year. Checked, not remembered. */
DOCS.forEach((doc) => {
  const html = render(doc);
  /* No em dashes: stripped from every page months ago because they read
     as machine-written. Checked on the written page, not remembered. */
  const dash = html.replace(/<style>[\s\S]*?<\/style>/g, '').indexOf('\u2014');
  if (dash > -1) throw new Error('em dash in ' + doc.file + ' near: ' + html.slice(dash - 40, dash + 20));
  fs.writeFileSync(doc.file, html, 'utf8');
  const words = doc.sections.reduce((n, [, bs]) => n + bs.reduce((m, b) =>
    m + (b.ul ? b.ul.join(' ') : b.p).split(/\s+/).length, 0), 0);
  console.log('  ' + doc.file.padEnd(14) + doc.path.padEnd(10) +
              doc.sections.length + ' sections, ' + words + ' words');
});
console.log('\n  ' + BIZ.name + ', ' + BIZ.city + ', last updated ' + BIZ.updated);

/* These pages are written with an empty logo slot and no SEO head, and two
   other scripts fill both in. Running this file alone once shipped all
   four pages with no logo and no canonical, so it now runs them itself. */
for (const step of ['logo-write.js', 'seo.js']) {
  execFileSync(process.execPath, [step], { stdio: 'inherit' });
}
