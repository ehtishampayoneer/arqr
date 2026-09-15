/* ------------------------------------------------------------------
   Every email the site sends to a customer, built in one place so they
   all carry the same signature.

   The leading underscore keeps Vercel from publishing this file as an
   endpoint of its own; it is only ever required by the functions beside
   it.

   Email HTML is its own dialect: tables for layout, every style inline,
   no web fonts, no SVG, and pictures baked flat rather than layered. Gmail strips <style>
   blocks in some views and Outlook renders with Word, so anything
   cleverer than this breaks in one of them. The logo is a hosted PNG on
   an explicit light cell, because a transparent black logo on a client's
   dark-mode background would otherwise vanish.
   ------------------------------------------------------------------ */
'use strict';

const SITE = 'https://arqr360.com';
const BRAND = {
  name: 'ARQR360',
  email: 'info@arqr360.com',
  logo: SITE + '/assets/logo-bar.png',
  /* a room from the Novara sample, washed into the page colour with the
     site's grid and the logo baked in. Baked, not layered: email clients
     do not agree on background images or opacity, and a picture looks the
     same in all of them. Built by email-images.js. */
  header: SITE + '/assets/email/header.jpg',
  grid: SITE + '/assets/email/grid.png',
  accent: '#E0682A',
  ink: '#191919',
  soft: '#6E6A64',
  line: '#E4DED4',
  page: '#FAF7F2',
  social: [
    ['Instagram', 'https://www.instagram.com/arqr360'],
    ['X', 'https://x.com/arqr360'],
    ['LinkedIn', 'https://www.linkedin.com/company/arqr360/']
  ]
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FONT = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

/* The signature, as HTML and as plain text. Exported on its own so the
   copy-and-paste version for the mailbox is the same one. */
function signatureHtml() {
  const links = BRAND.social.map(([n, u]) =>
    '<a href="' + u + '" style="color:' + BRAND.soft + ';text-decoration:underline">' + n + '</a>').join(' &middot; ');
  return '' +
'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">' +
  '<tr>' +
    '<td style="padding:0 14px 0 0;vertical-align:middle;background:#FFFFFF" bgcolor="#FFFFFF">' +
      '<a href="' + SITE + '"><img src="' + BRAND.logo + '" width="62" height="38" alt="ARQR360" ' +
      'style="display:block;border:0;width:62px;height:38px"></a>' +
    '</td>' +
    '<td style="padding:0 0 0 14px;border-left:1px solid ' + BRAND.line + ';vertical-align:middle;font-family:' + FONT + ';font-size:12px;line-height:18px;color:' + BRAND.soft + '">' +
      '<span style="color:' + BRAND.ink + ';font-weight:600">' + BRAND.name + '</span> &middot; See it. Place it. Love it.<br>' +
      '<a href="mailto:' + BRAND.email + '" style="color:' + BRAND.accent + ';text-decoration:none">' + BRAND.email + '</a>' +
      ' &middot; <a href="' + SITE + '" style="color:' + BRAND.accent + ';text-decoration:none">arqr360.com</a><br>' +
      links +
    '</td>' +
  '</tr>' +
'</table>';
}

function signatureText() {
  return '--\n' + BRAND.name + ' | See it. Place it. Love it.\n' +
    BRAND.email + ' | ' + SITE + '\n' +
    BRAND.social.map(([n, u]) => n + ': ' + u).join('\n');
}

/* One layout for every customer email.
     preheader  the grey line an inbox shows beside the subject
     greeting   "Hi Sarah,"
     blocks     [{p}] paragraphs, [{button:{label,url}}], [{rows:[[k,v]]}] a summary box
*/
function render({ preheader, greeting, blocks }) {
  const parts = blocks.map((b) => {
    if (b.p) {
      return '<p style="margin:0 0 16px;font-family:' + FONT + ';font-size:15px;line-height:24px;color:' + BRAND.ink + '">' + esc(b.p) + '</p>';
    }
    if (b.button) {
      return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px"><tr>' +
        '<td bgcolor="' + BRAND.accent + '" style="border-radius:100px">' +
        '<a href="' + esc(b.button.url) + '" style="display:inline-block;padding:13px 26px;font-family:' + FONT + ';font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:100px">' +
        esc(b.button.label) + '</a></td></tr></table>';
    }
    if (b.rows) {
      return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;border:1px solid ' + BRAND.line + ';border-radius:12px;border-collapse:separate;background:' + BRAND.page + '" bgcolor="' + BRAND.page + '">' +
        b.rows.map(([k, v], i) =>
          '<tr><td style="padding:11px 16px;' + (i ? 'border-top:1px solid ' + BRAND.line + ';' : '') + 'font-family:' + FONT + ';font-size:13px;color:' + BRAND.soft + '">' + esc(k) + '</td>' +
          '<td align="right" style="padding:11px 16px;' + (i ? 'border-top:1px solid ' + BRAND.line + ';' : '') + 'font-family:' + FONT + ';font-size:13px;font-weight:600;color:' + BRAND.ink + '">' + esc(v) + '</td></tr>').join('') +
        '</table>';
    }
    return '';
  }).join('');

  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">' +
'<title>' + BRAND.name + '</title></head>' +
'<body style="margin:0;padding:0;background:' + BRAND.page + '">' +
'<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + esc(preheader || '') + '</div>' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + BRAND.page + '" background="' + BRAND.grid + '" style="background:' + BRAND.page + ' url(' + BRAND.grid + ') repeat">' +
  '<tr><td align="center" style="padding:28px 14px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid ' + BRAND.line + ';border-radius:16px;border-collapse:separate" bgcolor="#FFFFFF">' +
      '<tr><td style="padding:0;line-height:0;font-size:0"><a href="' + SITE + '"><img src="' + BRAND.header + '" width="560" alt="ARQR360" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:16px 16px 0 0"></a></td></tr>' +
      '<tr><td style="padding:26px 32px 8px">' +
        '<p style="margin:0 0 18px;font-family:' + FONT + ';font-size:15px;line-height:24px;color:' + BRAND.ink + '">' + esc(greeting) + '</p>' +
        parts +
      '</td></tr>' +
      '<tr><td style="padding:18px 32px 28px;border-top:1px solid ' + BRAND.line + '">' + signatureHtml() + '</td></tr>' +
    '</table>' +
  '</td></tr>' +
'</table></body></html>';

  const text = [greeting, '']
    .concat(blocks.map((b) => b.p ? b.p + '\n'
      : b.button ? b.button.label + ': ' + b.button.url + '\n'
      : b.rows ? b.rows.map(([k, v]) => k + ': ' + v).join('\n') + '\n' : ''))
    .concat([signatureText()]).join('\n');

  return { html, text };
}

/* Resend over HTTPS. The idempotency key means a webhook Paddle retries
   does not send the customer the same email twice. */
async function send({ to, subject, html, text, replyTo, idempotencyKey }) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  const headers = {
    Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
    'Content-Type': 'application/json'
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'ARQR360 <info@arqr360.com>',
      to: Array.isArray(to) ? to : [to],
      reply_to: replyTo || BRAND.email,
      subject, html, text
    })
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    throw new Error('resend ' + r.status + ' ' + detail.slice(0, 300));
  }
  return r.json().catch(() => ({}));
}

module.exports = { render, send, signatureHtml, signatureText, BRAND, SITE, esc };
