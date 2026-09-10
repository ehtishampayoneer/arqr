/* ------------------------------------------------------------------
   The contact form's endpoint.

   The site is static, so it cannot email anyone by itself. This is the
   one serverless function it has, and it sends through the mailbox that
   already exists at NamesLink rather than through a form service. That
   matters for three reasons: nothing is capped per month, no third
   party's name is on the email, and the domain's mail is already set up,
   so it costs no new DNS records.

   Nothing secret is written down here. The five values below are read
   from the environment and are set in the Vercel dashboard:

     SMTP_HOST   NamesLink's outgoing mail server
     SMTP_PORT   465 for SSL, or 587 for STARTTLS
     SMTP_USER   info@arqr360.com
     SMTP_PASS   that mailbox's password
     CONTACT_TO  where enquiries land, if not the same as SMTP_USER

   JSON with the attachment base64'd, not multipart. Vercel's Node
   runtime parses JSON for you and leaves multipart as a stream you have
   to pull apart, so this way the function has one dependency instead of
   three and no argument with the body parser. The browser resizes any
   photograph before encoding it, which is what keeps the payload under
   the runtime's 4.5MB request limit.
   ------------------------------------------------------------------ */
'use strict';
const nodemailer = require('nodemailer');

/* base64 is 4 bytes per 3, and the runtime stops at 4.5MB of request, so
   this is the ceiling with room for the rest of the form */
const MAX_ATTACHMENT = 3 * 1024 * 1024;

const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
/* deliberately loose: the mailbox is the thing that decides whether an
   address is real, and a regex that guesses turns real customers away */
const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Use POST.' });
  }

  const missing = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
    .filter((k) => !process.env[k]);
  if (missing.length) {
    /* the browser is told the truth without being told the config */
    console.error('contact: missing env ' + missing.join(', '));
    return res.status(500).json({ ok: false, error: 'The form is not configured yet.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Could not read the form.' });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 60);
  const website = clean(body.website, 200);
  const message = String(body.message == null ? '' : body.message).trim().slice(0, 4000);

  if (!name || !looksLikeEmail(email) || !message) {
    return res.status(400).json({ ok: false, error: 'Name, a valid email and a message are needed.' });
  }

  const attachments = [];
  if (body.file && body.file.data) {
    const buf = Buffer.from(String(body.file.data), 'base64');
    if (buf.length > MAX_ATTACHMENT) {
      return res.status(413).json({ ok: false, error: 'That file is too large. Please keep it under 3MB.' });
    }
    if (buf.length) {
      attachments.push({
        /* the name comes from a stranger's machine, so it is stripped of
           anything that could be read as a path */
        filename: clean(body.file.name, 120).replace(/[\\/:*?"<>|]/g, '_') || 'attachment',
        content: buf
      });
    }
  }

  const rows = [
    ['Name', name], ['Email', email], ['Phone', phone || '(not given)'],
    ['Business or website', website || '(not given)']
  ];
  const text = rows.map(([k, v]) => k + ': ' + v).join('\n') +
    '\n\n' + message +
    '\n\n---\nSent from the form at arqr360.com' +
    (attachments.length ? '\nAttached: ' + attachments[0].filename : '');

  try {
    const port = Number(process.env.SMTP_PORT);
    /* Explicit timeouts, and all three of them. Left to itself nodemailer
       waits on the socket far longer than the function is allowed to run,
       so the platform kills the invocation before the library ever reports
       what went wrong, and every failure looks the same. With these it
       gives up first and says which stage it was on. */
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,          /* 465 is SSL from the first byte; 587 upgrades */
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
      /* one connection, one message: pooling is for a process that stays
         alive, and this one is gone after the request */
      pool: false
    });

    await transport.sendMail({
      /* from the mailbox that is allowed to send, or the domain's SPF
         fails and this lands in spam. The customer goes in Reply-To, so
         hitting reply still answers them. */
      from: 'ARQR360 <' + process.env.SMTP_USER + '>',
      to: process.env.CONTACT_TO || process.env.SMTP_USER,
      replyTo: name + ' <' + email + '>',
      subject: 'AR catalog enquiry from ' + name,
      text,
      attachments
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    /* The visitor gets one sentence. What goes back alongside it is a
       category, not a message: nodemailer's own text can quote the server
       and occasionally the username, and this endpoint is public. The
       category is enough to tell a wrong password from a blocked port
       without publishing either. */
    const code = String((err && (err.code || err.responseCode)) || '');
    /* which stage it died on, when nodemailer says */
    const stage = /greeting/i.test(String(err && err.message)) ? 'greeting'
      : /connection timeout|ETIMEDOUT/i.test(String(err && err.message)) ? 'connect'
      : '';
    const reason =
      /EAUTH|^535|^534|^530/.test(code) ? 'auth' :
      /ECONNECTION|ECONNREFUSED|ENOTFOUND|EDNS/.test(code) ? 'connect' :
      /ETIMEDOUT|ESOCKET/.test(code) ? 'timeout' :
      /EENVELOPE|^55[0-9]/.test(code) ? 'rejected' : 'unknown';
    console.error('contact: send failed [' + reason + '] ' + code + ' ' +
      (err && err.message));
    return res.status(502).json({ ok: false, error: 'That did not send.', reason, stage });
  }
};
