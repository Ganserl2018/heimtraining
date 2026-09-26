// Heimtraining API — kleine Brücke für den Health-Sync
// Speichert die letzte abgeschlossene Trainingseinheit in KV (Binding: SESSIONS)
// und gibt sie per GET wieder heraus. Ein gemeinsamer Bearer-Token schützt beide Endpunkte.
// Nur für Eigengebrauch gedacht (ein Nutzer, eine Sitzung) — bewusst simpel gehalten.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const auth = request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '');

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (token !== env.SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    if (url.pathname === '/session' && request.method === 'POST') {
      const body = await request.text();
      try {
        JSON.parse(body); // Validierung
      } catch (e) {
        return new Response(JSON.stringify({ error: 'invalid json' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
      await env.SESSIONS.put('latest', body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    if (url.pathname === '/session' && request.method === 'GET') {
      const data = await env.SESSIONS.get('latest');
      if (!data) {
        return new Response(JSON.stringify({ error: 'no session yet' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
      return new Response(data, {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    return new Response(JSON.stringify({ error: 'not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  },
};
