/* ------------------------------------------------------------------
   arqr360.com/factory: the private model factory.

   One page where the founder uploads product photos and gets back a
   real-world-scale AR (Augmented Reality) view as GLB (Android) and USDZ (iPhone).

   Sign-in is an email magic link, and only allowlisted addresses can get
   one. No passwords to remember, no accounts to manage: if you can read
   the inbox, you are in. Everyone else sees the login form and nothing
   more.

     FACTORY_EMAILS      comma-separated allowlist, e.g. "boss@shop.com".
                         Defaults to the founder's address.
     FACTORY_SECRET      random secret that signs links and sessions.
                         Changing it signs everyone out.
     FACTORY_GPU_URL     the GPU box's public address, e.g.
                         https://arqr-gpu.tailxxxx.ts.net (Tailscale Funnel)
     FACTORY_GPU_SECRET  shared secret the GPU box checks on every call.
     RESEND_API_KEY      sends the magic links (see api/_mail.js).

   The heavy work (TRELLIS.2 needs a real GPU) runs on the GPU box, which
   speaks a tiny jobs API (see ~/workspace/arqr-model-factory/server.py).
   This function is the front door: it signs people in and passes each
   /factory/api/* request through to the box with the shared secret, the
   same shape as /admin. The box refuses anything without that secret, so
   its address alone opens nothing.

   The session is a signed cookie: HttpOnly, Secure, SameSite=Lax,
   Path=/factory, 30 days. Login links live 15 minutes and are signed too,
   so no database is needed anywhere.
   ------------------------------------------------------------------ */
'use strict';
const crypto = require('crypto');
const { send } = require('./_mail');

const COOKIE = 'arqr_factory';
const SESSION_DAYS = 30;
const LINK_MINUTES = 15;
const FOUNDER_EMAIL = 'ehtishampayoneer@gmail.com';

function env() {
  return {
    emails: (process.env.FACTORY_EMAILS || FOUNDER_EMAIL).split(',')
      .map((s) => s.trim().toLowerCase()).filter(Boolean),
    secret: process.env.FACTORY_SECRET || '',
    gpu: (process.env.FACTORY_GPU_URL || '').replace(/\/+$/, ''),
    gpuSecret: process.env.FACTORY_GPU_SECRET || '',
  };
}

/* ---------------- tokens & sessions ---------------- */

function b64url(buf) { return Buffer.from(buf).toString('base64url'); }

function signPayload(e, obj) {
  const payload = b64url(JSON.stringify(obj));
  const mac = crypto.createHmac('sha256', e.secret).update(payload).digest('base64url');
  return payload + '.' + mac;
}

function readSigned(e, token) {
  if (!token || !e.secret) return null;
  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  const [payload, mac] = parts;
  const want = crypto.createHmac('sha256', e.secret).update(payload).digest('base64url');
  if (want.length !== mac.length) return null;
  let ok = false;
  try { ok = crypto.timingSafeEqual(Buffer.from(want), Buffer.from(mac)); } catch (err) { return null; }
  if (!ok) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!d || d.x * 1000 < Date.now()) return null;
    return d;
  } catch (err) { return null; }
}

function sessionEmail(req, e) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)arqr_factory=([^;]+)/);
  if (!m) return null;
  const d = readSigned(e, m[1]);
  if (!d || !d.e) return null;
  return e.emails.includes(String(d.e).toLowerCase()) ? d.e : null;
}

function allowed(email, e) {
  const want = String(email || '').trim().toLowerCase();
  return e.emails.some((a) => {
    const x = Buffer.from(a), y = Buffer.from(want);
    return x.length === y.length && crypto.timingSafeEqual(x, y);
  });
}

/* ---------------- small http helpers ---------------- */

function rawBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.concat(chunks)));
  });
}

function html(res, code, body, headers = {}) {
  res.writeHead(code, {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY', ...headers,
  });
  res.end(body);
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow' });
  res.end(JSON.stringify(obj));
}

/* ---------------- page chrome (same look as the site) ---------------- */

function page(title, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${title} | ARQR360</title><link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--page:#FAF7F2;--ink:#191919;--soft:#6E6A64;--line:#E4DED4;--accent:#E0682A}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:var(--page);color:var(--ink);font:15px/1.5 "Inter","Segoe UI",Arial,sans-serif;
background-image:linear-gradient(rgba(25,25,25,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(25,25,25,.04) 1px,transparent 1px);background-size:44px 44px}
.wrap{max-width:860px;margin:0 auto;padding:28px 18px 60px}
.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
.top img{height:32px}
.top a{font-size:13px;color:var(--soft)}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:26px 24px;margin-bottom:18px}
.card.narrow{max-width:420px;margin:8vh auto 0}
h1{font:800 24px "Archivo","Segoe UI",Arial,sans-serif;margin:0 0 6px}
h2{font:800 17px "Archivo","Segoe UI",Arial,sans-serif;margin:0 0 10px}
p{color:var(--soft);margin:0 0 14px;font-size:14px}
p b,li b{color:var(--ink)}
label{display:block;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--soft);margin:14px 0 6px}
input[type=text],input[type=email],input[type=number],select{width:100%;font:inherit;padding:12px;border:1px solid var(--line);border-radius:10px;background:#FDFBF7}
input:focus,select:focus{outline:2px solid var(--accent);outline-offset:1px}
button,.btn{display:inline-block;border:0;border-radius:12px;background:var(--accent);color:#fff;font:700 15px "Inter",Arial,sans-serif;padding:14px 22px;cursor:pointer;text-decoration:none;text-align:center}
button:disabled{opacity:.55;cursor:wait}
.btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}
.btnrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.err{color:#C2412A;font-weight:600;margin:12px 0 0;font-size:14px}
.ok{color:#2F7D3B;font-weight:600;margin:12px 0 0;font-size:14px}
.drop{border:2px dashed var(--line);border-radius:14px;padding:26px 18px;text-align:center;color:var(--soft);cursor:pointer;background:#FDFBF7}
.drop.over{border-color:var(--accent);background:#FFF6EF}
.thumbs{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.thumb{position:relative;width:96px;height:96px;border-radius:10px;overflow:hidden;border:1px solid var(--line);background:#fff}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.thumb button{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;padding:0;font-size:13px;line-height:1;background:#191919}
.steps{list-style:none;margin:14px 0;padding:0}
.steps li{padding:9px 0 9px 34px;position:relative;color:var(--soft);font-size:14px}
.steps li::before{content:"";position:absolute;left:2px;top:11px;width:16px;height:16px;border-radius:50%;border:2px solid var(--line);background:#fff}
.steps li.doing{color:var(--ink);font-weight:600}
.steps li.doing::before{border-color:var(--accent);border-top-color:transparent;animation:spin 1s linear infinite}
.steps li.done{color:var(--ink)}
.steps li.done::before{background:var(--accent);border-color:var(--accent)}
@keyframes spin{to{transform:rotate(360deg)}}
.bar{height:8px;border-radius:99px;background:#F0EBE1;overflow:hidden;margin:6px 0 4px}
.bar i{display:block;height:100%;width:0;background:var(--accent);border-radius:99px;transition:width .4s}
.viewer{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#F4EFE6,#EDE7DB)}
.viewer model-viewer{width:100%;height:380px;display:block}
.meta{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0 4px;font-size:14px;color:var(--soft)}
.meta b{color:var(--ink)}
.hist{list-style:none;margin:0;padding:0}
.hist li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--line);font-size:14px}
.hist li:first-child{border-top:0}
.hist small{color:var(--soft)}
.hist button{padding:8px 14px;font-size:13px;margin:0}
.note{background:#FFF6EF;border:1px solid #F0D9C2;border-radius:12px;padding:14px 16px;font-size:14px;color:var(--ink);margin-bottom:18px}
.hidden{display:none!important}
@media(max-width:560px){.viewer model-viewer{height:300px}.wrap{padding:20px 14px 48px}}
</style></head><body><div class="wrap">
<div class="top"><img src="/assets/logo-bar.png" alt="ARQR360"><a href="/factory/logout">Sign out</a></div>
${inner}</div></body></html>`;
}

function loginPage(error) {
  return page('Factory sign in', `<div class="card narrow">
<h1>Model Factory</h1><p>Private tool. Sign in with your email and we will send you a link.</p>
<label for="e">Email</label><input id="e" name="email" type="email" autocomplete="email" required placeholder="you@company.com">
<button id="send" style="width:100%;margin-top:16px">Email me a sign-in link</button>
<p class="err hidden" id="lerr">${error || ''}</p>
<p class="ok hidden" id="lok">Check your inbox. If that email is authorized, a sign-in link is on its way (works 15 minutes).</p>
</div>
<script>
document.getElementById('send').addEventListener('click', function(){
  var em = document.getElementById('e').value.trim();
  var le = document.getElementById('lerr'), lo = document.getElementById('lok');
  le.classList.add('hidden'); lo.classList.add('hidden');
  if (!em || em.indexOf('@') < 0){ le.textContent = 'Type your email first.'; le.classList.remove('hidden'); return; }
  fetch('/factory/request-link', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({email: em})})
    .then(function(r){ return r.json(); })
    .then(function(j){
      if (j.ok){ lo.classList.remove('hidden'); }
      else { le.textContent = j.error || 'Something went wrong. Try again.'; le.classList.remove('hidden'); }
    })
    .catch(function(){ le.textContent = 'Network error. Try again.'; le.classList.remove('hidden'); });
});
</script>`);
}

function appPage(gpuOnline) {
  const gpuNote = gpuOnline ? '' :
    `<div class="note"><b>The GPU box is not connected yet.</b><br>
     The page and sign-in work, but building models needs the GPU machine online.
     Your designer runs one command on it (see the setup doc), then this page starts building.</div>`;

  return page('Model Factory', `
<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"></script>
${gpuNote}
<div class="card" id="cardBuild">
  <h1>Build an AR view</h1>
  <p>Upload up to four product photos. Use the clearest front or three-quarter view first. Extra angles are saved with the job for review.</p>
  <label for="pname">Product name</label>
  <input type="text" id="pname" placeholder="e.g. Novara accent chair" maxlength="80">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div><label for="pheight">Real height (m, optional)</label>
    <input type="number" id="pheight" step="0.01" min="0.05" max="5" placeholder="0.85"></div>
    <div><label for="pcat">Category</label>
    <select id="pcat">
      <option value="generic">Generic</option><option value="chair">Chair</option>
      <option value="sofa">Sofa</option><option value="table">Table</option>
      <option value="bed">Bed</option><option value="lamp">Lamp</option>
      <option value="rug">Rug</option><option value="decor">Decor</option>
      <option value="footwear">Footwear</option>
    </select></div>
  </div>
  <label>Photos (up to 4)</label>
  <div class="drop" id="drop">Tap to choose photos or drop them here<br><small>JPG or PNG, first photo should be the front view</small></div>
  <input type="file" id="file" accept="image/*" multiple class="hidden">
  <div class="thumbs" id="thumbs"></div>
  <div class="btnrow"><button id="go" ${gpuOnline ? '' : 'disabled'}>Build AR view</button></div>
  <p class="err hidden" id="err"></p>
</div>

<div class="card hidden" id="cardProg">
  <h1>Building your model</h1>
  <p id="progName"></p>
  <div class="bar"><i id="barFill"></i></div>
  <ul class="steps" id="steps">
    <li data-s="received">Photos received</li>
    <li data-s="preprocess">Cleaning up the photos</li>
    <li data-s="generate">Generating the 3D shape</li>
    <li data-s="texture">Painting realistic materials</li>
    <li data-s="package">Packing Android + iPhone files</li>
  </ul>
  <p class="err hidden" id="progErr"></p>
</div>

<div class="card hidden" id="cardDone">
  <h1 id="doneName"></h1>
  <div class="viewer"><model-viewer id="mv" camera-controls auto-rotate
    ar ar-modes="scene-viewer quick-look webxr"
    shadow-intensity="1" exposure="1.1"
    alt="AR view preview"></model-viewer></div>
  <div class="meta" id="doneMeta"></div>
  <p>Tap the <b>AR button</b> on the preview to place it in your room. Android uses the GLB file, iPhone uses the USDZ file.</p>
  <div class="btnrow">
    <a class="btn" id="dlGlb" href="#" download>Download GLB (Android)</a>
    <a class="btn ghost" id="dlUsdz" href="#" download>Download USDZ (iPhone)</a>
    <button class="btn ghost" id="again">Build another</button>
  </div>
</div>

<div class="card" id="cardHist">
  <h2>My models</h2>
  <ul class="hist" id="hist"><li><small>Nothing built yet on this device.</small></li></ul>
</div>

<script>
(function(){
  var photos = [];
  var drop = document.getElementById('drop');
  var file = document.getElementById('file');
  var thumbs = document.getElementById('thumbs');
  var err = document.getElementById('err');
  var go = document.getElementById('go');

  function showErr(m){ err.textContent = m; err.classList.remove('hidden'); }
  function hideErr(){ err.classList.add('hidden'); }

  drop.addEventListener('click', function(){ file.click(); });
  ['dragover','dragenter'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave','drop'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function(e){ addFiles(e.dataTransfer.files); });
  file.addEventListener('change', function(){ addFiles(file.files); file.value=''; });

  function addFiles(list){
    hideErr();
    var avail = 4 - photos.length;
    if (avail <= 0){ showErr('4 photos max. Remove one to add another.'); return; }
    var n = Math.min(avail, list.length), pending = n;
    for (var i=0;i<n;i++){
      (function(f){
        var rd = new FileReader();
        rd.onload = function(){
          var img = new Image();
          img.onload = function(){
            var s = Math.min(1, 1024 / Math.max(img.width, img.height));
            var c = document.createElement('canvas');
            c.width = Math.round(img.width*s); c.height = Math.round(img.height*s);
            c.getContext('2d').drawImage(img,0,0,c.width,c.height);
            var url = c.toDataURL('image/jpeg', 0.85);
            photos.push({url:url, b64:url.split(',')[1]});
            if (--pending === 0) renderThumbs();
          };
          img.onerror = function(){ if (--pending === 0) renderThumbs(); };
          img.src = rd.result;
        };
        rd.readAsDataURL(f);
      })(list[i]);
    }
    if (list.length > n) showErr('Only the first '+n+' photos were kept (4 max).');
  }

  function renderThumbs(){
    thumbs.innerHTML = '';
    photos.forEach(function(p, i){
      var d = document.createElement('div'); d.className='thumb';
      var im = document.createElement('img'); im.src = p.url; d.appendChild(im);
      var b = document.createElement('button'); b.textContent='×'; b.title='Remove';
      b.addEventListener('click', function(){ photos.splice(i,1); renderThumbs(); });
      d.appendChild(b); thumbs.appendChild(d);
    });
  }

  var STAGES = ['received','preprocess','generate','texture','package'];
  var timer = null;

  go.addEventListener('click', function(){
    hideErr();
    if (!photos.length){ showErr('Add at least one photo first.'); return; }
    go.disabled = true;
    var body = {
      name: document.getElementById('pname').value.trim(),
      height_m: parseFloat(document.getElementById('pheight').value) || null,
      category: document.getElementById('pcat').value,
      photos: photos.map(function(p){ return p.b64; })
    };
    fetch('/factory/api/jobs', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)})
      .then(function(r){ return r.json().then(function(j){ return {s:r.status, j:j}; }); })
      .then(function(r){
        if (r.s !== 200 || !r.j.job_id){ go.disabled=false; showErr((r.j&&r.j.error)||'Could not start the job.'); return; }
        startPoll(r.j.job_id, body.name || 'Product');
      })
      .catch(function(){ go.disabled=false; showErr('Network error. Try again.'); });
  });

  function startPoll(id, name){
    document.getElementById('cardBuild').classList.add('hidden');
    document.getElementById('cardProg').classList.remove('hidden');
    document.getElementById('progName').textContent = name;
    document.getElementById('progErr').classList.add('hidden');
    var lis = document.querySelectorAll('#steps li');
    lis.forEach(function(li){ li.className=''; });
    if (timer) clearInterval(timer);
    timer = setInterval(function(){ poll(id, name); }, 3000);
    poll(id, name);
  }

  function poll(id, name){
    fetch('/factory/api/jobs/'+id)
      .then(function(r){ return r.json(); })
      .then(function(j){
        if (j.error){ return; }
        var idx = STAGES.indexOf(j.stage);
        var lis = document.querySelectorAll('#steps li');
        lis.forEach(function(li, i){
          li.className = i < idx ? 'done' : (i === idx ? 'doing' : '');
        });
        document.getElementById('barFill').style.width = (j.progress||0)+'%';
        if (j.status === 'done'){ clearInterval(timer); finishOk(id, j); }
        if (j.status === 'failed'){
          clearInterval(timer);
          var pe = document.getElementById('progErr');
          pe.textContent = 'Build failed: '+(j.error||'unknown error');
          pe.classList.remove('hidden');
        }
      })
      .catch(function(){});
  }

  function finishOk(id, j){
    document.getElementById('cardProg').classList.add('hidden');
    var card = document.getElementById('cardDone');
    card.classList.remove('hidden');
    document.getElementById('doneName').textContent = j.name || 'Your model';
    var mv = document.getElementById('mv');
    mv.setAttribute('src', '/factory/api/jobs/'+id+'/model.glb');
    mv.setAttribute('ios-src', '/factory/api/jobs/'+id+'/model.usdz');
    var d = j.dims || {};
    var meta = [];
    if (d.height_m) meta.push('Height <b>'+d.height_m.toFixed(2)+' m</b>');
    if (d.width_m) meta.push('Width <b>'+d.width_m.toFixed(2)+' m</b>');
    if (d.depth_m) meta.push('Depth <b>'+d.depth_m.toFixed(2)+' m</b>');
    if (j.seconds) meta.push('Built in <b>'+Math.round(j.seconds)+'s</b>');
    document.getElementById('doneMeta').innerHTML = meta.join('');
    var g = document.getElementById('dlGlb'), u = document.getElementById('dlUsdz');
    g.href = '/factory/api/jobs/'+id+'/model.glb';
    u.href = '/factory/api/jobs/'+id+'/model.usdz';
    g.setAttribute('download', (j.name||'model')+'.glb');
    u.setAttribute('download', (j.name||'model')+'.usdz');
    saveHist(id, j.name || 'Product');
    window.scrollTo({top: card.offsetTop - 20, behavior:'smooth'});
  }

  document.getElementById('again').addEventListener('click', function(){
    document.getElementById('cardDone').classList.add('hidden');
    document.getElementById('cardBuild').classList.remove('hidden');
    photos = []; renderThumbs(); go.disabled = false;
    window.scrollTo({top:0, behavior:'smooth'});
  });

  function saveHist(id, name){
    try{
      var h = JSON.parse(localStorage.getItem('arqr_factory_jobs')||'[]');
      h.unshift({id:id, name:name, at:Date.now()});
      localStorage.setItem('arqr_factory_jobs', JSON.stringify(h.slice(0,20)));
      renderHist();
    }catch(e){}
  }
  function renderHist(){
    var ul = document.getElementById('hist');
    try{
      var h = JSON.parse(localStorage.getItem('arqr_factory_jobs')||'[]');
      if (!h.length) return;
      ul.innerHTML = '';
      h.forEach(function(it){
        var li = document.createElement('li');
        var d = new Date(it.at);
        li.innerHTML = '<span><b></b><br><small></small></span>';
        li.querySelector('b').textContent = it.name;
        li.querySelector('small').textContent = d.toLocaleDateString()+' '+d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
        var b = document.createElement('button'); b.className='btn ghost'; b.textContent='Open';
        b.addEventListener('click', function(){
          fetch('/factory/api/jobs/'+it.id).then(function(r){return r.json();}).then(function(j){
            if (j.status==='done'){ startPollDone(it.id, j); }
            else { showErr('That model is no longer on the server.'); }
          });
        });
        li.appendChild(b); ul.appendChild(li);
      });
    }catch(e){}
  }
  function startPollDone(id, j){
    document.getElementById('cardBuild').classList.add('hidden');
    document.getElementById('cardProg').classList.add('hidden');
    finishOk(id, j);
  }
  renderHist();
})();
</script>`);
}

/* ---------------- magic links ---------------- */

const attempts = new Map(); // ip -> [timestamps], best-effort throttle
function throttled(ip) {
  const now = Date.now(), arr = (attempts.get(ip) || []).filter((t) => now - t < 3600e3);
  arr.push(now); attempts.set(ip, arr);
  return arr.length > 10;
}

async function requestLink(req, res, e) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  let body = {};
  try { body = JSON.parse((await rawBody(req)).toString('utf8')); }
  catch (err) { return json(res, 400, { ok: false }); }
  const email = String(body.email || '').trim().toLowerCase();
  // Always answer the same way; the inbox is what proves anything.
  if (!throttled(ip) && email && allowed(email, e)) {
    const token = signPayload(e, { e: email, x: Math.floor(Date.now() / 1000) + LINK_MINUTES * 60 });
    const link = 'https://arqr360.com/factory/verify?t=' + token;
    try {
      await send({
        to: email,
        subject: 'Your ARQR360 Factory sign-in link',
        html: `<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#191919">Tap the button to sign in to the ARQR360 Model Factory. The link works for 15 minutes.</p>
<p><a href="${link}" style="display:inline-block;padding:13px 26px;background:#E0682A;color:#fff;text-decoration:none;border-radius:100px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600">Sign in to Factory</a></p>
<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#6E6A64">If you did not ask for this, ignore it.</p>`,
        text: 'Sign in to the ARQR360 Model Factory (link works 15 minutes):\n' + link + '\n\nIf you did not ask for this, ignore it.',
      });
    } catch (err) { return json(res, 500, { ok: false, error: 'Email failed to send. Try again in a minute.' }); }
  }
  return json(res, 200, { ok: true });
}

function verifyLink(req, res, e, url) {
  const d = readSigned(e, url.searchParams.get('t'));
  if (!d || !d.e || !allowed(d.e, e)) return html(res, 401, loginPage('That link is expired or invalid. Ask for a new one.'));
  // Render the app directly on this response instead of a 303 redirect: some
  // mobile in-app browsers drop the session cookie across the redirect hop,
  // which caused an endless sign-in loop. SameSite=Lax for the same reason.
  const cookie = `${COOKIE}=${signPayload(e, { e: d.e, x: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400 })}` +
    `; Path=/factory; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`;
  return html(res, 200, appPage(!!(e.gpu && e.gpuSecret)), { 'Set-Cookie': cookie });
}

/* ---------------- GPU proxy ---------------- */

async function proxyGpu(req, res, e, p) {
  if (!e.gpu || !e.gpuSecret) {
    return json(res, 503, { error: 'GPU box not connected yet.' });
  }
  const url = new URL(req.url, 'https://arqr360.com');
  const target = e.gpu + '/' + p + (url.search || '');
  const body = (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')
    ? await rawBody(req) : undefined;
  let r;
  try {
    r = await fetch(target, {
      method: req.method,
      headers: {
        'X-Factory-Secret': e.gpuSecret,
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body,
      signal: AbortSignal.timeout(25000),
    });
  } catch (err) {
    return json(res, 503, { error: 'GPU box is offline.' });
  }
  const buf = Buffer.from(await r.arrayBuffer());
  const ct = r.headers.get('content-type') || 'application/octet-stream';
  res.writeHead(r.status, {
    'Content-Type': ct, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow',
    ...(ct.startsWith('model/') || ct === 'model/vnd.usdz+zip'
      ? { 'Content-Disposition': 'attachment; filename="' + p.split('/').pop() + '"' } : {}),
  });
  res.end(buf);
}

/* ---------------- handler ---------------- */

async function handler(req, res) {
  const e = env();
  const url = new URL(req.url, 'https://arqr360.com');
  const p = (url.searchParams.get('p') || '').replace(/^\/+/, '');
  url.searchParams.delete('p');

  if (!e.secret) {
    return html(res, 503, page('Factory', `<div class="card narrow"><h1>Not set up yet</h1>
<p>FACTORY_SECRET needs to be added in Vercel.</p></div>`));
  }

  if (p === 'request-link' && req.method === 'POST') return requestLink(req, res, e);
  if (p === 'verify') return verifyLink(req, res, e, url);
  if (p === 'logout') {
    res.writeHead(303, { Location: '/factory',
      'Set-Cookie': `${COOKIE}=; Path=/factory; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
      'Cache-Control': 'no-store' });
    return res.end();
  }

  const me = sessionEmail(req, e);

  // GPU API: needs a session, then straight through to the box.
  if (p.startsWith('api/')) {
    if (!me) return json(res, 401, { error: 'Signed out. Reload the page and sign in again.' });
    return proxyGpu(req, res, e, p);
  }

  if (p && p !== '') {
    res.writeHead(303, { Location: '/factory', 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (!me) return html(res, 200, loginPage(''));

  // The login form posts here as a plain form fallback; the JS path uses JSON.
  return html(res, 200, appPage(!!(e.gpu && e.gpuSecret)));
}


module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
