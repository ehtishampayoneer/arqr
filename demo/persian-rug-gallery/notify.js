/* Lets us know when the person we sent a personal link to opens the preview.

   A personal link ends in ?v=<name>, e.g. https://arqr360.com/demo/persian-rug-gallery?v=sam
   The name is kept in that browser, so every page they open next counts too, once per visit:
     prg-sam-start, prg-sam-plans, prg-sam-afshar, prg-sam-sirjan, prg-sam-dashboard,
     prg-sam-ar-afshar (tapped "View in your room") ...
   Each goes through /api/px, which emails info@arqr360.com "Opened: <that id>".
   Without a ?v= link nothing is sent. ?v=off forgets the name on that browser (for testing).
   It runs only in a real browser, so link scanners that pre-fetch email links don't count. */
(function () {
  var KEY = 'arqr.prg.v';
  var v = '';
  try {
    var q = new URLSearchParams(location.search).get('v');
    if (q === 'off') { localStorage.removeItem(KEY); }
    else if (q) { v = q.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24); localStorage.setItem(KEY, v); }
    else { v = localStorage.getItem(KEY) || ''; }
  } catch (e) {}

  function send(what) {
    if (!v) return;
    var id = ('prg-' + v + '-' + what).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
    try {
      if (sessionStorage.getItem('arqr.px.' + id)) return;            // once per page per visit
      sessionStorage.setItem('arqr.px.' + id, '1');
    } catch (e) {}
    var img = new Image();
    img.src = '/api/px?id=' + encodeURIComponent(id) + '&t=' + Date.now();
  }

  window.ARQRNotify = send;
  var me = document.currentScript;
  var page = me && me.getAttribute('data-page');
  if (page) send(page);
})();
