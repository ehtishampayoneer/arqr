/* ARQR360 · Android AR hand-off, v2 (17 Nov 2026) - TEST, used only by the /test/ar-v2/ pages.

   Why v2: since late October 2026 Google broke both Android AR routes for every website:
     - Scene Viewer (inside the Google app) crashes on launch since Google app 17.68
       (google-ar/arcore-android-sdk #1797, #1795; still open 11 Nov; Google's own sample crashes);
     - WebXR in Chrome 156 starts the camera but never draws the model when the page renders
       through XRProjectionLayer (crbug 577162402); the classic XRWebGLLayer path still draws.
   model-viewer 3.5 (three.js) takes the projection-layer path whenever
   session.renderState.layers is defined, else XRWebGLLayer. So:
     A. XRRenderState.prototype.layers is hidden (reads undefined) before model-viewer loads:
        three.js then draws through XRWebGLLayer, the path every WebXR phone has always had.
        On a browser without WebXR layers this changes nothing.
     B. The order: a phone whose browser has WebXR AR opens the rug IN THE BROWSER first (no
        app hand-off); "Try again" then hands off to Scene Viewer (for when Google fixes it).
        A phone without WebXR AR: Scene Viewer first, as before; if the Google app comes
        straight back (the crash) we notice at once instead of waiting 9 s.
     C. Last resort on every phone: the rug in 3D on the page itself, so a shopper is never
        left with nothing.

   Same API as v1: ARQRAndroidAR(intentUrl), ARQRAndroidAR.prepare(glb, opts),
   ARQRAndroidAR.open(glb, opts) - pages switch by loading this file instead. */
(function () {
  // A. force three.js onto the classic XRWebGLLayer path (Chrome 156 draws nothing through XRProjectionLayer)
  var CLASSIC = 'not needed';
  try {
    if (window.XRRenderState && XRRenderState.prototype) {
      var d = Object.getOwnPropertyDescriptor(XRRenderState.prototype, 'layers');
      if (d && d.configurable) {
        Object.defineProperty(XRRenderState.prototype, 'layers', { get: function () { return undefined; }, configurable: true, enumerable: d.enumerable });
        CLASSIC = 'on';
      }
    }
  } catch (e) { CLASSIC = 'failed: ' + e.message; }
  var WAIT = 9000;   // Sam's S25 (Chrome 156) took 5+ s to bring Google's viewer up; don't cry wolf            // ms the page may stay in front before we call it a miss (slow phones open Scene Viewer slowly)
  var timer = null, step = 0, lastUrl = '', bar = null;
  var barAction = function () { go(2); };   // what the bar's button does: "Try again" by default

  function base() { return location.href.split('#')[0]; }

  // Pull the Scene Viewer parameters out of the page's intent URL.
  function parts(url) {
    var q = url.split('?')[1] || '';
    q = q.split('#')[0];
    var p = {};
    q.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? '' : kv.slice(i + 1);
      try { p[k] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { p[k] = v; }
    });
    return p;
  }

  function build(p, n) {
    var q = [], file = p.file;
    function add(k, v) { if (v != null && v !== '') q.push(k + '=' + encodeURIComponent(v)); }
    var fb = encodeURIComponent(base() + '#arqr-ar-' + n);
    if (n === 1) {
      // Google app, exactly as model-viewer 4.4
      add('mode', 'ar_preferred');
      add('disable_occlusion', 'true');
      add('resizable', p.resizable || 'false');
      if (p.enable_vertical_placement) add('enable_vertical_placement', p.enable_vertical_placement);
      add('title', p.title); add('link', p.link);
      return 'intent://arvr.google.com/scene-viewer/1.2?' + q.join('&') + '&file=' + encodeURIComponent(file) +
        '#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;' +
        'S.browser_fallback_url=' + fb + ';end;';
    }
    // Google Play Services for AR, AR only (as Google documents for this package)
    add('file', file);
    add('mode', 'ar_only');
    add('resizable', p.resizable || 'false');
    if (p.enable_vertical_placement) add('enable_vertical_placement', p.enable_vertical_placement);
    add('title', p.title); add('link', p.link);
    return 'intent://arvr.google.com/scene-viewer/1.0?' + q.join('&') +
      '#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;' +
      'S.browser_fallback_url=' + fb + ';end;';
  }

  // Open the intent the way model-viewer does: a real link, clicked.
  function open(href) {
    var a = document.getElementById('arqrArLink');
    if (!a) {
      a = document.createElement('a');
      a.id = 'arqrArLink';
      a.style.display = 'none';
      (document.body || document.documentElement).appendChild(a);
    }
    a.setAttribute('href', href);
    a.click();
  }

  function report(what) {
    try { if (window.ARQRNotify) window.ARQRNotify('ardroid-' + what); } catch (e) {}
    try { if (window.va) window.va('event', { name: 'arqr_ar_android_' + what }); } catch (e) {}
  }

  function clearHash() {
    if (/^#arqr-ar-/.test(location.hash)) {
      try { history.replaceState(null, '', base()); } catch (e) {}
    }
  }

  function ensureBar() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;' +
      'background:#1d1b19;color:#fff;border-radius:10px;padding:14px 16px;font:15px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'box-shadow:0 8px 30px rgba(0,0,0,.35);display:none;align-items:center;gap:12px;flex-wrap:wrap';
    var msg = document.createElement('span');
    msg.className = 'arqr-ar-msg';
    msg.style.cssText = 'flex:1 1 200px';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'arqr-ar-retry';
    btn.textContent = 'Try again';
    btn.style.cssText = 'background:#c94141;color:#fff;border:0;border-radius:8px;padding:10px 16px;font:600 15px system-ui,sans-serif;cursor:pointer';
    btn.addEventListener('click', function () { barAction(); });
    var x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', 'Close');
    x.textContent = '×';
    x.style.cssText = 'background:none;border:0;color:#fff;font:22px/1 system-ui,sans-serif;padding:4px 6px;cursor:pointer';
    x.addEventListener('click', hideBar);
    bar.appendChild(msg); bar.appendChild(btn); bar.appendChild(x);
    (document.body || document.documentElement).appendChild(bar);
    return bar;
  }

  // label and action are for step 0's "it's ready" bar; by default the button is "Try again"
  function showBar(text, retry, label, action) {
    var b = ensureBar();
    b.querySelector('.arqr-ar-msg').textContent = text;
    var btn = b.querySelector('.arqr-ar-retry');
    btn.style.display = retry ? '' : 'none';
    btn.textContent = label || 'Try again';
    barAction = action || function () { go(2); };
    b.style.display = 'flex';
    // pages with their own bottom bar (the demo's "Step 2") hide it while this one shows
    document.documentElement.classList.add('arqr-ar-bar-on');
  }

  function hideBar() {
    if (bar) bar.style.display = 'none';
    document.documentElement.classList.remove('arqr-ar-bar-on');
  }

  function missed(how) {
    clearTimeout(timer); timer = null;
    clearHash();
    report('t' + step + '-' + how);
    if (step === 1) {
      showBar('The room view didn’t open. Tap “Try again” to open it another way.', true);
    } else if (step === 2) {
      lastResort(lastUrl);
    }
    step = 0;
  }

  function go(n) {
    hideBar();
    step = n;
    clearTimeout(timer);
    timer = setTimeout(function () { if (document.visibilityState === 'visible') missed('stayed'); }, WAIT);
    report('t' + n + '-tap');
    open(build(parts(lastUrl), n));
  }

  // An app opened: the page went to the background. Stop the clock. If it comes back within a few
  // seconds the app most likely crashed (Google app 17.68+: Scene Viewer closes at once): carry on.
  var hiddenAt = 0, hiddenStep = 0;
  var QUICK = 6000;
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && timer) {
      clearTimeout(timer); timer = null;
      report('t' + step + '-opened');
      hiddenAt = Date.now(); hiddenStep = step;
      step = 0;
    } else if (document.visibilityState === 'visible' && hiddenAt) {
      var away = Date.now() - hiddenAt, was = hiddenStep;
      hiddenAt = 0; hiddenStep = 0;
      if (away < QUICK) { step = was; missed('quickback'); }
    }
  });
  // The phone could not take the hand-off and came back to #arqr-ar-N.
  window.addEventListener('hashchange', function () {
    var m = /^#arqr-ar-(\d)/.exec(location.hash);
    if (m && step) missed('back');
    else clearHash();
  });
  // A fallback that reloaded the page instead of only changing the hash
  // (some browsers): pick up where the tap left off.
  var m = /^#arqr-ar-(\d)/.exec(location.hash);
  if (m) {
    var resume = function () {
      try { lastUrl = sessionStorage.getItem('arqr.ar.last') || ''; } catch (e) {}
      if (lastUrl) { step = +m[1]; missed('reload'); } else clearHash();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resume); else resume();
  }

  function handOff(intentUrl) {
    lastUrl = intentUrl;
    try { sessionStorage.setItem('arqr.ar.last', intentUrl); } catch (e) {}
    go(1);
  }

  // v2: pages using the old API (an intent URL) get the browser route first too
  function handOffV2(intentUrl) {
    var p = parts(intentUrl);
    if (!p.file) { handOff(intentUrl); return; }
    openModel(p.file, { title: p.title, link: p.link, wall: !!p.enable_vertical_placement });
  }

  /* ---- Step 0: AR inside the browser (WebXR) through model-viewer ---- */
  var MV = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';  // the version the 3D views use
  var TAP_WINDOW = 4000;      // ms a browser still counts as "just tapped" for starting AR
  var mvLoading = null, xrCheck = null, viewers = {}, triedBrowser = false;

  function abs(u) { return new URL(u, location.href).href; }

  function hasWebXR() {
    if (!xrCheck) {
      xrCheck = (navigator.xr && navigator.xr.isSessionSupported)
        ? navigator.xr.isSessionSupported('immersive-ar').then(function (ok) { return !!ok; }, function () { return false; })
        : Promise.resolve(false);
    }
    return xrCheck;
  }

  // mv-sharp.js sits next to this file: keeps the rug sharp at the angle a shopper sees it in AR
  var SHARP = String((document.currentScript && document.currentScript.src) || '/assets/ar-android.js').replace(/ar-android(-v2)?\.js(\?.*)?$/, 'mv-sharp.js');

  function loadViewer() {
    if (!mvLoading) {
      if (!window.ARQRSharp) {
        var sh = document.createElement('script');
        sh.src = SHARP;
        document.head.appendChild(sh);
      }
      mvLoading = new Promise(function (done) {
        if (window.customElements && customElements.get('model-viewer')) { done(); return; }
        var s = document.createElement('script');
        s.type = 'module'; s.src = MV; s.onload = done; s.onerror = done;
        document.head.appendChild(s);
        setTimeout(done, 20000);
      }).then(function () {
        if (!window.customElements) return;
        return Promise.race([customElements.whenDefined('model-viewer'), new Promise(function (r) { setTimeout(r, 20000); })]);
      });
    }
    return mvLoading;
  }

  function viewer(glb, o) {
    var key = abs(glb);
    if (viewers[key]) return viewers[key];
    var mv = document.createElement('model-viewer');
    mv.setAttribute('src', key);
    mv.setAttribute('ar', '');
    mv.setAttribute('ar-modes', 'webxr');
    mv.setAttribute('ar-scale', 'fixed');                       // the size stays locked
    mv.setAttribute('ar-placement', o.wall ? 'wall' : 'floor');
    mv.setAttribute('loading', 'eager');
    mv.setAttribute('shadow-intensity', '1');
    mv.setAttribute('alt', o.title || '3D model');
    mv.setAttribute('aria-hidden', 'true');
    // off screen until AR starts; the browser then shows it full screen by itself
    mv.style.cssText = 'position:fixed;left:-300vw;top:0;width:100vw;height:100vh;';
    mv.addEventListener('load', function () { if (window.ARQRSharp) window.ARQRSharp(mv); });
    mv.addEventListener('ar-status', function (e) {
      var st = e.detail && e.detail.status;
      if (st === 'session-started') report('t0-opened');
      if (st === 'failed') {
        report('t0-failed');
        showBar('The room view didn’t open. Tap “Try again” to open it another way.', true, 'Try again', function () { go(1); });
      }
    });
    document.body.appendChild(mv);
    viewers[key] = mv;
    return mv;
  }

  // the intent URL the pages used to build, for steps 1 to 3
  // Google's AR viewer (Scene Viewer) showed Sam's S25 a blank screen with the full rug files
  // (6-9 MB, six 2048 px textures). These rugs have a light copy for it: one 2048 px atlas,
  // ~1.5-2 MB, same size and look (built by tools make_light.py, 11 Nov 2026).
  var LIGHT = /\/sample\/(afshar-2015-070|sirjan-2015-016|chobi-15545)\/\1\.glb(\?.*)?$/;
  function forSceneViewer(url) { return LIGHT.test(url) ? url.replace(/\.glb(\?.*)?$/, '-android.glb') : url; }

  function intentFor(glb, o) {
    return 'intent://arvr.google.com/scene-viewer/1.0?file=' + encodeURIComponent(forSceneViewer(abs(glb))) +
      '&mode=ar_preferred&resizable=false' + (o.wall ? '&enable_vertical_placement=true' : '') +
      (o.title ? '&title=' + encodeURIComponent(o.title) : '') + (o.link ? '&link=' + encodeURIComponent(abs(o.link)) : '') +
      '#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;' +
      'S.browser_fallback_url=' + encodeURIComponent(base()) + ';end;';
  }

  function waitFor(test, ms) {
    return new Promise(function (done) {
      var t0 = Date.now();
      (function poll() {
        if (test()) { done(true); return; }
        if (Date.now() - t0 > ms) { done(false); return; }
        setTimeout(poll, 100);
      })();
    });
  }

  // Start the rug's download only once the page's own photos are in: on slow phone data an
  // 8 MB rug fetched at once would hold up the product photos. A tap before then still works
  // (openModel loads it straight away).
  function afterPageLoad(fn) {
    if (document.readyState === 'complete') { setTimeout(fn, 0); return; }
    window.addEventListener('load', function () { setTimeout(fn, 0); });
  }

  function prepare(glb, o) {
    o = o || {};
    afterPageLoad(function () {
      hasWebXR().then(function (ok) { if (ok) loadViewer().then(function () { viewer(forSceneViewer(abs(glb)), o); }); });
    });
  }

  // 11 Nov 2026: the first tap goes to Scene Viewer again (the route Shopify stores use on
  // Android), launched exactly like model-viewer. AR inside the browser (WebXR) is kept only
  // as the last resort, after both app routes: on a WebXR-capable Samsung the in-browser
  // route reported nothing after the tap, and it needs the whole 8 MB rug before it can start.
  function openModel(glb, o) {
    o = o || {};
    lastUrl = intentFor(glb, o);
    try { sessionStorage.setItem('arqr.ar.last', lastUrl); } catch (e) {}
    hasWebXR().then(function (ok) {
      if (ok) { report('xr-first'); openInBrowser(forSceneViewer(abs(glb)), o); }
      else { report('sv-first'); go(1); }
    });
  }

  // Both app routes failed: if this browser has AR itself, load the rug and offer one tap.
  function lastResort(url) {
    hasWebXR().then(function (ok) {
      if (!ok || triedBrowser) { report('t3-3d'); offer3D(url); return; }
      report('t3-offer');
      showBar('Getting the room view ready in your browser…', false);
      var p = parts(url);
      var o = { title: p.title, link: p.link, wall: !!p.enable_vertical_placement };
      loadViewer().then(function () {
        var mv = viewer(p.file, o);
        return waitFor(function () { return mv.loaded; }, 60000).then(function (loaded) {
          if (!loaded) { report('t3-noload'); offer3D(url); return; }
          showBar('It’s ready. Tap below and point your phone at the floor.', true, 'Place it in my room', function () {
            hideBar(); report('t3-tap'); mv.activateAR();
          });
        });
      });
    });
  }

  function openInBrowser(glb, o) {
    o = o || {};
    var tapped = Date.now();
    hasWebXR().then(function (ok) {
      if (!ok) { go(1); return; }                                // no WebXR here: steps 1 to 3
      triedBrowser = true;
      report('t0-tap-' + CLASSIC.split(':')[0].replace(/ /g, ''));
      loadViewer().then(function () {
        var mv = viewer(glb, o);
        return waitFor(function () { return mv.canActivateAR; }, 3000).then(function (can) {
          if (!can) {                                             // WebXR said yes but can't start: the app route, from a fresh tap
            report('t0-cant');
            showBar('Tap below to open the room view.', true, 'Open the room view', function () { hideBar(); go(1); });
            return;
          }
          // model-viewer asks for the camera only once the whole rug has downloaded. A tap counts
          // for about 5 s, so a quick tap on a slow connection would reach the camera too late and be
          // refused. Start AR from this tap only if the rug is in within the window; otherwise say
          // it's coming, then ask for one more tap (a fresh tap always counts).
          var ready = function () { hideBar(); mv.activateAR(); };
          if (mv.loaded && Date.now() - tapped < TAP_WINDOW) { mv.activateAR(); return; }
          showBar('Getting your rug ready…', false);
          return waitFor(function () { return mv.loaded; }, Math.max(0, TAP_WINDOW - (Date.now() - tapped))).then(function (inTime) {
            if (inTime && Date.now() - tapped < TAP_WINDOW) { ready(); return; }
            report('t0-slow');
            return waitFor(function () { return mv.loaded; }, 60000).then(function (ok) {
              if (ok) { showBar('It’s ready. Tap below and point your phone at the floor.', true, 'Place it in my room', ready); return; }
              showBar('The room view is taking too long. Tap below to open it another way.', true, 'Try again', function () { go(1); });
            });
          });
        });
      });
    });
  }

  // C. the last resort on any phone: the rug in 3D right here (turn it, zoom), no AR needed
  function offer3D(url) {
    var p = parts(url || lastUrl);
    showBar('The room view isn’t working on this phone right now. You can still see the rug in 3D here.', true, 'See it in 3D', function () {
      hideBar(); report('t3-3d-open');
      loadViewer().then(function () {
        var box = document.getElementById('arqr3d');
        if (!box) {
          box = document.createElement('div');
          box.id = 'arqr3d';
          box.style.cssText = 'position:fixed;inset:0;z-index:2147483001;background:#f4f1ec;display:flex;flex-direction:column';
          var top = document.createElement('div');
          top.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 14px;font:600 15px system-ui,sans-serif;color:#1d1b19';
          top.textContent = p.title || 'The rug in 3D';
          var x = document.createElement('button');
          x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Close');
          x.style.cssText = 'background:none;border:0;font:28px/1 system-ui,sans-serif;padding:2px 8px;cursor:pointer';
          x.addEventListener('click', function () { box.style.display = 'none'; });
          top.appendChild(x);
          var mv = document.createElement('model-viewer');
          mv.setAttribute('src', p.file);
          mv.setAttribute('camera-controls', '');
          mv.setAttribute('touch-action', 'pan-y');
          mv.setAttribute('shadow-intensity', '1');
          mv.setAttribute('camera-orbit', '0deg 55deg auto');
          mv.setAttribute('alt', p.title || '3D model');
          mv.style.cssText = 'flex:1;width:100%;background:#f4f1ec';
          mv.addEventListener('load', function () { if (window.ARQRSharp) window.ARQRSharp(mv); });
          box.appendChild(top); box.appendChild(mv);
          document.body.appendChild(box);
        }
        box.style.display = 'flex';
      });
    });
  }

  window.ARQRAndroidAR = handOffV2;
  window.ARQRAndroidAR.classicLayers = function () { return CLASSIC; };
  window.ARQRAndroidAR.prepare = prepare;
  window.ARQRAndroidAR.open = openModel;
})();
