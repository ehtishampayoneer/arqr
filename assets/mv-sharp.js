/* Sharper rugs seen at an angle, for every <model-viewer> on the page.
   model-viewer leaves texture filtering at its basic setting (anisotropy 1), so a rug lying on the
   floor goes soft towards its far end: exactly how a shopper sees it in AR, standing over it.
   This turns on anisotropic filtering (16x, or the most the phone's graphics chip offers: three.js
   caps it) each time a model loads. Colours are untouched.
   Measured (10 Nov 2026) on the Afshar 2015-070 file at Galaxy S25 resolution, far third of the rug,
   against a 3x-resolution reference: 33.9 dB as before, 46.5 dB with this.
   It reaches into model-viewer's own scene (Symbol 'scene', present in 3.5 and 4.0); if a future
   version moves it, this quietly does nothing. */
(function () {
  if (window.ARQRSharp) return;
  var KEYS = ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'alphaMap'];

  function sceneOf(mv) {
    var s = Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(mv) : [];
    for (var i = 0; i < s.length; i++) if (String(s[i]) === 'Symbol(scene)') return mv[s[i]];
    return null;
  }

  function sharpen(mv) {
    try {
      var scene = sceneOf(mv), n = 0;
      if (!scene || !scene.traverse) return 0;
      scene.traverse(function (o) {
        if (!o.material) return;
        [].concat(o.material).forEach(function (m) {
          KEYS.forEach(function (k) {
            var t = m[k];
            if (t && t.isTexture && !(t.anisotropy >= 16)) { t.anisotropy = 16; t.needsUpdate = true; n++; }
          });
        });
      });
      if (n && scene.queueRender) scene.queueRender();
      return n;
    } catch (e) { return 0; }
  }

  // model-viewer's "load" doesn't bubble, but a capturing listener on the document still sees it
  document.addEventListener('load', function (e) {
    var t = e.target;
    if (t && t.tagName === 'MODEL-VIEWER') sharpen(t);
  }, true);
  // models that finished loading before this file arrived
  function already() {
    var l = document.querySelectorAll('model-viewer');
    for (var i = 0; i < l.length; i++) if (l[i].loaded) sharpen(l[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', already); else already();

  window.ARQRSharp = sharpen;
})();
