const { verifySession, isValidAccountId, isValidDate } = require('./_lib/verifySession');

const META_API_VERSION = 'v21.0';

module.exports = async (req, res) => {
  const user = await verifySession(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });

  const { accountId, since, until } = req.query || {};
  if (!isValidAccountId(accountId) || !isValidDate(since) || !isValidDate(until)) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  const acc = accountId.startsWith('act_') ? accountId : 'act_' + accountId;
  const fields = 'spend,impressions,clicks,actions,action_values';
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url = `https://graph.facebook.com/${META_API_VERSION}/${acc}/insights?fields=${fields}&time_range=${timeRange}&access_token=${encodeURIComponent(process.env.META_ACCESS_TOKEN)}`;

  try {
    const apiRes = await fetch(url);
    const json = await apiRes.json();
    if (json.error) return res.status(502).json({ error: json.error.message || 'Error de la API de Meta' });
    res.status(200).json({ data: json.data || [] });
  } catch (e) {
    res.status(502).json({ error: 'No se pudo conectar con la API de Meta: ' + e.message });
  }
};
