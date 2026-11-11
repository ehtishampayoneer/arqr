/* ARQR360 · Android AR hand-off, with a way back when it fails.

   Every "View in your room" button used to send Android phones to Scene Viewer
   with location.href and the fallback set to this same page, so when the hand-off
   failed the shopper tapped and nothing seemed to happen.

   Now a tap goes:
     0. AR inside the browser itself (WebXR), through Google's <model-viewer>,
        when the phone and browser have it. No hand-off to any app at all: the
        way other AR providers open it, and the route that works on a Samsung
        Galaxy S25 where step 1 showed nothing (Chrome and Samsung Internet,
        10 Nov 2026). The model starts loading when the page or product opens
        (ARQRAndroidAR.prepare), so the tap finds it ready.
     1. Scene Viewer through the Google app, built exactly the way Google's own
        <model-viewer> (v4.4) builds it: intent version 1.2, mode=ar_preferred,
        disable_occlusion=true, file last, opened by clicking a link (not by
        setting location.href), and a fallback that only changes the hash.
        ar_preferred opens AR where the phone has it, and the 3D viewer where
        it doesn't, so a phone without AR still sees the rug.
     2. If nothing opened, a bar offers "Try again", which goes straight to
        Google Play Services for AR (com.google.ar.core, ar_only), the route
        Google documents for AR-only hand-offs. A browser only hands off to an
        app from a tap, so this needs the shopper's tap.
     3. If that fails too, the bar says the room view is not available here.

   How "it failed" is known:
     - the fallback is this page + #arqr-ar-N, which changes only the hash (no
       reload) and fires hashchange; or
     - the page is still in front several seconds after the tap (an app opening
       sends the page to the background), which covers a hand-off that was taken
       and then dropped.

   On a personal preview link (?v=name, see notify.js) each outcome is reported
   through ARQRNotify, so we learn what happened on the visitor's own phone.

   Two ways in:
     ARQRAndroidAR(intentUrl)              steps 1 to 3, from the intent URL a page
                                           always built (file, title, link and size
                                           lock are read from it)
     ARQRAndroidAR.prepare(glbUrl, opts)   load the model for step 0 early
     ARQRAndroidAR.open(glbUrl, opts)      steps 0 to 3 from the tap
       opts: { title, link, wall }         Scene Viewer's title and link; wall placement */
(function () {
  var WAIT = 5000;            // ms the page may stay in front before we call it a miss (slow phones open Scene Viewer slowly)
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

  // An app opened: the page went to the background. Stop the clock.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && timer) {
      clearTimeout(timer); timer = null;
      report('t' + step + '-opened');
      step = 0;
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

  /* ---- Step 0: AR inside the browser (WebXR) through model-viewer ---- */
  var MV = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';  // the version the 3D views use
  var TAP_WINDOW = 4000;      // ms a browser still counts as "just tapped" for starting AR
  var mvLoading = null, xrCheck = null, viewers = {};

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
  var SHARP = String((document.currentScript && document.currentScript.src) || '/assets/ar-android.js').replace(/ar-android\.js(\?.*)?$/, 'mv-sharp.js');

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
        lastUrl = intentFor(glb, o);
        showBar('The room view didn’t open. Tap “Try again” to open it another way.', true, 'Try again', function () { go(1); });
      }
    });
    document.body.appendChild(mv);
    viewers[key] = mv;
    return mv;
  }

  // the intent URL the pages used to build, for steps 1 to 3
  function intentFor(glb, o) {
    return 'intent://arvr.google.com/scene-viewer/1.0?file=' + encodeURIComponent(abs(glb)) +
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
    return;   // nothing to fetch ahead now: Scene Viewer downloads the rug itself
    o = o || {};
    afterPageLoad(function () {
      hasWebXR().then(function (ok) { if (ok) loadViewer().then(function () { viewer(glb, o); }); });
    });
  }

  // 11 Nov 2026: the first tap goes to Scene Viewer again (the route Shopify stores use on
  // Android), launched exactly like model-viewer. AR inside the browser (WebXR) is kept only
  // as the last resort, after both app routes: on a WebXR-capable Samsung the in-browser
  // route reported nothing after the tap, and it needs the whole 8 MB rug before it can start.
  function openModel(glb, o) {
    o = o || {};
    report('sv-first');
    handOff(intentFor(glb, o));
  }

  // Both app routes failed: if this browser has AR itself, load the rug and offer one tap.
  function lastResort(url) {
    var sorry = 'Sorry, the room view isn’t available on this phone. It needs Google Play Services for AR, which most recent Android phones have.';
    hasWebXR().then(function (ok) {
      if (!ok) { report('t3-none'); showBar(sorry, false); return; }
      report('t3-offer');
      showBar('Getting the room view ready in your browser…', false);
      var p = parts(url);
      var o = { title: p.title, link: p.link, wall: !!p.enable_vertical_placement };
      loadViewer().then(function () {
        var mv = viewer(p.file, o);
        return waitFor(function () { return mv.loaded; }, 60000).then(function (loaded) {
          if (!loaded) { report('t3-noload'); showBar(sorry, false); return; }
          showBar('It’s ready. Tap below and point your phone at the floor.', true, 'Place it in my room', function () {
            hideBar(); report('t3-tap'); mv.activateAR();
          });
        });
      });
    });
  }

  function openModelWebXRFirst(glb, o) {   // the 10 Nov flow, kept for reference; not used
    o = o || {};
    var tapped = Date.now();
    hasWebXR().then(function (ok) {
      if (!ok) { handOff(intentFor(glb, o)); return; }          // no WebXR here: steps 1 to 3
      report('t0-tap');
      loadViewer().then(function () {
        var mv = viewer(glb, o);
        return waitFor(function () { return mv.canActivateAR; }, 3000).then(function (can) {
          if (!can) {                                             // WebXR said yes but can't start: the app route, from a fresh tap
            report('t0-cant');
            lastUrl = intentFor(glb, o);
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
              lastUrl = intentFor(glb, o);                         // never arrived: the app route, from a fresh tap
              showBar('The room view is taking too long. Tap below to open it another way.', true, 'Try again', function () { go(1); });
            });
          });
        });
      });
    });
  }

  window.ARQRAndroidAR = handOff;
  window.ARQRAndroidAR.prepare = prepare;
  window.ARQRAndroidAR.open = openModel;
})();
