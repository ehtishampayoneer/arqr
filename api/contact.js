/* ------------------------------------------------------------------
   The contact form's endpoint.

   The site is static, so it cannot email anyone by itself. This is the
   one serverless function it has, and it sends through the mailbox that
   already exists at NamesLink rather than through a form service. That
   matters for three reasons: nothing is capped per month, no third
   party's name is on the email, and the domain's mail is already set up,
   so it costs no new DNS records.

   Two ways to send, and it prefers the one that works from here.

   SMTP to the NamesLink mailbox was the obvious route and it does not
   work from a serverless function. The server is healthy: from an
   ordinary connection port 465 answers with "220 smtp.aliyun-inc.com MX
   AliMail Server" straight away. From Vercel the socket opens and then
   the conversation never finishes, which is Aliyun declining datacenter
   IP ranges, something a mail provider does on purpose and no setting on
   this side changes. Port 587 is closed outright, so there is no second
   port to try.

   So the first choice is Resend, which is an ordinary HTTPS request and
   cannot be blocked the way an SMTP port can. SMTP stays as the fallback
   for the day the mailbox moves somewhere that accepts it.

     RESEND_API_KEY  turns the HTTPS path on. If it is absent, SMTP.
     MAIL_FROM       the From address. Resend will only send as a domain
                     you have verified with it, so until arqr360.com is
                     verified this stays at its default of onboarding@
                     resend.dev. The customer is in Reply-To either way,
                     so replying still reaches them.
     CONTACT_TO      where enquiries land.

     SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS   the fallback.

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

  const useResend = !!process.env.RESEND_API_KEY;
  const missing = useResend ? []
    : ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !process.env[k]);
  if (missing.length) {
    /* the browser is told the truth without being told the config */
    console.error('contact: missing env ' + missing.join(', '));
    return res.status(500).json({ ok: false, error: 'The form is not configured yet.' });
  }
  const to = process.env.CONTACT_TO || process.env.SMTP_USER;
  if (!to) {
    console.error('contact: no CONTACT_TO and no SMTP_USER to fall back on');
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

  /* `files` is an array; `file` is the single-attachment shape this used
     to take, kept so an older page cached in someone's browser still
     sends rather than failing silently. */
  const sent = Array.isArray(body.files) ? body.files : (body.file ? [body.file] : []);
  const attachments = [];
  let bytes = 0;
  for (const f of sent.slice(0, 12)) {
    if (!f || !f.data) continue;
    const buf = Buffer.from(String(f.data), 'base64');
    bytes += buf.length;
    /* the total is what matters, not the file */
    if (bytes > MAX_ATTACHMENT) {
      return res.status(413).json({
        ok: false,
        error: 'Those files come to more than 3MB together. Please send fewer, or a link.'
      });
    }
    if (buf.length) {
      attachments.push({
        /* the name comes from a stranger's machine, so anything that could
           be read as a path is stripped out of it */
        filename: clean(f.name, 120).replace(/[\\/:*?"<>|]/g, '_') || 'attachment',
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
    (attachments.length
      ? '\nAttached (' + attachments.length + '): ' +
        attachments.map((a) => a.filename).join(', ')
      : '');

  try {
    if (useResend) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || 'ARQR360 <onboarding@resend.dev>',
          to: [to],
          reply_to: name + ' <' + email + '>',
          subject: 'AR catalogue enquiry from ' + name,
          text,
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: a.content.toString('base64')
          }))
        })
      });
      if (!r.ok) {
        const detail = await r.text().catch(() => '');
        console.error('contact: resend ' + r.status + ' ' + detail.slice(0, 300));
        return res.status(502).json({
          ok: false, error: 'That did not send.',
          reason: r.status === 401 || r.status === 403 ? 'auth' : 'rejected'
        });
      }
      return res.status(200).json({ ok: true });
    }

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
      to,
      replyTo: name + ' <' + email + '>',
      subject: 'AR catalogue enquiry from ' + name,
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
