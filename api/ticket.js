/* ------------------------------------------------------------------
   The free-sample ticket endpoint behind the exit-intent popup.

   The visitor uploads up to 4 product photos plus their details. This
   function does three things: it mails us the photos with a ticket
   number, it mails the visitor a confirmation carrying that ticket
   number, and it returns the ticket number so the popup can show it
   instantly. The photos arriving in our mailbox ARE the ticket queue.

   Same sending setup as the contact form: Resend over HTTPS first
   (Vercel cannot reach the Aliyun SMTP ports), SMTP as the fallback.
   JSON with the attachments base64'd, not multipart, for the same
   reason as contact.js. The browser resizes photos before encoding,
   which keeps the payload under the runtime's 4.5MB request limit.
   ------------------------------------------------------------------ */
'use strict';
const nodemailer = require('nodemailer');
const mail = require('./_mail');

const MAX_ATTACHMENT = 3 * 1024 * 1024;

const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/* ticket ids: short, readable over the phone, no confusing characters */
function makeTicket(){
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return 'ARQR-' + s;
}

async function sendViaResend({ to, replyTo, subject, html, text, attachments }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'ARQR360 <info@arqr360.com>',
      to: Array.isArray(to) ? to : [to],
      reply_to: replyTo,
      subject, html, text,
      attachments: (attachments || []).map((a) => ({
        filename: a.filename,
        content: a.content.toString('base64')
      }))
    })
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    throw new Error('resend ' + r.status + ' ' + detail.slice(0, 200));
  }
}

function smtpTransport(){
  const port = Number(process.env.SMTP_PORT);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    pool: false
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Use POST.' });
  }

  const useResend = !!process.env.RESEND_API_KEY;
  const missing = useResend ? []
    : ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('ticket: missing env ' + missing.join(', '));
    return res.status(500).json({ ok: false, error: 'The form is not configured yet.' });
  }
  const to = process.env.CONTACT_TO || process.env.SMTP_USER;
  if (!to) {
    console.error('ticket: no CONTACT_TO and no SMTP_USER to fall back on');
    return res.status(500).json({ ok: false, error: 'The form is not configured yet.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Could not read the form.' });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const shop = clean(body.shop, 200);
  const phone = clean(body.phone, 60);
  const message = String(body.message == null ? '' : body.message).trim().slice(0, 4000);

  if (!name || !looksLikeEmail(email)) {
    return res.status(400).json({ ok: false, error: 'Name and a valid email are needed.' });
  }

  const sent = Array.isArray(body.files) ? body.files : [];
  const attachments = [];
  let bytes = 0;
  for (const f of sent.slice(0, 4)) {
    if (!f || !f.data) continue;
    const buf = Buffer.from(String(f.data), 'base64');
    bytes += buf.length;
    if (bytes > MAX_ATTACHMENT) {
      return res.status(413).json({
        ok: false, error: 'Those photos come to more than 3MB together. Please send fewer.'
      });
    }
    if (buf.length) {
      attachments.push({
        filename: clean(f.name, 120).replace(/[\\/:*?"<>|]/g, '_') || 'product-photo.jpg',
        content: buf
      });
    }
  }
  if (!attachments.length) {
    return res.status(400).json({ ok: false, error: 'Please add at least one photo of your product.' });
  }

  const ticket = makeTicket();

  /* 1. us: the ticket with the photos attached */
  const internalText =
    'New free-sample ticket: ' + ticket + '\n\n' +
    [['Name', name], ['Email', email], ['Shop / website', shop || '(not given)'],
     ['Phone', phone || '(not given)']].map(([k, v]) => k + ': ' + v).join('\n') +
    (message ? '\n\nMessage:\n' + message : '') +
    '\n\nAttached (' + attachments.length + '): ' +
    attachments.map((a) => a.filename).join(', ') +
    '\n\n---\nFree-sample ticket from arqr360.com';

  /* 2. them: instant confirmation carrying the ticket number */
  const cust = mail.render({
    preheader: 'Ticket ' + ticket + ' is booked. Your free AR product is on its way.',
    greeting: 'Hi ' + name.split(' ')[0] + ',',
    blocks: [
      { p: 'Your photos are with us. Your free AR sample is booked under ticket ' + ticket + '.' },
      { rows: [
        ['Ticket', ticket],
        ['Photos received', String(attachments.length)],
        ['Shop', shop || '(not given)']
      ]},
      { p: 'What happens next: we build your bestselling product as a true-to-size 3D model, then we email you a link to try it on your own phone. No cost, no commitment.' },
      { p: 'If you want to add anything, just reply to this email and quote your ticket number.' }
    ]
  });

  try {
    if (useResend) {
      await sendViaResend({
        to: [to],
        replyTo: name + ' <' + email + '>',
        subject: 'Free AR sample ticket ' + ticket + ' from ' + name,
        text: internalText,
        attachments
      });
      await mail.send({
        to: email,
        subject: 'Your free AR sample is booked (' + ticket + ')',
        html: cust.html,
        text: cust.text,
        idempotencyKey: 'ticket-' + ticket
      });
    } else {
      const t = smtpTransport();
      await t.sendMail({
        from: 'ARQR360 <' + process.env.SMTP_USER + '>',
        to,
        replyTo: name + ' <' + email + '>',
        subject: 'Free AR sample ticket ' + ticket + ' from ' + name,
        text: internalText,
        attachments
      });
      await t.sendMail({
        from: 'ARQR360 <' + process.env.SMTP_USER + '>',
        to: email,
        replyTo: 'ARQR360 <info@arqr360.com>',
        subject: 'Your free AR sample is booked (' + ticket + ')',
        html: cust.html,
        text: cust.text
      });
    }
    return res.status(200).json({ ok: true, ticket });
  } catch (err) {
    console.error('ticket: send failed ' + (err && err.message));
    return res.status(502).json({ ok: false, error: 'That did not send. Please try again.' });
  }
};
