/* ARQR360 · Android AR hand-off, with a way back when it fails.

   Every "View in your room" button used to send Android phones to Scene Viewer
   through the Google app only. When the Google app could not take it (disabled,
   out of date, or a Samsung default getting in the way) the phone fell back to
   this same page, so the shopper tapped and nothing seemed to happen.

   Now a tap goes:
     1. Google Play Services for AR (com.google.ar.core), AR only.
        Built into every ARCore phone, and what Google's own model-viewer uses.
     2. If AR has not opened, a bar offers "Try again", which goes through the
        Google app (the old route). A browser only hands off to an app from a
        tap, so the second try needs the shopper's tap.
     3. If that fails too, the bar says AR is not available on this phone.

   How "it failed" is known:
     - the intent's fallback is this page plus #arqr-ar-1 / #arqr-ar-2, which
       changes only the hash (no reload) and fires hashchange; or
     - the page is still visible a few seconds after the tap (AR opening hides
       the page), which covers a hand-off that is taken and then dropped.

   Pages call ARQRAndroidAR(intentUrl) with the same intent URL they built
   before (Google app package, mode=ar_preferred). Nothing else changes. */
(function () {
  var WAIT = 3500;            // ms the page may stay visible before we call it a miss
  var timer = null, step = 0, lastUrl = '', bar = null;

  function base() { return location.href.split('#')[0]; }

  function withFallback(url, tag) {
    return url.replace(/S\.browser_fallback_url=[^;]*;/,
      'S.browser_fallback_url=' + encodeURIComponent(base() + '#' + tag) + ';');
  }

  // Route 1: Google Play Services for AR. Google's docs pair this package with ar_only.
  function arCoreRoute(url) {
    return url.replace('package=com.google.android.googlequicksearchbox', 'package=com.google.ar.core')
              .replace('mode=ar_preferred', 'mode=ar_only');
  }

  // Route 2: the Google app, as before (ar_preferred; never ar_only with this package).
  function googleAppRoute(url) {
    return url.replace('package=com.google.ar.core', 'package=com.google.android.googlequicksearchbox')
              .replace('mode=ar_only', 'mode=ar_preferred');
  }

  function clearHash() {
    if (/^#arqr-ar-/.test(location.hash)) {
      try { history.replaceState(null, '', base()); } catch (e) {}
    }
  }

  function track(name) {
    try { if (window.va) window.va('event', { name: name }); } catch (e) {}
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
    btn.addEventListener('click', function () { go(googleAppRoute(lastUrl), 2); });
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

  function missed() {
    clearTimeout(timer); timer = null;
    clearHash();
    if (step === 1) {
      track('arqr_ar_android_retry_offered');
      showBar('The room view didn’t open. Tap “Try again” to open it another way.', true);
    } else if (step === 2) {
      track('arqr_ar_android_unavailable');
      showBar('Sorry, the room view isn’t available on this phone. It needs Google Play Services for AR, which most recent Android phones have.', false);
    }
    step = 0;
  }

  function go(url, n) {
    hideBar();
    step = n;
    clearTimeout(timer);
    timer = setTimeout(function () { if (document.visibilityState === 'visible') missed(); }, WAIT);
    track(n === 1 ? 'arqr_ar_android_try1' : 'arqr_ar_android_try2');
    location.href = withFallback(url, 'arqr-ar-' + n);
  }

  // AR opened: the page went to the background. Stop the clock.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && timer) { clearTimeout(timer); timer = null; step = 0; }
  });
  // The phone could not take the hand-off and came back to #arqr-ar-N.
  window.addEventListener('hashchange', function () {
    if (/^#arqr-ar-\d/.test(location.hash) && step) missed();
    else clearHash();
  });
  // A fallback that reloaded the page instead of just changing the hash (some
  // browsers): pick up where the tap left off, from this tab's session storage.
  var m = /^#arqr-ar-(\d)/.exec(location.hash);
  if (m) {
    var resume = function () {
      try { lastUrl = sessionStorage.getItem('arqr.ar.last') || ''; } catch (e) {}
      if (lastUrl) { step = +m[1]; missed(); } else clearHash();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resume); else resume();
  }

  window.ARQRAndroidAR = function (intentUrl) {
    lastUrl = intentUrl;
    try { sessionStorage.setItem('arqr.ar.last', intentUrl); } catch (e) {}
    go(arCoreRoute(intentUrl), 1);
  };
})();
