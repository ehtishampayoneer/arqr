/* ------------------------------------------------------------------
   Email open-tracking pixel.

   Usage in an email:
     <img src="https://arqr360.com/api/px?id=<tracking-id>"
          width="1" height="1" style="display:block" alt="">

   When the recipient's mail client loads the image (Gmail fetches it
   through its image proxy the moment the email is opened), this
   function:
     1. logs a structured OPEN line to the runtime logs, and
     2. sends a short notification to info@arqr360.com via Resend with
        subject "Opened: <tracking-id>".

   The 15-min reply-watch reads those notifications, resolves the id
   through outreach/opens-registry.md (id -> email / business), reports
   "X opened your email" once per id per day (dedupe state in
   outreach/opens-log.md), and treats repeat notifications for the
   same id+day as own-system duplicates.

   Always returns a 1x1 transparent GIF with caching disabled.
------------------------------------------------------------------- */

const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
  "base64"
);

async function notifyOpen(id, ua) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "ARQR360 <info@arqr360.com>",
        to: ["info@arqr360.com"],
        subject: "Opened: " + id,
        text:
          "Email open tracked.\n\nid: " +
          id +
          "\nua: " +
          ua +
          "\ntime: " +
          new Date().toISOString()
      })
    });
  } catch (e) {
    console.log("OPEN notify failed: " + (e && e.message));
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async (req, res) => {
  const raw = String((req.query && req.query.id) || "unknown").slice(0, 80);
  const id = raw.replace(/[^A-Za-z0-9_-]/g, "") || "unknown";
  const ua = String(req.headers["user-agent"] || "").slice(0, 160);
  console.log("OPEN id=" + id + " ua=" + ua);
  await notifyOpen(id, ua);
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Content-Length", String(GIF.length));
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.status(200).send(GIF);
};
