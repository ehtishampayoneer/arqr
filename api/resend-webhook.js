/* ------------------------------------------------------------------
   Resend open-tracking webhook.

   Resend dashboard > Webhooks > https://arqr360.com/api/resend-webhook
   subscribed to the `email.opened` event ONLY.

   On each open this appends { email_id, to, opened_at } to a private
   per-day JSON file in the Vercel Blob store
   (resend-opens/YYYY-MM-DD.json, PKT date) and rewrites a PUBLIC
   aggregate file resend-opens/YYYY-MM-DD.count.json
   ({ date, opens, unique }) that opens-daily.py reads — the public
   file carries counts only, no recipient addresses.

   Environment
     BLOB_READ_WRITE_TOKEN   read/write token of the project's Blob
                             store, set in the Vercel dashboard
                             (Project > Settings > Environment Variables,
                             production). Without it the endpoint still
                             200s but stores nothing.

   Security note (accepted trade-off, founder brief 2026-10-08):
   no Svix signature verification. The URL is unlinked/obscure, the
   payload is stats-only (no PII beyond business emails we already
   mailed), and a forged hit would only nudge an aggregate counter.
   Revisit if this ever gates money or access.
   redeploy-note: force fresh production deployment so the newly added
   BLOB_READ_WRITE_TOKEN env var is injected at runtime.
------------------------------------------------------------------- */
'use strict';
const { put, head } = require('@vercel/blob');

function pktDay(d) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(d);
}

async function readJsonArray(path, token) {
  try {
    const meta = await head(path, { token });
    const r = await fetch(meta.url, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch (e) {
    return []; // no file yet
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false });
    return;
  }
  let event = req.body;
  if (typeof event === 'string') {
    try { event = JSON.parse(event); } catch (e) { event = {}; }
  }
  if (!event || typeof event !== 'object') event = {};

  // Only opens. Everything else (delivered, bounced, clicked...) is ignored.
  if (event.type !== 'email.opened') {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  const data = event.data || {};
  let to = data.to;
  if (Array.isArray(to)) to = to[0] || '';
  const record = {
    email_id: String(data.email_id || ''),
    to: String(to || '').toLowerCase(),
    opened_at: String(event.created_at || new Date().toISOString())
  };

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.log('resend-webhook: no BLOB_READ_WRITE_TOKEN, not stored: ' +
      JSON.stringify(record));
    res.status(200).json({ ok: true, stored: false });
    return;
  }

  try {
    const day = pktDay(new Date());
    const detailPath = 'resend-opens/' + day + '.json';
    const arr = await readJsonArray(detailPath, token);
    arr.push(record);
    await put(detailPath, JSON.stringify(arr), {
      access: 'private',
      contentType: 'application/json',
      allowOverwrite: true,
      token
    });

    const unique = new Set(arr.map((r) => r.to).filter(Boolean)).size;
    await put('resend-opens/' + day + '.count.json',
      JSON.stringify({ date: day, opens: arr.length, unique: unique }), {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
        token
      });

    res.status(200).json({ ok: true, stored: true, opens: arr.length });
  } catch (e) {
    console.log('resend-webhook store failed: ' + (e && e.message));
    // TEMP DEBUG: surface the failure reason so we can diagnose why the
    // env var is not reaching the function. Remove before final sign-off.
    res.status(200).json({
      ok: true, stored: false,
      debug_has_token: !!token,
      debug_token_len: token ? token.length : 0,
      debug_error: String((e && e.message) || e)
    });
  }
};
