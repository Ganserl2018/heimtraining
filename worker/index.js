// Heimtraining API — Brücke für den Health-Sync (ein Nutzer, eine Sitzung).
// POST /session: von der App (nur Origin heimtraining.pages.dev, ohne Token), streng validiert, Größen-/Rate-Limit.
// GET  /session: nur mit Bearer-Token (env.SECRET, steht NICHT im Repo) – für den iOS-Kurzbefehl.
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
    if (url.pathname !== '/session') return json({ error: 'not found' }, 404, cors);

    if (request.method === 'POST') {
      if (request.headers.get('Origin') !== ORIGIN) return json({ error: 'forbidden' }, 403, cors);
      const body = await request.text();
      if (body.length > MAX_BYTES) return json({ error: 'too large' }, 413, cors);
      let d;
      try { d = JSON.parse(body); } catch (e) { return json({ error: 'invalid json' }, 400, cors); }
      if (!d || typeof d.date !== 'string' || !Array.isArray(d.exercises) || d.exercises.length > 60) return json({ error: 'invalid shape' }, 400, cors);
      const last = Number(await env.SESSIONS.get('lastwrite')) || 0;
      if (Date.now() - last < MIN_GAP_MS) return json({ error: 'slow down' }, 429, cors);
      await env.SESSIONS.put('lastwrite', String(Date.now()));
      await env.SESSIONS.put('latest', body);
      return json({ ok: true }, 200, cors);
    }

    if (request.method === 'GET') {
      const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
      if (!env.SECRET || token !== env.SECRET) return json({ error: 'unauthorized' }, 401, cors);
      const data = await env.SESSIONS.get('latest');
      if (!data) return json({ error: 'no session yet' }, 404, cors);
      return new Response(data, { headers: { 'Content-Type': 'application/json', ...cors } });
    }

    return json({ error: 'method not allowed' }, 405, cors);
  },
};
