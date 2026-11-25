/* Sales Engine translation: same language choice as the rest of arqr360.com
   (localStorage 'arqr-lang'), strings from saleengine/lang.js. */
(function () {
  var LANGS = [['en','English'],['ar','العربية'],['ur','اردو'],['zh','简体中文'],['ja','日本語'],['ru','Русский'],['uz','Oʻzbekcha'],['tr','Türkçe'],['es','Español'],['fr','Français'],['de','Deutsch'],['it','Italiano'],['pt','Português']];
  var KEY = 'arqr-lang';
  function known(c) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i][0] === c) return true; return false; }
  var code = null;
  try { code = localStorage.getItem(KEY); } catch (e) {}
  if (!known(code)) {
    code = 'en';
    var nl = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < nl.length; i++) { var b = String(nl[i]).toLowerCase().split('-')[0]; if (known(b)) { code = b; break; } }
  }
  var idx = (window.SE_LANG_ORDER || []).indexOf(code);
  var D = window.SE_LANG || {};
  var rtl = code === 'ar' || code === 'ur';
  if (code !== 'en') { document.documentElement.lang = code; if (rtl) document.documentElement.dir = 'rtl'; }

  function tr(s) {
    if (idx < 0) return null;
    var k = s.replace(/\s+/g, ' ').trim();
    var row = D[k];
    if (row) return row[idx] && row[idx] !== k ? row[idx] : null;
    var P = window.SE_PAT || [];
    for (var i = 0; i < P.length; i++) {
      var m = k.match(P[i][0]); if (!m) continue;
      var out = P[i][1][idx].replace(/\$(\d)/g, function (_, d) { var v = m[+d] || ''; return D[v] && D[v][idx] ? D[v][idx] : v; });
      return out !== k ? out : null;
    }
    return null;
  }
  window.SE_T = function (s) { return tr(s) || s; };

  function walk(root) {
    if (idx < 0 || !root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    var n = root.nodeType === 1 ? root : w.nextNode();
    for (; n; n = w.nextNode()) {
      if (n.nodeType === 3) {
        var t = n.nodeValue; if (!t || !t.trim()) continue;
        var x = tr(t);
        if (x) n.nodeValue = t.replace(t.trim(), x);
      } else {
        if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE') continue;
        ['placeholder', 'title', 'aria-label'].forEach(function (a) {
          var v = n.getAttribute && n.getAttribute(a); if (!v) return;
          var y = tr(v); if (y) n.setAttribute(a, y);
        });
      }
    }
  }

  function pill() {
    var top = document.querySelector('header.top'); if (!top || top.querySelector('.se-lang')) return;
    var name = LANGS.filter(function (l) { return l[0] === code; })[0][1];
    var wrap = document.createElement('div');
    wrap.className = 'se-lang';
    wrap.innerHTML = '<button type="button" class="se-lang-btn" aria-haspopup="true" aria-expanded="false" title="' + name + '">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>' +
      '<span>' + code.toUpperCase() + '</span></button><div class="se-lang-menu" role="menu">' +
      LANGS.map(function (l) { return '<button type="button" role="menuitem" data-c="' + l[0] + '"' + (l[0] === code ? ' class="on"' : '') + '>' + l[1] + '</button>'; }).join('') + '</div>';
    var av = top.querySelector('#avatar');
    if (av) top.insertBefore(wrap, av); else top.appendChild(wrap);
    var btn = wrap.querySelector('.se-lang-btn');
    btn.addEventListener('click', function (e) { e.stopPropagation(); var o = wrap.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
    document.addEventListener('click', function () { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
    wrap.querySelector('.se-lang-menu').addEventListener('click', function (e) {
      var c = e.target.getAttribute('data-c'); if (!c) return;
      try { localStorage.setItem(KEY, c); } catch (er) {}
      location.reload();
    });
  }

  var css = document.createElement('style');
  css.textContent = '.se-lang{position:relative;flex:none}' +
    '.se-lang-btn{display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 9px;border:1px solid var(--line,#e5ded3);border-radius:999px;background:#fff;color:var(--muted,#6b6257);font:600 11.5px/1 inherit;cursor:pointer}' +
    '.se-lang-btn:hover{color:var(--ink,#1d1a16)}' +
    '.se-lang-menu{display:none;position:absolute;top:38px;inset-inline-end:0;z-index:60;min-width:150px;padding:6px;background:#fff;border:1px solid var(--line,#e5ded3);border-radius:12px;box-shadow:0 18px 40px -18px rgba(0,0,0,.3)}' +
    '.se-lang.open .se-lang-menu{display:grid}' +
    '.se-lang-menu button{all:unset;cursor:pointer;padding:7px 10px;border-radius:8px;font-size:13px}' +
    '.se-lang-menu button:hover,.se-lang-menu button.on{background:#f4efe7}';
  document.head.appendChild(css);

  function start() {
    pill();
    walk(document.body);
    if (idx < 0) return;
    var busy = false;
    new MutationObserver(function (ms) {
      if (busy) return; busy = true;
      ms.forEach(function (m) {
        if (m.type === 'characterData') { var x = tr(m.target.nodeValue || ''); if (x) m.target.nodeValue = m.target.nodeValue.replace(m.target.nodeValue.trim(), x); }
        else m.addedNodes.forEach(function (n) { if (n.nodeType === 1) walk(n); else if (n.nodeType === 3) { var y = tr(n.nodeValue || ''); if (y) n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), y); } });
      });
      busy = false;
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
