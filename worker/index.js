// Heimtraining API — Brücke für den Health-Sync, eine Sitzung je Profil.
// Jedes Profil hat auf dem Gerät einen zufälligen 32-Zeichen-Code (steht nur dort + im eigenen Kurzbefehl).
// POST /session/<code>: von der App (nur Origin heimtraining.pages.dev), streng validiert, Größen-/Rate-Limit je Code.
// GET  /session/<code>: für den iOS-Kurzbefehl der Person – der Code ist das Geheimnis, nichts Sensibles drin (Übungsnamen, Sätze).
const ORIGIN = 'https://heimtraining.pages.dev';
const MAX_BYTES = 20000;
const MIN_GAP_MS = 3000;

const json = (obj, status, extra) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...extra } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const m = url.pathname.match(/^\/session\/([a-f0-9]{32})$/);
    if (!m) return json({ error: 'not found' }, 404, cors);
    const code = m[1];

    if (request.method === 'POST') {
      if (request.headers.get('Origin') !== ORIGIN) return json({ error: 'forbidden' }, 403, cors);
      const body = await request.text();
      if (body.length > MAX_BYTES) return json({ error: 'too large' }, 413, cors);
      let d;
      try { d = JSON.parse(body); } catch (e) { return json({ error: 'invalid json' }, 400, cors); }
      if (!d || typeof d.date !== 'string' || !Array.isArray(d.exercises) || d.exercises.length > 60) return json({ error: 'invalid shape' }, 400, cors);
      const last = Number(await env.SESSIONS.get('lastwrite:' + code)) || 0;
      if (Date.now() - last < MIN_GAP_MS) return json({ error: 'slow down' }, 429, cors);
      await env.SESSIONS.put('lastwrite:' + code, String(Date.now()), { expirationTtl: 3600 });
      await env.SESSIONS.put('latest:' + code, body);
      return json({ ok: true }, 200, cors);
    }

    if (request.method === 'GET') {
      const data = await env.SESSIONS.get('latest:' + code);
      if (!data) return json({ error: 'no session yet' }, 404, cors);
      return new Response(data, { headers: { 'Content-Type': 'application/json', ...cors } });
    }

    return json({ error: 'method not allowed' }, 405, cors);
  },
};
