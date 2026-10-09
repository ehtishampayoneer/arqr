/* ARQR360 exit-intent offer: "Get Your First Product Free" ticket popup.
   Shows once per visitor (14-day cooldown). Desktop fires on mouse exit
   through the top of the viewport; mobile fires on a restrained signal
   (tab/app switch after real engagement), never an instant popup.
   The visitor pastes a product link (or uploads up to 4 product photos)
   plus their details, the ticket endpoint mails us the ticket and mails
   them a ticket number. */
(function(){
  'use strict';

  var COOLDOWN_MS = 14 * 24 * 3600 * 1000; /* show at most once per 14 days */
  var ARM_MS = 12000;                     /* ignore exits in the first 12s */
  var MOBILE_MIN_MS = 30000;              /* mobile: 30s on page minimum */
  var MOBILE_MIN_DEPTH = 0.35;            /* mobile: scrolled 35% minimum */
  var MAX_SLOTS = 4;
  var MAX_DIM = 1600;                     /* photos are resized before upload */
  var MAX_TOTAL = 3 * 1024 * 1024;        /* matches the ticket endpoint */

  var t0 = Date.now();
  var shownThisSession = false;
  var maxDepth = 0;
  var photos = [null, null, null, null];  /* dataURL per slot */

  function track(name){
    try { if (window.va) window.va('event', { name: name }); } catch (e) {}
  }
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k){ try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function cooledDown(){
    var ts = parseInt(lsGet('arqr-offer-ts') || '0', 10);
    return (Date.now() - ts) > COOLDOWN_MS;
  }
  function converted(){ return ssGet('arqr-converted') === '1'; }

  var ICON_IMG = '<svg viewBox="0 0 24 24" fill="none" stroke="#EE5A0D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>';
  var ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="#EE5A0D" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9" fill="#EE5A0D" stroke="none"/><path d="M12 8v8M8 12h8" stroke="#fff"/></svg>';
  var ICON_CUBE = '<svg viewBox="0 0 24 24" fill="none" stroke="#EE5A0D" stroke-width="1.9" stroke-linejoin="round"><path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z"/><path d="M12 11L4 6.5M12 11l8-4.5M12 11v9"/></svg>';
  var ICON_TICKET = '<svg viewBox="0 0 24 24" fill="none" stroke="#EE5A0D" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2a2.5 2.5 0 000 5v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2.5 2.5 0 000-5z"/><path d="M13 5v2M13 11v2M13 17v2"/></svg>';
  var ICON_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="#EE5A0D" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';
  var ICON_USER = '<svg viewBox="0 0 24 24" fill="none" stroke="#B9B3A8" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>';
  var ICON_LINK = '<svg viewBox="0 0 24 24" fill="none" stroke="#B9B3A8" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a5 5 0 007.1 0l2.4-2.4a5 5 0 00-7.1-7.1l-1.4 1.4"/><path d="M14 10a5 5 0 00-7.1 0l-2.4 2.4a5 5 0 007.1 7.1l1.4-1.4"/></svg>';
  var ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="#B9B3A8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.13.96.36 1.9.7 2.8a2 2 0 01-.45 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0122 16.9z"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#2F9E44" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

  /* ---- build the card once, hidden ---- */
  var veil = document.createElement('div');
  veil.id = 'arqr-offer-veil';
  veil.setAttribute('role', 'dialog');
  veil.setAttribute('aria-modal', 'true');
  veil.setAttribute('aria-label', 'Get your first product free');

  var slotsHtml = '';
  for (var s = 0; s < MAX_SLOTS; s++) {
    slotsHtml +=
      '<div class="arqr-offer-slot" data-slot="' + s + '" role="button" tabindex="0" aria-label="Upload photo ' + (s + 1) + '">' +
        '<span class="slot-empty">' + ICON_IMG +
        '<span style="display:block;margin-top:2px">' + ICON_PLUS.replace('<svg', '<svg style="width:22px;height:22px;vertical-align:-4px"') + '</span>' +
        '<span>Upload Photo</span></span>' +
        '<button type="button" class="rm" aria-label="Remove photo">&times;</button>' +
      '</div>';
  }

  veil.innerHTML =
    '<div id="arqr-offer-card">' +
      '<button id="arqr-offer-close" type="button" aria-label="Close">&times;</button>' +
      '<div class="arqr-offer-head">' +
        '<img class="arqr-offer-art" src="assets/offer-header.jpg" alt="">' +
        '<div class="arqr-offer-headtext">' +
          '<h2>Get Your<br>First Product <span class="peach">Free</span></h2>' +
          '<p>Try ARQR360 with one of your products, on us. No cost, no commitment.</p>' +
        '</div>' +
      '</div>' +
      '<div class="arqr-offer-body" id="arqr-offer-form-wrap">' +
        '<h3>Your Product</h3>' +
        '<p class="arqr-offer-sub">Paste a link to one product on your site, we will pull the photos ourselves</p>' +
        '<div class="arqr-offer-field full"><div class="arqr-offer-in">' + ICON_LINK + '<input id="arqr-t-plink" type="url" autocomplete="url" placeholder="e.g. https://yourstore.com/products/bestseller"></div></div>' +
        '<p class="arqr-offer-sub" style="margin-top:14px">Or upload photos instead (up to 4)</p>' +
        '<div class="arqr-offer-slots">' + slotsHtml + '</div>' +
        '<h3>Your Details</h3>' +
        '<p class="arqr-offer-sub">Where should we send your free product?</p>' +
        '<div class="arqr-offer-grid">' +
          '<div class="arqr-offer-field"><label>Your Name <span class="req">*</span></label>' +
            '<div class="arqr-offer-in">' + ICON_USER + '<input id="arqr-t-name" type="text" autocomplete="name" placeholder="e.g. John Smith"></div></div>' +
          '<div class="arqr-offer-field"><label>Email Address <span class="req">*</span></label>' +
            '<div class="arqr-offer-in">' + ICON_MAIL.replace('#EE5A0D', '#B9B3A8') + '<input id="arqr-t-email" type="email" autocomplete="email" placeholder="e.g. john@yourstore.com"></div></div>' +
          '<div class="arqr-offer-field"><label>Your Shop / Website</label>' +
            '<div class="arqr-offer-in">' + ICON_LINK + '<input id="arqr-t-shop" type="text" autocomplete="url" placeholder="e.g. www.yourstore.com"></div></div>' +
          '<div class="arqr-offer-field"><label>Contact Number</label>' +
            '<div class="arqr-offer-in">' + ICON_PHONE + '<input id="arqr-t-phone" type="tel" autocomplete="tel" placeholder="e.g. +1 555 123 4567"></div></div>' +
          '<div class="arqr-offer-field full"><label>Additional Message (Optional)</label>' +
            '<textarea id="arqr-t-msg" placeholder="Tell us anything about your product, such as dimensions, materials, or special instructions..."></textarea></div>' +
        '</div>' +
        '<input type="text" id="arqr-t-hp" name="website2" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0" aria-hidden="true">' +
        '<p class="arqr-offer-err" id="arqr-t-err"></p>' +
        '<button id="arqr-offer-submit" type="button">' + ICON_SEND + '<span>Send &amp; Get My Free Product</span><span aria-hidden="true">&rarr;</span></button>' +
        '<p class="arqr-offer-fine">One free product per store.</p>' +
        '<div class="arqr-offer-steps">' +
          '<div class="arqr-offer-step"><div class="arqr-offer-ico">' + ICON_LINK + '</div><div><b>1. Send a link</b><span>Paste one product link, or upload photos</span></div></div>' +
          '<div class="arqr-offer-step"><div class="arqr-offer-ico">' + ICON_TICKET + '</div><div><b>2. Get a Ticket</b><span>Receive your ticket number instantly</span></div></div>' +
          '<div class="arqr-offer-step"><div class="arqr-offer-ico">' + ICON_MAIL + '</div><div><b>3. Check Email</b><span>We will confirm and start your free AR product</span></div></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(veil);

  var closeBtn = veil.querySelector('#arqr-offer-close');
  var errBox = veil.querySelector('#arqr-t-err');
  var submitBtn = veil.querySelector('#arqr-offer-submit');
  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  var activeSlot = 0;
  document.body.appendChild(fileInput);
  fileInput.style.display = 'none';

  function showErr(msg){
    errBox.textContent = msg;
    errBox.style.display = 'block';
  }
  function clearErr(){
    errBox.textContent = '';
    errBox.style.display = 'none';
  }

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

  closeBtn.addEventListener('click', function(){ hide('arqr_offer_dismiss'); });
  veil.addEventListener('click', function(e){ if (e.target === veil) hide('arqr_offer_dismiss'); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && veil.classList.contains('open')) hide('arqr_offer_dismiss');
  });

  /* ---- photo slots ---- */
  function openPicker(slot){
    activeSlot = slot;
    fileInput.value = '';
    fileInput.click();
  }
  veil.querySelectorAll('.arqr-offer-slot').forEach(function(slotEl){
    var idx = parseInt(slotEl.getAttribute('data-slot'), 10);
    slotEl.addEventListener('click', function(e){
      if (e.target.classList.contains('rm')) return;
      openPicker(idx);
    });
    slotEl.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(idx); }
    });
    slotEl.querySelector('.rm').addEventListener('click', function(e){
      e.stopPropagation();
      photos[idx] = null;
      renderSlot(slotEl, idx);
    });
  });
  function renderSlot(slotEl, idx){
    var old = slotEl.querySelector('img');
    if (old) old.remove();
    if (photos[idx]) {
      var img = document.createElement('img');
      img.src = photos[idx];
      img.alt = 'Product photo ' + (idx + 1);
      slotEl.insertBefore(img, slotEl.firstChild);
      slotEl.classList.add('filled');
    } else {
      slotEl.classList.remove('filled');
    }
  }
  fileInput.addEventListener('change', function(){
    var f = fileInput.files && fileInput.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) { showErr('That file is not an image. Please pick a photo.'); return; }
    var url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function(){
      URL.revokeObjectURL(url);
      var scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      var w = Math.max(1, Math.round(img.width * scale));
      var h = Math.max(1, Math.round(img.height * scale));
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      photos[activeSlot] = cv.toDataURL('image/jpeg', 0.82);
      var slotEl = veil.querySelector('.arqr-offer-slot[data-slot="' + activeSlot + '"]');
      renderSlot(slotEl, activeSlot);
      clearErr();
    };
    img.onerror = function(){ showErr('Could not read that photo. Please try another.'); };
    img.src = url;
  });

  /* ---- submit ---- */
  function val(id){ var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  var looksLikeEmail = function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };

  submitBtn.addEventListener('click', function(){
    clearErr();
    /* honeypot: bots fill it, humans never see it */
    if (val('arqr-t-hp')) { hide(); return; }
    var name = val('arqr-t-name');
    var email = val('arqr-t-email');
    var plink = val('arqr-t-plink');
    var havePhoto = photos.some(function(p){ return !!p; });
    var looksLikeLink = /(https?:\/\/|www\.)\S+\.\S+/.test(plink);
    if (!havePhoto && !looksLikeLink) { showErr('Please paste a product link, or add at least one photo of your product.'); return; }
    if (!name) { showErr('Please tell us your name.'); return; }
    if (!looksLikeEmail(email)) { showErr('Please enter a valid email address.'); return; }

    var files = [];
    var total = 0;
    photos.forEach(function(p, i){
      if (!p) return;
      var b64 = p.split(',')[1] || '';
      total += Math.ceil(b64.length * 3 / 4);
      files.push({ name: 'product-photo-' + (i + 1) + '.jpg', data: b64 });
    });
    if (total > MAX_TOTAL) {
      showErr('Those photos are larger than 3MB together. Please use fewer or smaller photos.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Sending...';
    track('arqr_ticket_submit');

    fetch('/api/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        shop: val('arqr-t-shop'),
        phone: val('arqr-t-phone'),
        message: val('arqr-t-msg') + (looksLikeLink ? '\n\nProduct link: ' + plink : ''),
        productLink: looksLikeLink ? plink : '',
        files: files
      })
    }).then(function(r){ return r.json().then(function(j){ return { status: r.status, body: j }; }); })
    .then(function(res){
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Send & Get My Free Product';
      if (!res.body || !res.body.ok) {
        showErr((res.body && res.body.error) || 'That did not send. Please try again.');
        return;
      }
      track('arqr_ticket_done');
      try { sessionStorage.setItem('arqr-converted', '1'); } catch (e) {}
      var wrap = document.getElementById('arqr-offer-form-wrap');
      wrap.innerHTML =
        '<div class="arqr-offer-done">' +
          '<div class="tick">' + ICON_CHECK + '</div>' +
          '<h3>You are booked in.</h3>' +
          '<div class="ticket">' + esc(res.body.ticket) + '</div>' +
          '<p>We have ' + (looksLikeLink ? 'your product link' : 'your photos') + '. Check <b>' + esc(email) + '</b> for your ticket confirmation, we will start building your free AR product right away.</p>' +
          '<p style="margin-top:14px"><button id="arqr-offer-submit" type="button" style="max-width:280px;margin:0 auto"><span>Done</span></button></p>' +
        '</div>';
      wrap.querySelector('#arqr-offer-submit').addEventListener('click', function(){ hide('arqr_offer_ticket_done'); });
    })
    .catch(function(){
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Send & Get My Free Product';
      showErr('Something went wrong sending that. Please check your connection and try again.');
    });
  });

  /* ---- preview mode: ?offer=preview opens the popup directly.
     Handy for checking the design without faking an exit. ---- */
  try {
    if (/(?:\?|&)offer=preview(?:&|$)/.test(location.search)) {
      veil.classList.add('open');
      track('arqr_offer_preview');
    }
  } catch (e) {}

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
