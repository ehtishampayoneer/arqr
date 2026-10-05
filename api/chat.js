/* ------------------------------------------------------------------
   POST /api/chat — the AI brain behind "Ari", the ARQR360 website chat.

   Body:  { messages: [{ role: 'user'|'assistant', text: '...' }] }
   Reply: { reply: '...' }  (the reply may end with [LEAD:name|email|shop]
            or [HUMAN]; the chat widget strips those tags and acts on them)

   Uses the Gemini free tier (GEMINI_API_KEY env var, server-side only).
   If the AI is down, missing, or rate-limited, we answer 500 and the
   widget falls back to its built-in rule-based answers, so the chat
   never goes silent.

   Abuse guards: 30 requests / minute / IP (in-memory, best effort),
   max 20 history messages, 2000 chars each.
   ------------------------------------------------------------------ */
'use strict';

const SYS = [
  'You are Ari, a friendly member of the ARQR360 team. You always speak as "we", never "I".',
  'You chat with store owners visiting arqr360.com. Sound like a real person typing on their phone: short messages, plain words, contractions, warm and a little playful. Never use em-dashes or en-dashes, use commas or periods. Never use corporate buzzwords like delve, seamless, cutting-edge, game-changer, or unlock.',
  '',
  'What ARQR360 does: we turn product photos into true-to-size 3D AR models, so shoppers can see furniture, rugs, decor, or footwear life-size in their own room before buying. Works on iPhone and Android right in the browser, no app needed. The store gets a branded AR catalogue with a QR code and a shareable link.',
  '',
  'Pricing, never get this wrong: Starter is $249 one-time catalogue setup for the first 10 products, then $29 a month. Studio is $549 setup, $59 a month, 25 products. Showroom is $999 setup, $99 a month, 50 products. The very first product model is FREE, no card needed. Early stores can join the Founding 50: $199 setup plus $19 a month locked for life.',
  'How it works: the store sends photos of their bestselling product, we build the true-to-size 3D model in about 7 days, and they get an AR link and QR code for their site or shop floor.',
  'Sample catalogues by category: furniture https://arqr360.com/novara, rugs https://arqr360.com/terra, decor https://arqr360.com/maison, footwear https://arqr360.com/corso.',
  '',
  'Rules: never share any phone number. If someone asks for a call, ask them to pick a time for a Google Meet and say we will send the link. Never promise refunds, money-back, or sales results. If asked something you do not know, say so honestly and offer to have the team reply by email at info@arqr360.com. Keep replies to 1 to 3 short sentences. Ask one question at a time.',
  '',
  'Your main goal: get them excited to try the FREE first model. When someone says yes, or asks how to start, collect three things conversationally, one at a time: their name, then their email, then their shop or brand name. The moment you have all three, end your reply with exactly this tag, at the very end and nowhere else: [LEAD:name|email|shop] using what they told you. After the tag our system takes over for the photos, so in the same reply just tell them to send 1 to 4 product photos with the paperclip button.',
  'If they clearly insist on talking to a human instead of you, end your reply with exactly: [HUMAN]'
].join('\n');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const rl = new Map(); // ip -> { n, t }
function rateLimited(ip) {
  const now = Date.now();
  let e = rl.get(ip);
  if (!e || now - e.t > 60000) { e = { n: 0, t: now }; rl.set(ip, e); }
  e.n += 1;
  if (rl.size > 5000) rl.clear();
  return e.n > 30;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const fwd = req.headers['x-forwarded-for'] || '';
  const ip = String(fwd).split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    res.status(429).json({ error: 'slow_down' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  const raw = body && Array.isArray(body.messages) ? body.messages.slice(-20) : null;
  if (!raw || !raw.length) {
    res.status(400).json({ error: 'bad_request' });
    return;
  }
  const contents = [];
  for (const m of raw) {
    const t = String((m && m.text) || '').slice(0, 2000).trim();
    if (!t) continue;
    contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: t }] });
  }
  if (!contents.length) {
    res.status(400).json({ error: 'bad_request' });
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'ai_unavailable' });
    return;
  }

  try {
    const r = await fetch(GEMINI_URL + '?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYS }] },
        contents: contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 350 }
      })
    });
    const j = await r.json();
    const parts = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
    const reply = parts ? parts.map(function (p) { return p.text || ''; }).join('').trim() : '';
    if (!reply) throw new Error('empty_reply');
    res.status(200).json({ reply: reply.slice(0, 2000) });
  } catch (e) {
    res.status(500).json({ error: 'ai_unavailable' });
  }
};
