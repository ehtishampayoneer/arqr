/* ------------------------------------------------------------------
   arqr360.com/admin: ARQR Studio, from anywhere.

   The model builder needs Blender and minutes of work per product, which a
   serverless function can't do, so it runs on the studio laptop (later, a
   server). This function is the front door: it asks for the admin login,
   and once signed in, passes each request on to Studio through its
   Tailscale Funnel address, adding the shared secret Studio checks. Studio
   refuses anything without that secret, so the Funnel address alone opens
   nothing.

     ADMIN_USER      the login name
     ADMIN_PASSWORD  the login password
     STUDIO_URL      Studio's Funnel address, e.g. https://arqr-studio.tailxxxx.ts.net
     STUDIO_SECRET   the same value as ~/arqr-studio-remote.key on the laptop

   The session is a signed cookie (HMAC keyed by STUDIO_SECRET and the
   password), so changing the password signs everyone out. It is HttpOnly,
   Secure and SameSite=Strict, which also keeps other sites from making
   requests with it.

   Requests are passed through as raw bytes. Vercel caps a request and a
   response at 4.5 MB, which is why Studio takes photos one per request.
   ------------------------------------------------------------------ */
const crypto = require('crypto');

const COOKIE = 'arqr_admin';
const WEEK = 7 * 24 * 3600;

function env() {
  return {
    user: process.env.ADMIN_USER || '',
    pass: process.env.ADMIN_PASSWORD || '',
    studio: (process.env.STUDIO_URL || '').replace(/\/+$/, ''),
    secret: process.env.STUDIO_SECRET || '',
  };
}

function sessionKey(e) {
  return crypto.createHmac('sha256', e.secret).update('admin-session:' + e.pass).digest();
}

function sign(e, user, exp) {
  const payload = Buffer.from(JSON.stringify({ u: user, x: exp })).toString('base64url');
  const mac = crypto.createHmac('sha256', sessionKey(e)).update(payload).digest('base64url');
  return payload + '.' + mac;
}

function signedIn(req, e) {
  const m = (req.headers.cookie || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  if (!m || !e.secret || !e.pass) return false;
  const [payload, mac] = m[1].split('.');
  if (!payload || !mac) return false;
  const want = crypto.createHmac('sha256', sessionKey(e)).update(payload).digest('base64url');
  if (want.length !== mac.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(mac))) return false;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return d.u === e.user && d.x > Date.now() / 1000;
  } catch (err) {
    return false;
  }
}

function same(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function rawBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.concat(chunks)));
  });
}

function page(title, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${title} | ARQR360</title><link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--page:#FAF7F2;--ink:#191919;--soft:#6E6A64;--line:#E4DED4;--accent:#E0682A}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:var(--page);color:var(--ink);font:15px/1.5 "Inter","Segoe UI",Arial,sans-serif;
background-image:linear-gradient(rgba(25,25,25,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(25,25,25,.04) 1px,transparent 1px);background-size:44px 44px}
.card{width:100%;max-width:380px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:28px 24px}
.card img{height:34px;display:block;margin:0 0 18px}
h1{font:800 22px "Archivo","Segoe UI",Arial,sans-serif;margin:0 0 4px}
p{color:var(--soft);margin:0 0 18px;font-size:14px}
label{display:block;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--soft);margin:12px 0 6px}
input{width:100%;font:inherit;padding:12px;border:1px solid var(--line);border-radius:10px;background:#FDFBF7}
input:focus{outline:2px solid var(--accent);outline-offset:1px}
button,.btn{display:block;width:100%;margin-top:18px;border:0;border-radius:12px;background:var(--accent);color:#fff;font:700 15px "Inter",Arial,sans-serif;padding:14px;cursor:pointer;text-align:center;text-decoration:none}
.err{color:#C2412A;font-weight:600;margin:12px 0 0;font-size:14px}
</style></head><body><div class="card"><img src="/assets/logo-bar.png" alt="ARQR360">${inner}</div></body></html>`;
}

function loginPage(error) {
  return page('Admin', `<h1>ARQR Studio</h1><p>Sign in to build models.</p>
<form method="post" action="/admin/login">
<label for="u">Username</label><input id="u" name="user" autocomplete="username" required>
<label for="p">Password</label><input id="p" name="password" type="password" autocomplete="current-password" required>
<button type="submit">Sign in</button>${error ? `<p class="err">${error}</p>` : ''}</form>`);
}

function html(res, code, body, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY', ...headers });
  res.end(body);
}

async function handler(req, res) {
  const e = env();
  const url = new URL(req.url, 'https://arqr360.com');
  const p = (url.searchParams.get('p') || '').replace(/^\/+/, '');
  url.searchParams.delete('p');

  if (!e.user || !e.pass || !e.secret || !e.studio) {
    return html(res, 503, page('Admin', '<h1>Not set up yet</h1><p>ADMIN_USER, ADMIN_PASSWORD, STUDIO_URL and STUDIO_SECRET need to be added in Vercel.</p>'));
  }

  if (p === 'login' && req.method === 'POST') {
    const form = new URLSearchParams((await rawBody(req)).toString('utf8'));
    const ok = same(form.get('user') || '', e.user) & same(form.get('password') || '', e.pass);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 1500));   // slows down guessing
      return html(res, 401, loginPage('That username and password did not match.'));
    }
    const cookie = `${COOKIE}=${sign(e, e.user, Math.floor(Date.now() / 1000) + WEEK)}; Path=/admin; Max-Age=${WEEK}; HttpOnly; Secure; SameSite=Strict`;
    res.writeHead(303, { Location: '/admin', 'Set-Cookie': cookie, 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (p === 'logout') {
    res.writeHead(303, { Location: '/admin', 'Set-Cookie': `${COOKIE}=; Path=/admin; Max-Age=0; HttpOnly; Secure; SameSite=Strict`, 'Cache-Control': 'no-store' });
    return res.end();
  }

  if (!signedIn(req, e)) {
    if (p.startsWith('api/') || p.startsWith('models/')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Signed out. Reload the page and sign in again.' }));
    }
    return html(res, 200, loginPage(''));
  }

  // signed in: everything else is Studio
  if (p && !p.startsWith('api/') && !p.startsWith('models/')) {
    res.writeHead(303, { Location: '/admin' });
    return res.end();
  }
  const target = e.studio + '/' + p + (url.search || '');
  const body = req.method === 'POST' ? await rawBody(req) : undefined;
  let r;
  try {
    r = await fetch(target, {
      method: req.method,
      headers: { 'X-Studio-Secret': e.secret, 'Content-Type': req.headers['content-type'] || 'application/json' },
      body,
      signal: AbortSignal.timeout(25000),
    });
  } catch (err) {
    if (!p) {
      return html(res, 503, page('Studio is offline', `<h1>Studio is offline</h1>
<p>The studio laptop isn't reachable. Check that it's switched on, connected to the internet, and that ARQR Studio is running.</p>
<a class="btn" href="/admin">Try again</a>`));
    }
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Studio is offline: the studio laptop is not reachable.' }));
  }
  const buf = Buffer.from(await r.arrayBuffer());
  res.writeHead(r.status, {
    'Content-Type': r.headers.get('content-type') || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    ...(p ? {} : { 'X-Frame-Options': 'DENY' }),
  });
  res.end(buf);
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
