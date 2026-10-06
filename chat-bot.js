/* ARQR360 website chat bot "Ari".
   Scroll/time-triggered panel. Talks through /api/chat (Gemini-powered,
   human-style answers); if the AI is ever down it falls back to the
   built-in rule-based answers below, so the chat never goes silent.
   Free-model signup flow posts to /api/ticket (same as the exit offer).
   Human callback requests go to /api/contact. Speaks as "we", never "I". */
(function () {
  if (window.__arqrChatInit) return;
  window.__arqrChatInit = true;

  var MAX_TOTAL = 3 * 1024 * 1024;

  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function track(name) { try { if (window.va) window.va('event', { name: name }); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function converted() { return ssGet('arqr-converted') === '1'; }

  /* ---------- knowledge base ---------- */
  var INTENTS = [
    { keys: ['who are you', 'your name', 'what are you'],
      reply: 'I am Ari, the ARQR360 helper. I can answer questions about what we do, or get you your first AR model free. What sounds good?' },
    { keys: ['free model', 'free sample', 'free trial', 'try it', 'yes please', 'sign me up', 'i want', 'interested', 'let us try', "let's try", 'get started', 'start'],
      reply: null, action: 'startLead',
      chips: ['Not now'] },
    { keys: ['how does it work', 'how it works', 'how do you', 'process', 'steps', 'explain'],
      reply: 'Simple. 1: you send us photos of your product. 2: we build an exact true-to-size AR (Augmented Reality) view. 3: your shoppers point their phone at their room and see it life-size before buying. Fewer returns, faster yeses. Want your first one free?',
      chips: ['Yes, free model please', 'How much?'] },
    { keys: ['price', 'pricing', 'cost', 'how much', 'plan', 'subscription', 'monthly', 'fee', 'charge'],
      reply: 'Our starter plan is $249 one-time for your first 10 products, then $29 a month. And your very first product model is free, no card needed. Want us to build it?',
      chips: ['Yes, free model please', 'How does it work?'] },
    { keys: ['how long', 'timeline', 'when will', 'delivery', 'fast', 'ready'],
      reply: 'Your free model is usually ready in a day or two. We email you the moment it is live, with a link you can open on any phone.',
      chips: ['Yes, free model please'] },
    { keys: ['photo', 'picture', 'image', 'what do you need', 'requirements', 'send you'],
      reply: '1 to 4 clear photos work: front, back, and sides on a plain background. Phone photos are fine. If you have the listed dimensions, send those too and we match them exactly.',
      chips: ['Yes, free model please'] },
    { keys: ['accurate', 'true to size', 'true-to-size', 'size', 'dimensions', 'measurement', 'scale'],
      reply: 'That is the whole point. We build every model to your exact listed dimensions, so what your shopper sees in their room is the real size, not a guess.',
      chips: ['Yes, free model please'] },
    { keys: ['augmented reality', 'what is ar', '3d', 'app needed', 'need an app', 'iphone', 'android', 'phone'],
      reply: 'No app needed. It runs right in the phone browser. iPhone uses AR Quick Look, Android uses Scene Viewer. Your customer taps, points at their floor, and sees your product life-size.',
      chips: ['How does it work?'] },
    { keys: ['return', 'refund'],
      reply: 'That is the big one. Most returns happen because the size surprised people. When shoppers see it true-to-size in their own room first, the guesswork goes away.',
      chips: ['Yes, free model please'] },
    { keys: ['furniture', 'rug', 'carpet', 'decor', 'shoe', 'footwear', 'boot', 'sneaker', 'store', 'shop', 'sell', 'products', 'category', 'categories'],
      reply: 'We work with furniture, rugs, decor, and footwear stores. If you sell one of those, we can build it. Your first model is free, want to try?',
      chips: ['Yes, free model please'] },
    { keys: ['shopify', 'woocommerce', 'website', 'embed', 'integrate', 'my site'],
      reply: 'It works with any online store. We give you a link and an embed snippet for your product pages, and it just works on phones. No coding needed on your side.',
      chips: ['Yes, free model please'] },
    { keys: ['human', 'real person', 'someone', 'call', 'phone number', 'talk to', 'contact', 'support', 'help me'],
      reply: null, action: 'human',
      chips: ['Not now'] },
    { keys: ['thank', 'thanks', 'great', 'awesome', 'cool', 'nice'],
      reply: 'Anytime! If you want that free model, just say the word.',
      chips: ['Yes, free model please'] },
    { keys: ['bye', 'goodbye', 'see you'],
      reply: 'Bye! The free model offer stands whenever you are ready. Just open this chat again.' }
  ];
  var FALLBACK = 'Good question. I want to give you the right answer, not a guess. Leave your email here and one of the team will reply personally, usually the same day.';

  /* ---------- DOM ---------- */
  var CHAT_SVG = '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-9 9H7V9h4zm6 0h-4V9h4z"/></svg>';
  var SEND_SVG = '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>';
  var CLIP_SVG = '<svg viewBox="0 0 24 24"><path d="M16.5 6v11.5a4.5 4.5 0 0 1-9 0V6a3 3 0 0 1 6 0v9.5a1.5 1.5 0 0 1-3 0V7H9v8.5a3 3 0 0 0 6 0V6a4.5 4.5 0 0 0-9 0v11.5a6 6 0 0 0 12 0V6z"/></svg>';

  var launcher = document.createElement('button');
  launcher.id = 'arqr-chat-launcher';
  launcher.setAttribute('aria-label', 'Chat with us');
  launcher.innerHTML = CHAT_SVG + '<span class="arqr-chat-badge"></span>';

  var panel = document.createElement('div');
  panel.id = 'arqr-chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat with ARQR360');
  panel.innerHTML =
    '<div class="arqr-chat-head">' +
      '<div class="arqr-chat-avatar">A</div>' +
      '<div class="arqr-chat-who"><b>Ari from ARQR360</b><span><span class="dot"></span>Online, replies instantly</span></div>' +
      '<button class="arqr-chat-close" aria-label="Close chat">&times;</button>' +
    '</div>' +
    '<div id="arqr-chat-msgs"></div>' +
    '<div id="arqr-chat-chips"></div>' +
    '<div class="arqr-chat-inputrow">' +
      '<input type="file" id="arqr-chat-file" accept="image/*" multiple>' +
      '<button class="arqr-chat-iconbtn" id="arqr-chat-attach" aria-label="Send product photos">' + CLIP_SVG + '</button>' +
      '<input id="arqr-chat-input" type="text" placeholder="Type your message..." autocomplete="off" maxlength="500">' +
      '<button class="arqr-chat-iconbtn" id="arqr-chat-send" aria-label="Send">' + SEND_SVG + '</button>' +
    '</div>' +
    '<div class="arqr-chat-powered">We usually reply in seconds</div>';

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  var msgs = panel.querySelector('#arqr-chat-msgs');
  var chipsBox = panel.querySelector('#arqr-chat-chips');
  var input = panel.querySelector('#arqr-chat-input');
  var sendBtn = panel.querySelector('#arqr-chat-send');
  var attachBtn = panel.querySelector('#arqr-chat-attach');
  var fileInput = panel.querySelector('#arqr-chat-file');
  var closeBtn = panel.querySelector('.arqr-chat-close');

  var opened = false, greeted = false;
  var flow = null;              // null | 'name' | 'email' | 'shop' | 'photo' | 'humanEmail'
  var lead = { name: '', email: '', shop: '' };
  var aiMode = true;            // use /api/chat until it fails, then legacy rules
  var leadCaptured = false;     // true once the AI emitted a valid [LEAD:...]
  var hist = [];                // last exchanges sent to the AI
  var photos = [];              // dataURLs
  var humanContext = '';

  function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }

  function addMsg(text, who, html) {
    var d = document.createElement('div');
    d.className = 'arqr-msg ' + who;
    if (html) d.innerHTML = text; else d.textContent = text;
    msgs.appendChild(d);
    scrollBottom();
    return d;
  }

  function botSay(text, chips, delay) {
    chips = chips || [];
    var t = document.createElement('div');
    t.className = 'arqr-msg bot arqr-typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    msgs.appendChild(t);
    scrollBottom();
    var wait = delay != null ? delay : Math.min(700 + text.length * 12, 2200);
    setTimeout(function () {
      t.classList.remove('arqr-typing');
      t.innerHTML = '';
      t.textContent = text;
      scrollBottom();
      setChips(chips);
    }, wait);
  }

  function ticketCard(ticket, email) {
    var d = document.createElement('div');
    d.className = 'arqr-msg ticket';
    d.innerHTML = '<span>You are booked in! Your ticket is</span><b>' + esc(ticket) + '</b>' +
      '<span>We will email <b>' + esc(email) + '</b> when your free AR model is ready.</span>';
    msgs.appendChild(d);
    scrollBottom();
  }

  function setChips(list) {
    chipsBox.innerHTML = '';
    (list || []).forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'arqr-chip';
      b.type = 'button';
      b.textContent = c;
      b.addEventListener('click', function () { handleUser(c); });
      chipsBox.appendChild(b);
    });
  }

  /* ---------- brain ---------- */
  function matchIntent(text) {
    var t = ' ' + text.toLowerCase() + ' ';
    var best = null, bestScore = 0;
    INTENTS.forEach(function (it) {
      var s = 0;
      it.keys.forEach(function (k) { if (t.indexOf(k) !== -1) s += k.length; });
      if (s > bestScore) { bestScore = s; best = it; }
    });
    return bestScore > 0 ? best : null;
  }

  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

  function greet() {
    greeted = true;
    if (converted()) {
      botSay('Hey, welcome back! Questions about ARQR360 or your free model? Ask me anything.',
        ['How does it work?', 'How much?', 'Talk to a human']);
    } else {
      botSay('Hey! Quick question: want us to turn your bestselling product into a true-to-size AR model, free? No card, no commitment.',
        ['Yes, free model please', 'How does it work?', 'How much?']);
    }
  }

  function startLead() {
    flow = 'name';
    lead = { name: '', email: '', shop: '' };
    photos = [];
    botSay('Love it. Takes about a minute. What should we call you?', []);
  }

  function startHuman(context) {
    flow = 'humanEmail';
    humanContext = context || '';
    botSay('You got it. What is your email? One of the team will reply personally, usually the same day.', []);
  }

  function submitTicket() {
    if (!isEmail(lead.email)) {
      flow = 'email';
      botSay('Almost there. Where should we send your finished AR model?', []);
      return;
    }
    var files = [];
    var total = 0;
    photos.forEach(function (p, i) {
      var b64 = (p.split(',')[1] || '');
      total += Math.ceil(b64.length * 3 / 4);
      files.push({ name: 'product-photo-' + (i + 1) + '.jpg', data: b64 });
    });
    if (!files.length) {
      botSay('Looks like no photos came through. Tap the paperclip and pick at least one photo of your product, or tap "Skip for now" and we will email you for it.', ['Skip for now']);
      flow = 'photo';
      return;
    }
    if (total > MAX_TOTAL) {
      photos = [];
      botSay('Those photos are bigger than 3MB together. Please pick fewer or smaller ones.', ['Skip for now']);
      flow = 'photo';
      return;
    }
    sendBtn.disabled = true;
    botSay('Sending that in now...', []);
    fetch('/api/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: lead.name, email: lead.email, shop: lead.shop,
        phone: '', message: 'Signed up via website chat bot (Ari).',
        files: files
      })
    }).then(function (r) { return r.json().then(function (j) { return { s: r.status, b: j }; }); })
    .then(function (res) {
      sendBtn.disabled = false;
      flow = null;
      if (!res.b || !res.b.ok) {
        botSay('Hmm, that did not send: ' + ((res.b && res.b.error) || 'please try again.') + ' Or leave your email and we will sort it out.', []);
        return;
      }
      ssSet('arqr-converted', '1');
      track('arqr_chat_ticket_done');
      ticketCard(res.b.ticket, lead.email);
      setTimeout(function () {
        botSay('Anything else you want to know about ARQR360 while you are here?',
          ['How does it work?', 'How much?']);
      }, 1200);
    })
    .catch(function () {
      sendBtn.disabled = false;
      flow = null;
      botSay('The connection dropped. Please try again in a moment, your details are still here.', []);
    });
  }

  function submitHumanCallback() {
    sendBtn.disabled = true;
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: lead.name || 'Website chat visitor', email: lead.email,
        phone: '', website: '', message: 'Chat visitor asked to talk to a human.' + (humanContext ? ' They were asking about: ' + humanContext : '')
      })
    }).then(function (r) { return r.json(); })
    .then(function (j) {
      sendBtn.disabled = false;
      flow = null;
      if (j && j.ok) {
        botSay('Done. One of the team will email you at ' + lead.email + ' personally, usually the same day.', ['Yes, free model please']);
      } else {
        botSay('Noted. Email us anytime at info@arqr360.com and we will pick it right up.', ['Yes, free model please']);
      }
    })
    .catch(function () {
      sendBtn.disabled = false;
      flow = null;
      botSay('Noted. Email us anytime at info@arqr360.com and we will pick it right up.', ['Yes, free model please']);
    });
  }

  /* ---------- AI brain (/api/chat) with rule fallback ---------- */
  function aiTurn(userText) {
    hist.push({ role: 'user', text: String(userText).slice(0, 2000) });
    while (hist.length > 20) hist.shift();
    var ctrl = null, to = null;
    try {
      ctrl = new AbortController();
      to = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 25000);
    } catch (e) {}
    var opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: hist })
    };
    if (ctrl) opts.signal = ctrl.signal;
    fetch('/api/chat', opts)
      .then(function (r) {
        if (to) clearTimeout(to);
        return r.json().then(function (j) { return { s: r.status, b: j }; });
      })
      .then(function (res) {
        if (!res.b || !res.b.reply) throw new Error('no_reply');
        var reply = String(res.b.reply);
        var leadM = reply.match(/\[LEAD:([^\]]+)\]/);
        var humanM = /\[HUMAN\]/.test(reply);
        reply = reply.replace(/\[LEAD:[^\]]+\]/, '').replace(/\[HUMAN\]/g, '').trim();
        if (leadM) {
          var parts = leadM[1].split('|');
          var cand = {
            name: (parts[0] || '').trim().slice(0, 60),
            email: (parts[1] || '').trim().slice(0, 120),
            shop: (parts[2] || '').trim().slice(0, 120)
          };
          if (cand.name && isEmail(cand.email) && cand.shop) {
            lead = cand;
            leadCaptured = true;
          }
        }
        hist.push({ role: 'assistant', text: reply.slice(0, 2000) });
        if (leadCaptured && leadM) {
          if (reply) botSay(reply, []);
          setTimeout(function () {
            if (photos.length) { submitTicket(); return; }
            flow = 'photo';
            botSay('Last step: send 1 to 4 photos of the product (phone photos are fine). Tap the paperclip below.',
              ['Send photos', 'Skip for now']);
          }, reply ? 1000 : 100);
        } else if (humanM) {
          startHuman('');
        } else {
          botSay(reply, []);
        }
      })
      .catch(function () {
        if (to) clearTimeout(to);
        aiMode = false;          /* AI down: legacy rules take over from here */
        legacyBrain(userText);
      });
  }

  /* legacy rule-based brain: used when /api/chat is unreachable */
  function legacyBrain(text) {
    var low = text.toLowerCase();

    /* lead flow has priority */
    if (flow === 'name') {
      lead.name = text.slice(0, 60);
      flow = 'email';
      botSay('Nice to meet you, ' + lead.name + '. Where should we send your finished AR model?', []);
      return;
    }
    if (flow === 'email') {
      if (!isEmail(text)) {
        botSay('That email does not look complete. What is the right address?', []);
        return;
      }
      lead.email = text;
      flow = 'shop';
      botSay('Got it. What is your shop or brand name?', []);
      return;
    }
    if (flow === 'shop') {
      lead.shop = text.slice(0, 120);
      if (photos.length) { flow = null; submitTicket(); return; }
      flow = 'photo';
      botSay('Last step: send 1 to 4 photos of the product (phone photos are fine). Tap the paperclip below.',
        ['Skip for now']);
      return;
    }

    /* brain */
    var it = matchIntent(text);
    if (it && it.action === 'startLead') { startLead(); return; }
    if (it && it.action === 'human') { startHuman(text); return; }
    if (it && it.reply) { botSay(it.reply, it.chips || []); return; }
    if (isEmail(text)) { lead.email = text; humanContext = ''; submitHumanCallback(); return; }
    botSay(FALLBACK, []);
    flow = 'humanEmail';
  }

  /* ---------- main handler ---------- */
  function handleUser(raw) {
    var text = String(raw || '').trim();
    if (!text) return;
    addMsg(text, 'user');
    setChips([]);
    var low = text.toLowerCase();

    if (/^(cancel|stop|never mind|nevermind)$/.test(low)) {
      flow = null;
      leadCaptured = false;
      botSay('No problem. I am here if you change your mind.', ['How does it work?', 'How much?']);
      return;
    }

    /* structured states keep priority in both modes */
    if (flow === 'photo') {
      if (/^send photos$/i.test(text) && photos.length) { submitTicket(); return; }
      if (/skip/.test(low)) {
        flow = null;
        botSay('No worries, we will email you for the photos. One moment...', []);
        submitTicketSkip();
        return;
      }
      botSay('Tap the paperclip below to attach your product photos, then tap "Send photos".', ['Skip for now', 'Send photos']);
      return;
    }
    if (flow === 'humanEmail') {
      if (!isEmail(text)) {
        botSay('That email does not look complete. What is the right address?', []);
        return;
      }
      lead.email = text;
      submitHumanCallback();
      return;
    }

    if (aiMode) { aiTurn(text); return; }
    legacyBrain(text);
  }

  function submitTicketSkip() {
    /* user skipped photos: create the ticket via contact so nothing is lost */
    sendBtn.disabled = true;
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: lead.name, email: lead.email, phone: '', website: lead.shop,
        message: 'Signed up for the free AR model via website chat bot (Ari). No photos attached yet, please email them for product photos. Shop: ' + lead.shop
      })
    }).then(function (r) { return r.json(); }).then(function (j) {
      sendBtn.disabled = false;
      flow = null;
      ssSet('arqr-converted', '1');
      track('arqr_chat_ticket_done');
      if (j && j.ok && j.ticket) ticketCard(j.ticket, lead.email);
      else addMsg('You are on the list! We will email ' + lead.email + ' for your product photos.', 'bot');
      setTimeout(function () {
        botSay('Anything else you want to know about ARQR360?', ['How does it work?', 'How much?']);
      }, 1200);
    }).catch(function () {
      sendBtn.disabled = false;
      flow = null;
      botSay('The connection dropped, but we have your details. We will email you at ' + lead.email + '.', []);
    });
  }

  /* ---------- photo attach ---------- */
  attachBtn.addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    var files = Array.prototype.slice.call(fileInput.files || []).slice(0, 4 - photos.length);
    if (!files.length && photos.length >= 4) { botSay('That is already 4 photos, plenty. Tap "Send photos" when ready.', ['Send photos']); return; }
    var pending = files.length;
    if (!pending) return;
    files.forEach(function (f) {
      var rd = new FileReader();
      rd.onload = function () {
        photos.push(String(rd.result));
        addMsg('Photo ' + photos.length + ' attached (' + f.name + ')', 'user');
        if (--pending === 0) {
          if (leadCaptured || !aiMode) {
            flow = 'photo';
            botSay(photos.length >= 4 ? 'Got all 4. Tap "Send photos" and we will start building.' : 'Got it. Add more or tap "Send photos" when ready.',
              ['Send photos', 'Skip for now']);
          } else {
            /* AI mode, details not collected yet: let Ari react naturally */
            setChips([]);
            aiTurn('[System note: the visitor just attached ' + photos.length + ' product photo(s). Acknowledge briefly and keep the conversation going.]');
          }
        }
      };
      rd.readAsDataURL(f);
    });
    fileInput.value = '';
  });

  /* ---------- input wiring ---------- */
  function sendInput() {
    var v = input.value;
    input.value = '';
    if (/^send photos$/i.test(v.trim()) && photos.length && (leadCaptured || !aiMode)) { addMsg(v.trim(), 'user'); setChips([]); submitTicket(); return; }
    handleUser(v);
  }
  sendBtn.addEventListener('click', sendInput);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendInput(); });

  function openPanel() {
    panel.classList.add('arqr-open');
    opened = true;
    launcher.querySelector('.arqr-chat-badge').style.display = 'none';
    track('arqr_chat_open');
    if (!greeted) greet();
    setTimeout(function () { input.focus(); }, 350);
  }
  function closePanel() {
    panel.classList.remove('arqr-open');
    opened = false;
  }
  launcher.addEventListener('click', function () {
    launcher.classList.remove('arqr-attention');
    if (opened) closePanel(); else openPanel();
  });
  closeBtn.addEventListener('click', closePanel);

  /* ---------- trigger: scroll 35% or 25s, once per session ---------- */
  function showLauncher() {
    if (launcher.classList.contains('arqr-show')) return;
    launcher.classList.add('arqr-show');
    ssSet('arqr-chat-seen', '1');
    setTimeout(function () {
      if (!opened) {
        launcher.classList.add('arqr-attention');
        openPanel();   /* proactive: ask about the free model, per founder */
      }
    }, 1200);
  }
  if (!ssGet('arqr-chat-seen')) {
    var scrolled = false;
    window.addEventListener('scroll', function () {
      if (scrolled) return;
      var h = document.documentElement;
      var pct = (h.scrollTop || document.body.scrollTop) / ((h.scrollHeight - h.clientHeight) || 1);
      if (pct > 0.35) { scrolled = true; track('arqr_chat_trigger_scroll'); showLauncher(); }
    }, { passive: true });
    setTimeout(function () { if (!scrolled) { track('arqr_chat_trigger_time'); showLauncher(); } }, 25000);
  } else {
    launcher.classList.add('arqr-show');
    launcher.querySelector('.arqr-chat-badge').style.display = 'none';
  }
})();
