/* ARQR360 · Android AR hand-off, with a way back when it fails.

   Every "View in your room" button used to send Android phones to Scene Viewer
   with location.href and the fallback set to this same page, so when the hand-off
   failed the shopper tapped and nothing seemed to happen.

   Now a tap goes:
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

   Pages call ARQRAndroidAR(intentUrl) with the intent URL they always built;
   the file, title, link and size lock are read from it. */
(function () {
  var WAIT = 5000;            // ms the page may stay in front before we call it a miss (slow phones open Scene Viewer slowly)
  var timer = null, step = 0, lastUrl = '', bar = null;

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
    btn.addEventListener('click', function () { go(2); });
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

  function showBar(text, retry) {
    var b = ensureBar();
    b.querySelector('.arqr-ar-msg').textContent = text;
    b.querySelector('.arqr-ar-retry').style.display = retry ? '' : 'none';
    b.style.display = 'flex';
  }

  function hideBar() { if (bar) bar.style.display = 'none'; }

  function missed(how) {
    clearTimeout(timer); timer = null;
    clearHash();
    report('t' + step + '-' + how);
    if (step === 1) {
      showBar('The room view didn’t open. Tap “Try again” to open it another way.', true);
    } else if (step === 2) {
      showBar('Sorry, the room view isn’t available on this phone. It needs Google Play Services for AR, which most recent Android phones have.', false);
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

  window.ARQRAndroidAR = function (intentUrl) {
    lastUrl = intentUrl;
    try { sessionStorage.setItem('arqr.ar.last', intentUrl); } catch (e) {}
    go(1);
  };
})();
