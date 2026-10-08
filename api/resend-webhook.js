/* ------------------------------------------------------------------
   Resend open-tracking webhook.

   Resend dashboard > Webhooks > https://arqr360.com/api/resend-webhook
   subscribed to the `email.opened` event ONLY.

   On each open this appends { email_id, to, opened_at } to a per-day
   detail file in the Vercel Blob store and rewrites a tiny PUBLIC
   aggregate file resend-opens/YYYY-MM-DD.count.json
   ({ date, opens, unique }) that opens-daily.py reads.

   NOTE on @vercel/blob v1: client `put()` only supports
   access:'public' (private puts throw 'access must be "public"').
   So the detail file is public too, but lives at an UNGUESSABLE
   pathname (fixed random suffix, private repo) — effectively
   private. The aggregate at the known path carries counts only,
   no recipient addresses.

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
------------------------------------------------------------------- */
'use strict';
const { put, head } = require('@vercel/blob');

// Unguessable suffix for the per-day detail file. The aggregate file
// at the known path carries counts only.
const DETAIL_SUFFIX = 'x7f3a9c2e1b4d8f6a0c5e7d9a1b3f4e2d';

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
    const detailPath = 'resend-opens/' + day + '-' + DETAIL_SUFFIX + '.json';
    const arr = await readJsonArray(detailPath, token);
    arr.push(record);
    await put(detailPath, JSON.stringify(arr), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
      token
    });

    const unique = new Set(arr.map((r) => r.to).filter(Boolean)).size;
    const countBody = JSON.stringify({ date: day, opens: arr.length, unique: unique });
    const countRes = await put('resend-opens/' + day + '.count.json', countBody, {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
      token
    });

    res.status(200).json({ ok: true, stored: true, opens: arr.length,
      count_url: countRes.url });
  } catch (e) {
    console.log('resend-webhook store failed: ' + (e && e.message));
    res.status(200).json({ ok: true, stored: false,
      error: String((e && e.message) || e) });
  }
};
