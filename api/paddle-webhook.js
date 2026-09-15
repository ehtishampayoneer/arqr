/* ------------------------------------------------------------------
   Paddle tells us a checkout succeeded; we thank the customer.

   Paddle sends its own receipt, but it cannot say what happens next for
   a catalogue: that we will be in touch in 1 to 2 business days and what
   to get ready meanwhile. So on a completed first payment this sends the
   customer our own email, with the link to /welcome, and sends a short
   "new order" note to our inbox.

   Only first purchases. transaction.completed also fires every month when
   a subscription renews, and a monthly "thank you for your order" would
   read as a second order. Checkout purchases have origin "web"; renewals
   are "subscription_recurring".

   Environment
     PADDLE_WEBHOOK_SECRET   the notification destination's secret key,
                             from Paddle > Developer tools > Notifications
     PADDLE_API_KEY          a key with customer read permission. Paddle's
                             webhook carries a customer id, not an email,
                             so the address is looked up with this. Its
                             prefix says which Paddle to ask: pdl_sdbx_ is
                             the sandbox, pdl_live_ is live.
     RESEND_API_KEY, MAIL_FROM, CONTACT_TO   as for the contact form
   ------------------------------------------------------------------ */
'use strict';
const crypto = require('crypto');
const { render, send, SITE } = require('./_mail.js');

/* The raw bytes are what Paddle signed, so the stream is read first and
   req.body is not touched until it has been: on Vercel that property is a
   parser, and the parsed object cannot be turned back into the exact bytes
   the signature was made over. A body that arrives already parsed is
   refused rather than guessed at. */
function rawBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const s = Buffer.concat(chunks).toString('utf8');
      if (s) return resolve(s);
      const b = req.body;
      resolve(typeof b === 'string' ? b : Buffer.isBuffer(b) ? b.toString('utf8') : '');
    };
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', finish);
    req.on('error', finish);
    setTimeout(finish, 4000);
  });
}

/* Paddle-Signature: ts=1671552777;h1=<hex hmac of "ts:body"> */
/* Returns '' when the signature is good, otherwise a short reason. The
   reason goes back in the response, which Paddle shows in its
   notification log, so a failed delivery says why without anyone needing
   the server logs. None of it is secret: which check failed and how many
   bytes arrived. */
function why(header, body, secret, now) {
  if (!secret) return 'not-configured';
  if (!header) return 'no-signature';
  if (!body) return 'empty-body';
  return verify(header, body, secret, now) ? '' : 'signature-mismatch';
}

function verify(header, body, secret, now) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(String(header).split(';').map((kv) => {
    const i = kv.indexOf('=');
    return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
  }));
  const ts = Number(parts.ts);
  if (!ts || !parts.h1) return false;
  /* a signature older than five minutes is a replay, not a delivery */
  if (Math.abs((now || Date.now() / 1000) - ts) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(parts.ts + ':' + body).digest('hex');
  const a = Buffer.from(expected, 'hex'), b = Buffer.from(parts.h1, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const money = (minor, currency) => {
  const n = Number(minor || 0) / 100;
  return (currency === 'USD' ? '$' : '') + n.toFixed(2) + (currency === 'USD' ? '' : ' ' + currency);
};

const PLAN = { starter: 'Starter (10 products)', studio: 'Studio (25 products)', showroom: 'Showroom (50 products)' };

async function lookupCustomer(id) {
  const key = process.env.PADDLE_API_KEY;
  if (!key || !id) return null;
  const base = /^pdl_live_/.test(key) ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
  const r = await fetch(base + '/customers/' + encodeURIComponent(id), {
    headers: { Authorization: 'Bearer ' + key, 'Paddle-Version': '1' }
  });
  if (!r.ok) throw new Error('paddle customer ' + r.status);
  return (await r.json()).data;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const body = await rawBody(req);
  const refused = why(req.headers['paddle-signature'], body, process.env.PADDLE_WEBHOOK_SECRET);
  if (refused) {
    console.error('paddle-webhook: refused, ' + refused + ', ' + Buffer.byteLength(body) + ' bytes');
    return res.status(401).json({ ok: false, reason: refused, bytes: Buffer.byteLength(body),
      apiKey: !!process.env.PADDLE_API_KEY, resend: !!process.env.RESEND_API_KEY });
  }

  let event;
  try { event = JSON.parse(body); } catch (e) { return res.status(400).json({ ok: false }); }

  const tx = event && event.data;
  if (event.event_type !== 'transaction.completed' || !tx) return res.status(200).json({ ok: true, skipped: 'event' });
  if (tx.origin !== 'web') return res.status(200).json({ ok: true, skipped: 'renewal' });

  try {
    const customer = await lookupCustomer(tx.customer_id);
    const email = customer && customer.email;
    if (!email) throw new Error('no customer email for ' + tx.customer_id);
    const first = customer.name ? String(customer.name).trim().split(/\s+/)[0] : '';

    const cur = tx.currency_code;
    const items = tx.items || [];
    const monthly = items.find((i) => i.price && i.price.billing_cycle);
    const planKey = (tx.custom_data && tx.custom_data.plan) || '';
    const planName = PLAN[planKey] ||
      (monthly && monthly.price && monthly.price.name) || 'Your ARQR360 plan';
    const totals = (tx.details && tx.details.totals) || {};
    const rows = [
      ['Plan', planName],
      ['Paid today', money(totals.grand_total || totals.total, cur)]
    ];
    if (monthly && monthly.price && monthly.price.unit_price) {
      rows.push(['Then', money(monthly.price.unit_price.amount, cur) + ' / month']);
    }
    rows.push(['Order reference', tx.id]);

    const mail = render({
      preheader: 'We will be in touch within 1 to 2 business days to get started.',
      greeting: first ? 'Hi ' + first + ',' : 'Hello,',
      blocks: [
        { p: 'Thank you for choosing ARQR360, and welcome aboard. Your order is confirmed.' },
        { p: 'We will be in touch within 1 to 2 business days to get started on your catalogue.' },
        { p: 'In the meantime, please read through our getting-started page and get your photos and measurements ready, so we can begin building your catalogue as soon as they arrive.' },
        { button: { label: 'See what we need from you', url: SITE + '/welcome' } },
        { rows },
        { p: 'Your payment receipt comes separately from Paddle, who process payments for us. If anything is unclear, just reply to this email and a person will answer.' }
      ]
    });

    await send({
      to: email,
      subject: 'Thank you for your order, welcome to ARQR360',
      html: mail.html, text: mail.text,
      idempotencyKey: 'order-' + tx.id
    });

    /* and a line to us, so a sale is never only in the Paddle dashboard */
    const inbox = process.env.CONTACT_TO;
    if (inbox) {
      const note = render({
        preheader: planName + ', ' + email,
        greeting: 'New order.',
        blocks: [{ rows: [['Customer', (customer.name ? customer.name + ', ' : '') + email]].concat(rows) },
                 { p: 'The customer has been sent the welcome email with the link to /welcome.' }]
      });
      await send({
        to: inbox, subject: 'New order: ' + planName + ' from ' + email,
        html: note.html, text: note.text, replyTo: email,
        idempotencyKey: 'order-note-' + tx.id
      }).catch((e) => console.error('paddle-webhook: inbox note failed ' + e.message));
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    /* a 5xx makes Paddle retry later, and the idempotency keys stop a
       retry from sending twice what already went */
    console.error('paddle-webhook: ' + e.message);
    /* the message names the step that failed (customer lookup, Resend) and
       its status code; it never contains a key */
    return res.status(500).json({ ok: false, reason: String(e.message).slice(0, 240) });
  }
}

module.exports = handler;
module.exports.verify = verify;
module.exports.config = { api: { bodyParser: false } };
