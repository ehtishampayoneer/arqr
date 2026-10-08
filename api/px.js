/* ------------------------------------------------------------------
   Email open-tracking pixel.

   Usage in an email:
     <img src="https://arqr360.com/api/px?id=<tracking-id>"
          width="1" height="1" style="display:block" alt="">

   When the recipient's mail client loads the image (Gmail fetches it
   through its image proxy on open), this function logs a structured
   OPEN line to the Vercel runtime logs and returns a 1x1 transparent
   GIF with caching disabled.

   opens-sync.py (run by the 15-min reply-watch) pulls these lines via
   the Vercel get_runtime_logs API and records them in
   outreach/opens-log.md, so the founder hears "X opened your email".

   Tracking ids are registered in outreach/opens-registry.md
   (id -> email / business). Keep ids short, lowercase, dashed.
------------------------------------------------------------------- */

const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
  "base64"
);

module.exports = async (req, res) => {
  const raw = String((req.query && req.query.id) || "unknown").slice(0, 80);
  const id = raw.replace(/[^A-Za-z0-9_-]/g, "") || "unknown";
  const ua = String(req.headers["user-agent"] || "").slice(0, 160);
  console.log("OPEN id=" + id + " ua=" + ua);
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Content-Length", String(GIF.length));
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.status(200).send(GIF);
};
