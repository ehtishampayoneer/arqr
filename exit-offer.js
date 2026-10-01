/* ARQR360 exit-intent offer: free AR sample model.
   Shows once per visitor (14-day cooldown). Desktop fires on mouse exit
   through the top of the viewport; mobile fires on a restrained signal
   (tab/app switch after real engagement), never an instant popup. */
(function(){
  'use strict';

  var COOLDOWN_MS = 14 * 24 * 3600 * 1000; /* show at most once per 14 days */
  var ARM_MS = 12000;                     /* ignore exits in the first 12s */
  var MOBILE_MIN_MS = 45000;              /* mobile: 45s on page minimum */
  var MOBILE_MIN_DEPTH = 0.35;            /* mobile: scrolled 35% minimum */

  var t0 = Date.now();
  var shownThisSession = false;
  var maxDepth = 0;

  function track(name){
    try { if (window.va) window.va('event', { name: name }); } catch (e) {}
  }
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k){ try { return sessionStorage.getItem(k); } catch (e) { return null; } }

  function cooledDown(){
    var ts = parseInt(lsGet('arqr-offer-ts') || '0', 10);
    return (Date.now() - ts) > COOLDOWN_MS;
  }
  function converted(){ return ssGet('arqr-converted') === '1'; }

  /* ---- build the card once, hidden ---- */
  var veil = document.createElement('div');
  veil.id = 'arqr-offer-veil';
  veil.setAttribute('role', 'dialog');
  veil.setAttribute('aria-modal', 'true');
  veil.setAttribute('aria-label', 'Free AR sample offer');
  veil.innerHTML =
    '<div id="arqr-offer-card">' +
      '<button id="arqr-offer-close" type="button" aria-label="Close">&times;</button>' +
      '<p id="arqr-offer-eyebrow">Before you go</p>' +
      '<h3>Want to see your own product in AR?</h3>' +
      '<p>Send us a photo of your bestselling product. We will build one true-to-size AR sample free, so you can try it on your own phone. No commitment.</p>' +
      '<button id="arqr-offer-cta" type="button">Get my free AR sample</button>' +
      '<button id="arqr-offer-no" type="button">No thanks, I will keep browsing</button>' +
      '<p id="arqr-offer-fine">Free sample &middot; No commitment &middot; For furniture, rug and decor stores</p>' +
    '</div>';
  document.body.appendChild(veil);

  var closeBtn = veil.querySelector('#arqr-offer-close');

  function show(){
    if (shownThisSession || converted() || !cooledDown()) return;
    shownThisSession = true;
    lsSet('arqr-offer-ts', String(Date.now()));
    veil.classList.add('open');
    track('arqr_offer_shown');
    try { closeBtn.focus(); } catch (e) {}
  }
  function hide(evName){
    veil.classList.remove('open');
    if (evName) track(evName);
  }

  function maybe(){
    if (Date.now() - t0 < ARM_MS) return;
    show();
  }

  veil.querySelector('#arqr-offer-close').addEventListener('click', function(){ hide('arqr_offer_dismiss'); });
  veil.querySelector('#arqr-offer-no').addEventListener('click', function(){ hide('arqr_offer_dismiss'); });
  veil.addEventListener('click', function(e){ if (e.target === veil) hide('arqr_offer_dismiss'); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && veil.classList.contains('open')) hide('arqr_offer_dismiss');
  });

  veil.querySelector('#arqr-offer-cta').addEventListener('click', function(){
    hide();
    track('arqr_offer_cta');
    /* they are heading to the form; never show the offer again this session */
    try { sessionStorage.setItem('arqr-converted', '1'); } catch (e) {}
    var target = document.getElementById('contact');
    if (target){
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function(){
        var f = document.getElementById('f-name');
        if (f) f.focus({ preventScroll: true });
      }, 700);
    } else {
      location.href = '/#contact';
    }
  });

  /* ---- desktop: mouse leaves through the top ---- */
  document.addEventListener('mouseout', function(e){
    if (!e.relatedTarget && e.clientY <= 8) maybe();
  });

  /* ---- mobile: app/tab switch after genuine engagement ---- */
  function depth(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    return max > 0 ? (window.scrollY || window.pageYOffset) / max : 0;
  }
  document.addEventListener('scroll', function(){
    var d = depth();
    if (d > maxDepth) maxDepth = d;
  }, { passive: true });
  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState !== 'hidden') return;
    if (Date.now() - t0 < MOBILE_MIN_MS) return;
    if (maxDepth < MOBILE_MIN_DEPTH) return;
    show();
  });
})();
