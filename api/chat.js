// api/chat.js — drop-in replacement for the ahora-backend Vercel project
// Fixes: "Redirect is not allowed for a preflight request" CORS error
// Save this file as api/chat.js in the ahora-backend project and redeploy.

const ALLOWED_ORIGINS = [
  'https://klgahoracompanion.com',
  'https://www.klgahoracompanion.com'
];

export default async function handler(req, res) {
  // CORS headers on EVERY response, including the OPTIONS preflight
  const origin = req.headers.origin || '';
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Answer the preflight directly — never redirect it
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Upstream request failed' });
  }
}
