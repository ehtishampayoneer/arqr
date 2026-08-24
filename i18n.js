/* ==================================================================
   Language switching for the whole site.

   How it runs
     1. This file loads in <head>. It works out which language to use
        (a stored choice, otherwise the browser's own), and pulls that
        language's strings in synchronously with document.write, so the
        translation is in memory before the body is parsed.
     2. ARQR_I18N.apply() is called at the end of the body, BEFORE the
        page's own script. That matters: index.html chops its headlines
        into per-word spans for the rise animation, and it has to do
        that to the translated words, not the English ones.
     3. Changing language stores the choice and reloads. Simpler than
        unpicking every animation that has already run, and a reload is
        what people expect from a language switch anyway.

   Translations are keyed by the English source, exactly as it appears
   in the markup, inline tags and all — so <em> inside a headline stays
   in the key and the translation puts it wherever that language wants
   it, rather than translating three fragments in English word order.
   ================================================================== */
(function () {
  'use strict';

  var KEY = 'arqr-lang';

  /* Latin and Cyrillic are already covered by Inter and Archivo. The
     other four scripts need a face that actually contains them. */
  var LANGS = [
    { c:'en', name:'English',    dir:'ltr' },
    { c:'ar', name:'العربية',     dir:'rtl', font:'Noto Sans Arabic',   stack:'"Noto Sans Arabic"' },
    { c:'ur', name:'اردو',        dir:'rtl', font:'Noto Nastaliq Urdu', stack:'"Noto Nastaliq Urdu"', lh:2.05 },
    { c:'zh', name:'简体中文',     dir:'ltr', font:'Noto Sans SC',       stack:'"Noto Sans SC"' },
    { c:'ja', name:'日本語',       dir:'ltr', font:'Noto Sans JP',       stack:'"Noto Sans JP"' },
    { c:'ru', name:'Русский',    dir:'ltr' },
    { c:'uz', name:'Oʻzbekcha',  dir:'ltr' },
    { c:'tr', name:'Türkçe',     dir:'ltr' },
    { c:'es', name:'Español',    dir:'ltr' },
    { c:'fr', name:'Français',   dir:'ltr' },
    { c:'de', name:'Deutsch',    dir:'ltr' },
    { c:'it', name:'Italiano',   dir:'ltr' },
    { c:'pt', name:'Português',  dir:'ltr' }
  ];

  function find(code){
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].c === code) return LANGS[i];
    return null;
  }

  /* the browser's preference, but only if we actually speak it */
  function detect(){
    var list = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++){
      var base = String(list[i]).toLowerCase().split('-')[0];
      if (base === 'zh') return 'zh';
      if (find(base)) return base;
    }
    return 'en';
  }

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  var code = find(stored) ? stored : detect();
  var lang = find(code) || LANGS[0];

  /* Pull the strings in before the body parses. document.write is the
     wrong tool almost everywhere, but it is the right one here: it is
     synchronous during parsing, which is exactly the ordering needed. */
  if (code !== 'en'){
    var v = (document.currentScript && document.currentScript.src.split('?v=')[1]) || '';
    document.write('<scr' + 'ipt src="lang/' + code + '.js' + (v ? '?v=' + v : '') + '"></scr' + 'ipt>');
  }

  /* ---------------------------------------------------------------- */

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function norm(s){ return String(s).replace(/\s+/g,' ').trim(); }

  function loadFont(l){
    if (!l.font) return;
    var href = 'https://fonts.googleapis.com/css2?family=' +
      l.font.replace(/ /g,'+') + ':wght@400;500;600;700;800&display=swap';
    var link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href;
    document.head.appendChild(link);

    var css = ':root{--f-head:' + l.stack + ',"Archivo",sans-serif;' +
                     '--f-body:' + l.stack + ',"Inter",sans-serif}';
    /* Nastaliq hangs well below the baseline, so the page's own
       line-heights crowd it. These are written as html[lang=..] so they
       outrank the scoped rules like .how h2 rather than tying with them. */
    if (l.lh){
      var sel = function (list, v){
        return list.split(',').map(function (x){
          return 'html[lang="' + l.c + '"] ' + x.trim();
        }).join(',') + '{line-height:' + v + '}';
      };
      css += sel('h1,h2,h3,.plan-name,.biz-name,.shop-name', l.lh - 0.35);
      css += sel('body,p,li,a,button,span,label,strong,small', l.lh);
    }
    style(css);
  }

  function style(css){
    var s = document.createElement('style');
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  /* The layout is written in left/right, not start/end. Rather than
     rewrite every rule, the handful that actually read as "wrong way
     round" in Arabic and Urdu are flipped here. */
  function rtlFixes(){
    style([
      '[dir="rtl"] .pill-tl{left:auto;right:18px}',
      '[dir="rtl"] .pill-br{right:auto;left:18px}',
      '[dir="rtl"] .carou-prev{left:auto;right:12px}',
      '[dir="rtl"] .carou-next{right:auto;left:12px}',
      '[dir="rtl"] .carou-prev svg{transform:scaleX(-1)}',
      '[dir="rtl"] .carou-next svg{transform:none}',
      '[dir="rtl"] .sol{border-left:0;border-right:1px solid var(--line);',
      '  padding-left:0;padding-right:clamp(20px,2.2vw,36px)}',
      '[dir="rtl"] .tag{left:auto;right:10px}',
      '[dir="rtl"] .steps4 li+li::before{left:50%;right:-50%}',
      '[dir="rtl"] .steps4 li+li::after{left:auto;right:calc(50% - 50px);',
      '  border-left:0;border-right:5px solid var(--sec-muted)}',
      '[dir="rtl"] .arw,[dir="rtl"] .plan-go svg,[dir="rtl"] .btn svg,',
      '[dir="rtl"] .qr-open svg,[dir="rtl"] .open svg,[dir="rtl"] .end-cta svg,',
      '[dir="rtl"] .foot-cta svg,[dir="rtl"] .back svg{transform:scaleX(-1)}',
      '[dir="rtl"] .cmp-hint svg:last-child{transform:none}',
      '[dir="rtl"] .cmp-hint svg:first-child{transform:scaleX(-1)}',
      /* the compare slider wipes from the left edge; in rtl it should
         wipe from the right, or the knob and the reveal disagree */
      '[dir="rtl"] .cmp-top{clip-path:inset(0 0 0 calc(100% - var(--split)))}',
      '[dir="rtl"] .lang-menu{right:auto;left:0}'
    ].join(''));
  }

  /* ---------------- applying the translation ---------------- */

  /* true when the element's only children are decoration — an icon or a
     line break — so its words can be swapped without losing structure */
  function iconOnly(el){
    var kids = el.children;
    for (var i = 0; i < kids.length; i++){
      var t = String(kids[i].tagName).toUpperCase();
      if (t === 'SVG' || t === 'BR' || t === 'IMG') continue;
      /* an empty element is decoration too — the colour swatch in the
         chart legend is an <i> with nothing in it */
      if (!kids[i].textContent.trim()) continue;
      return false;
    }
    return true;
  }

  function translate(T){
    if (!T) return;
    var text = T.t || {}, attrs = T.a || {};

    /* Elements are matched on their whole inner markup, so a headline
       with an <em> in it is one key, not three.

       Outermost first, deliberately. An <em> inside a headline is itself
       a phrase, and translating it first would leave the headline no
       longer matching its own English key. Translating the parent throws
       its old children away, and a detached node is skipped, so the
       biggest phrase that matches always wins. */
    var all = document.body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++){
      var el = all[i];
      if (!document.contains(el)) continue;
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      var key = norm(el.innerHTML);
      if (!key) continue;
      /* The length cap guards the whole-markup match only. A chip whose
         icon is a big piece of SVG blows past it, and skipping the
         element outright would rob it of the icon-label pass below —
         which is exactly what left one chip in English. */
      var short = key.length <= 400;
      if (short && Object.prototype.hasOwnProperty.call(text, key)){ el.innerHTML = text[key]; continue; }

      /* "Phone or WhatsApp <small>(optional)</small>" — the <small> is
         styling, not meaning, so match without it and put it back around
         whatever that language uses for the aside at the end. */
      if (short && key.indexOf('<small>') > -1){
        var bare = key.replace(/<\/?small>/g, '');
        if (Object.prototype.hasOwnProperty.call(text, bare)){
          /* Chinese and Japanese set the aside in full-width brackets */
          el.innerHTML = text[bare].replace(/([(（][^)）]*[)）])\s*$/, '<small>$1</small>');
          continue;
        }
      }

      /* Second chance: a label sitting next to an icon. Its inner markup
         carries the whole <svg>, which would make an unusable key, so
         match on the words alone and rewrite only the text around the
         icon — but only where every child IS an icon, so a block with
         real markup in it is never flattened. */
      if (!iconOnly(el)) continue;
      var words = norm(el.textContent);
      if (!words || !Object.prototype.hasOwnProperty.call(text, words)) continue;
      var placed = false, kids = el.childNodes;
      for (var k = 0; k < kids.length; k++){
        if (kids[k].nodeType !== 3 || !kids[k].nodeValue.trim()) continue;
        kids[k].nodeValue = placed ? '' : ' ' + text[words] + ' ';
        placed = true;
      }
    }

    /* things people read but that are not element content */
    ['placeholder','aria-label','alt','title','content'].forEach(function(a){
      var nodes = document.querySelectorAll('[' + a + ']');
      for (var i = 0; i < nodes.length; i++){
        var val = norm(nodes[i].getAttribute(a));
        if (Object.prototype.hasOwnProperty.call(attrs, val)) nodes[i].setAttribute(a, attrs[val]);
      }
    });

    if (T.title) document.title = T.title;
  }

  /* A picture with English baked into it stays English unless a
     translated version of that file exists. Each one is probed off to
     the side and only swapped in once it has actually loaded, so a
     missing file costs nothing and changes nothing. */
  function localiseImages(code){
    var imgs = document.querySelectorAll('img[src*="assets/"]');
    for (var i = 0; i < imgs.length; i++){
      (function(img){
        var src = img.getAttribute('src');
        if (!/\.(webp|png|jpg|svg)/.test(src)) return;
        if (src.indexOf('qr-') > -1) return;               /* codes are language-free */
        var alt = src.replace(/\.(webp|png|jpg|svg)/, '.' + code + '.$1');
        var probe = new Image();
        probe.onload = function(){ img.src = alt; };
        probe.src = alt;
      })(imgs[i]);
    }
  }

  /* ---------------- the switcher ---------------- */

  function globe(){
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/>' +
      '<path d="M3.2 9.5h17.6M3.2 14.5h17.6" stroke="currentColor" stroke-width="1.7"/>' +
      '<path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" stroke="currentColor" stroke-width="1.7"/>' +
      '</svg>';
  }

  function build(){
    var host = document.querySelector('[data-lang-slot]') ||
               document.querySelector('header.bar') ||
               document.querySelector('.shop-in') ||
               document.querySelector('.demo-in');
    if (!host) return;

    style([
      '.lang{position:relative;flex:none;margin-inline-start:auto}',
      'header.bar .lang,.shop-in .lang{margin-inline-start:12px}',
      '.shop-in .lang{margin-inline-start:auto}',
      '.lang-btn{display:inline-flex;align-items:center;gap:7px;cursor:pointer;',
      '  background:transparent;border:1px solid var(--line,#E4DED4);border-radius:100px;',
      '  padding:8px 13px;font:inherit;font-size:13.5px;font-weight:600;',
      '  color:inherit;line-height:1;transition:border-color .2s,background .2s}',
      '.lang-btn:hover{border-color:#B9AE9C}',
      '.lang-btn svg{width:17px;height:17px;display:block;flex:none;opacity:.8}',
      '.lang-menu{position:absolute;top:calc(100% + 10px);right:0;z-index:60;',
      '  min-width:190px;max-height:min(70vh,420px);overflow-y:auto;',
      '  background:#FFFDFA;border:1px solid var(--line,#E4DED4);border-radius:14px;',
      '  padding:6px;display:none;',
      '  box-shadow:0 26px 50px -22px rgba(40,30,20,.5)}',
      '.lang.open .lang-menu{display:block}',
      '.lang-menu button{display:flex;align-items:center;justify-content:space-between;',
      '  gap:10px;width:100%;cursor:pointer;background:none;border:0;border-radius:9px;',
      '  padding:9px 11px;font:inherit;font-size:14px;color:#191919;text-align:start;',
      '  transition:background .16s}',
      '.lang-menu button:hover{background:#F4EFE5}',
      '.lang-menu button[aria-current="true"]{background:#F4EFE5;font-weight:600}',
      '.lang-menu button i{font-style:normal;font-size:11px;letter-spacing:.1em;',
      '  text-transform:uppercase;color:#8A8378}',
      '@media(max-width:700px){',
      '  .lang-btn{padding:7px 10px;font-size:0;gap:0}',
      '  .lang-btn svg{width:19px;height:19px;opacity:.9}',
      '  .lang-menu{min-width:172px}',
      '}'
    ].join(''));

    var wrap = document.createElement('div');
    wrap.className = 'lang';
    wrap.innerHTML =
      '<button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false">' +
        globe() + '<span>' + esc(lang.name) + '</span>' +
      '</button>' +
      '<div class="lang-menu" role="menu">' +
        LANGS.map(function(l){
          return '<button type="button" role="menuitem" data-c="' + l.c + '" aria-current="' +
                 (l.c === code) + '" lang="' + l.c + '"' +
                 (l.dir === 'rtl' ? ' dir="rtl"' : '') + '>' +
                 '<span>' + esc(l.name) + '</span><i>' + l.c + '</i></button>';
        }).join('') +
      '</div>';

    /* index.html keeps its own call-to-action last in the bar; sit before it */
    var cta = host.querySelector('.cta') || host.querySelector('.back');
    if (cta && cta.parentNode === host) host.insertBefore(wrap, cta);
    else host.appendChild(wrap);

    var btn = wrap.querySelector('.lang-btn');
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var on = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(on));
    });
    document.addEventListener('click', function(){ wrap.classList.remove('open'); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') wrap.classList.remove('open');
    });
    wrap.querySelectorAll('.lang-menu button').forEach(function(b){
      b.addEventListener('click', function(){
        var c = b.dataset.c;
        try { localStorage.setItem(KEY, c); } catch (e) {}
        location.reload();
      });
    });
  }

  window.ARQR_I18N = {
    code: code,
    langs: LANGS,

    /* Translate one plain string. The sampler and the shop pages build
       their markup from stores.js and rebuild it whenever a category is
       tapped, so they translate the data on the way in rather than
       chasing the DOM afterwards. */
    s: function (str){
      var T = window.ARQR_LANG;
      if (!T || !T.t) return str;
      var hit = T.t[norm(str)];
      return hit === undefined ? str : hit;
    },

    apply: function(){
      document.documentElement.lang = code;
      document.documentElement.dir = lang.dir;
      if (lang.dir === 'rtl') rtlFixes();
      if (code !== 'en'){
        loadFont(lang);
        translate(window.ARQR_LANG);
        localiseImages(code);
      }
      build();
    }
  };
})();
