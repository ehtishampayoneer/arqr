/* ------------------------------------------------------------------
   Resend open-tracking webhook.

   Resend dashboard > Webhooks > https://arqr360.com/api/resend-webhook
   subscribed to the `email.opened` event ONLY.

   Storage: the project's Vercel Blob store "arqr-opens" is a PRIVATE
   store, so every blob is written with access:'private' (the store
   rejects public puts; @vercel/blob v1 could not do private puts at
   all, hence v2). Nothing in the store is reachable without the
   store token.

   - POST with a Resend event: on `email.opened`, appends
     { email_id, to, opened_at } to the private per-day detail file
     resend-opens/YYYY-MM-DD.json (PKT date) and rewrites the private
     per-day aggregate resend-opens/YYYY-MM-DD.count.json
     ({ date, opens, unique }). Responds 200 either way; other event
     types are ignored.
   - GET ?date=YYYY-MM-DD (defaults to today, PKT): returns the
     aggregate { date, opens, unique } for that day — counts only, no
     recipient addresses. This is what opens-daily.py reads. Missing
     day -> { date, opens: 0, unique: 0 }.

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

function pktDay(d) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(d);
}

function validDay(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

async function readJson(path, token) {
  try {
    const meta = await head(path, { token });
    const r = await fetch(meta.url, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null; // no file yet
  }
}

module.exports = async (req, res) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // GET: serve the counts-only aggregate for opens-daily.py.
  if (req.method === 'GET') {
    const day = validDay(req.query && req.query.date) || pktDay(new Date());
    if (!token) {
      res.status(200).json({ date: day, opens: 0, unique: 0 });
      return;
    }
    const agg = await readJson('resend-opens/' + day + '.count.json', token);
    if (agg && typeof agg.opens === 'number') {
      res.status(200).json({ date: agg.date || day,
        opens: agg.opens, unique: agg.unique || 0 });
    } else {
      res.status(200).json({ date: day, opens: 0, unique: 0 });
    }
    return;
  }

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

  if (!token) {
    console.log('resend-webhook: no BLOB_READ_WRITE_TOKEN, not stored: ' +
      JSON.stringify(record));
    res.status(200).json({ ok: true, stored: false });
    return;
  }

  try {
    const day = pktDay(new Date());
    const detailPath = 'resend-opens/' + day + '.json';
    const arr = (await readJson(detailPath, token)) || [];
    const list = Array.isArray(arr) ? arr : [];
    list.push(record);
    await put(detailPath, JSON.stringify(list), {
      access: 'private',
      contentType: 'application/json',
      allowOverwrite: true,
      token
    });

    const unique = new Set(list.map((r) => r.to).filter(Boolean)).size;
    await put('resend-opens/' + day + '.count.json',
      JSON.stringify({ date: day, opens: list.length, unique: unique }), {
        access: 'private',
        contentType: 'application/json',
        allowOverwrite: true,
        token
      });

    res.status(200).json({ ok: true, stored: true, opens: list.length });
  } catch (e) {
    console.log('resend-webhook store failed: ' + (e && e.message));
    res.status(200).json({ ok: true, stored: false });
  }
};
