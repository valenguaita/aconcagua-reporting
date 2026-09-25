// Tarea diaria (Vercel Cron): renueva el token de Pinterest antes de que se corte y chequea que las
// credenciales de las 4 plataformas sigan funcionando. Si algo falla responde 500 (queda marcado en Vercel).
const { getPinterestToken, pinterestTokenStatus, DAY } = require('./_lib/pinterestToken');
const { getAccessToken } = require('./_lib/googleHandler');

async function check(name, fn) {
  try { return { name, ok: true, ...(await fn()) }; } catch (e) { return { name, ok: false, error: e.message }; }
}

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers['authorization'] || '') !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado' });

  const results = await Promise.all([
    check('pinterest', async () => { await getPinterestToken({ minRemainingMs: 15 * DAY, strict: true }); return pinterestTokenStatus(); }),
    check('meta', async () => {
      const t = encodeURIComponent(process.env.META_ACCESS_TOKEN);
      const json = await (await fetch(`https://graph.facebook.com/v21.0/debug_token?input_token=${t}&access_token=${t}`)).json();
      if (!json.data || !json.data.is_valid) throw new Error('Token de Meta inválido');
      return { type: json.data.type, expiresAt: json.data.expires_at ? new Date(json.data.expires_at * 1000).toISOString() : 'nunca' };
    }),
    check('tiktok', async () => {
      const json = await (await fetch('https://business-api.tiktok.com/open_api/v1.3/user/info/', { headers: { 'Access-Token': process.env.TIKTOK_ACCESS_TOKEN } })).json();
      if (json.code !== 0) throw new Error(json.message || 'Token de TikTok inválido');
      return {};
    }),
    check('google', async () => { await getAccessToken(); return { note: 'token de acceso obtenido' }; })
  ]);

  console.log(JSON.stringify({ cron: 'tokens', results }));
  return res.status(results.every(r => r.ok) ? 200 : 500).json({ results });
};
