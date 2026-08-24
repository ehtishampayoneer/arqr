/* ------------------------------------------------------------------
   Product line art, shared by the sampler and the shop pages.

   Tiles fall back to this when a shop has not supplied a photo yet, so
   a brand new catalog still looks deliberate instead of broken. Injected
   next to its own script tag, synchronously, so the icons exist before
   anything renders a <use>.
   ------------------------------------------------------------------ */
(function () {
  var S = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +

  /* ---- furniture ---- */
  '<g id="ic-sofa" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M8 30v-9a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v9"/><path d="M6 30a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v6H6z"/><path d="M12 36v3M36 36v3M14 27v-8M34 27v-8"/></g>' +
  '<g id="ic-chair" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M14 30V15a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v15"/><path d="M12 30h24v5H12z"/><path d="M15 35l-3 6M33 35l3 6M24 35v6"/></g>' +
  '<g id="ic-table" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="24" cy="17" rx="16" ry="5"/><path d="M14 20v18M34 20v18M10 38h8M30 38h8"/></g>' +
  '<g id="ic-side" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><rect x="8" y="16" width="32" height="16" rx="3"/><path d="M24 16v16M12 36v3M36 36v3M10 32v4h28v-4"/><path d="M18 24h2M28 24h2"/></g>' +
  '<g id="ic-bed" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M8 32V14h32v18"/><path d="M6 32h36v6H6z"/><path d="M9 38v3M39 38v3"/><path d="M14 26h8v-6h-8zM26 26h8v-6h-8z"/></g>' +
  '<g id="ic-shelf" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><rect x="11" y="9" width="26" height="30" rx="2"/><path d="M11 19h26M11 29h26M20 9v30"/></g>' +

  /* ---- footwear ---- */
  '<g id="ic-derby" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M7 32h28a4 4 0 0 0 1-7l-10-4-4-6h-6v9H9a2 2 0 0 0-2 2z"/><path d="M7 32h30v3H7z"/><path d="M17 20l4 3M20 17l4 3"/></g>' +
  '<g id="ic-chelsea" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M16 7h10v20l8 3a3 3 0 0 1 2 3v2H11v-3a3 3 0 0 1 2-3l3-1z"/><path d="M16 15h10"/><path d="M26 20h-4v7"/></g>' +
  '<g id="ic-loafer" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M7 31h27c4 0 6-2 6-4s-3-4-7-5l-9-3-3-4h-5v8H9a2 2 0 0 0-2 2z"/><path d="M7 31h33v4H7z"/><path d="M19 21h8"/></g>' +
  '<g id="ic-sneaker" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M6 30h29c3 0 5-1 5-3 0-2-2-3-5-4l-9-4-5-5h-5v8H8a2 2 0 0 0-2 2z"/><path d="M5 30h36v5H5z"/><path d="M16 19l3 3M19 16l3 3M22 14l3 3"/></g>' +
  '<g id="ic-oxford" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M8 31h26a5 5 0 0 0 1-8l-9-4-4-5h-6v8H10a2 2 0 0 0-2 2z"/><path d="M8 31h28l2 4H8z"/><path d="M16 20l4 2M18 17l4 2M21 15l3 2"/></g>' +
  '<g id="ic-ankle" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M17 9h9v17l7 3a3 3 0 0 1 2 3v3H13v-4a3 3 0 0 1 2-3l2-1z"/><path d="M17 17h9"/><path d="M31 35v4h4v-4"/></g>' +

  /* ---- rugs ---- */
  '<g id="ic-rug" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><rect x="7" y="14" width="34" height="20" rx="2"/><rect x="12" y="19" width="24" height="10" rx="1"/><path d="M7 14l-2-3M41 14l2-3M7 34l-2 3M41 34l2 3"/></g>' +
  '<g id="ic-round" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="24" cy="24" rx="17" ry="12"/><ellipse cx="24" cy="24" rx="10" ry="7"/><ellipse cx="24" cy="24" rx="4" ry="2.6"/></g>' +
  '<g id="ic-runner" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><rect x="16" y="8" width="16" height="32" rx="2"/><path d="M20 13h8M20 24h8M20 35h8"/></g>' +

  /* ---- decoration ---- */
  '<g id="ic-pendant" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M24 6v10"/><path d="M14 30l10-14 10 14z"/><path d="M14 30h20"/><path d="M21 36h6"/></g>' +
  '<g id="ic-lantern" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M20 8h8M24 8v4"/><path d="M16 12h16l2 22H14z"/><path d="M14 38h20"/><path d="M24 18v10"/></g>' +
  '<g id="ic-frame" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><rect x="11" y="8" width="26" height="32" rx="2"/><rect x="16" y="13" width="16" height="22" rx="1"/><path d="M16 30l5-6 4 4 3-4 4 6"/></g>' +
  '<g id="ic-mirror" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M14 40V22a10 10 0 0 1 20 0v18z"/><path d="M14 40h20"/><path d="M20 34V23a4 4 0 0 1 4-4"/></g>' +
  '<g id="ic-object" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><circle cx="18" cy="20" r="8"/><circle cx="31" cy="28" r="6"/><path d="M8 40h32"/></g>' +
  '<g id="ic-vase" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M19 9h10l-2 7c5 3 6 10 4 15a9 9 0 0 1-14 0c-2-5-1-12 4-15z"/><path d="M19 24h10"/></g>' +

  /* ---- shop marks ---- */
  '<g id="mk-novara" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V6l7 10V6"/><path d="M15 20V6l7 10V6"/></g>' +
  '<g id="mk-corso" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7a8 8 0 1 0 0 11"/><path d="M4 19h10"/></g>' +
  '<g id="mk-maison" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 13.5 4 23 12"/><path d="M7 12v8h13v-8"/><path d="M11 20v-5h5v5"/></g>' +
  '<g id="mk-terra" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h19M4 13h19M4 18h19"/><path d="M9 5v16M18 5v16"/></g>' +

  '</defs></svg>';

  var me = document.currentScript;
  if (me) me.insertAdjacentHTML('afterend', S);
  else document.body.insertAdjacentHTML('afterbegin', S);
})();
