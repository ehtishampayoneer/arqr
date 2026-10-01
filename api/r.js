/* ------------------------------------------------------------------
   Personal prospect-link interstitial.

   Every outreach email links the prospect's personal URL
   https://arqr360.com/r/<slug>. This function serves a tiny branded
   interstitial at that path (rewritten from /r/:slug, so the browser
   URL keeps the /r/<slug> path), then sends the visitor on to the
   homepage with ?r=<slug>.

   Why a real page instead of a bare 307: Vercel Web Analytics is
   beacon-based, it only fires when a page with the insights script
   loads in a real browser. A bare redirect never runs the script, so
   the visit would be invisible. With this page the beacon reports
   requestPath = /r/<slug>, which is how engagement-sync.py attributes
   a site visit to the prospect that was emailed that slug.

   Zero secrets, zero dependencies, cacheable at the edge.
------------------------------------------------------------------- */

const PAGE = (dest) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<script defer src="/_vercel/insights/script.js"><\/script>
<title>ARQR360 \u2014 your personal preview link</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #141210; color: #f2ede6; font-family: -apple-system, "Segoe UI", Inter, sans-serif;
         min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; }
  .wrap { padding: 32px; max-width: 420px; }
  .logo { font-size: 26px; font-weight: 700; letter-spacing: 2px; margin-bottom: 18px; }
  .logo span { color: #d8a24a; }
  p { color: #b9b0a4; font-size: 15px; line-height: 1.6; margin-bottom: 26px; }
  .bar { height: 3px; background: #2c2825; border-radius: 2px; overflow: hidden; margin-bottom: 26px; }
  .bar i { display: block; height: 100%; width: 40%; background: #d8a24a; border-radius: 2px;
           animation: slide 1.1s ease-in-out infinite; }
  @keyframes slide { 0% { margin-left: -40%; } 100% { margin-left: 100%; } }
  a { color: #d8a24a; font-size: 14px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">ARQR<span>360</span></div>
  <p>Opening your personal preview link&hellip;</p>
  <div class="bar"><i></i></div>
  <a id="go" href="${dest}">Continue to arqr360.com</a>
</div>
<script>
  setTimeout(function () { location.replace(${JSON.stringify(dest)}); }, 1400);
<\/script>
</body>
</html>`;

module.exports = async (req, res) => {
  const slug = String(req.query.slug || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const dest = "/?r=" + encodeURIComponent(slug);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).send(PAGE(dest));
};
