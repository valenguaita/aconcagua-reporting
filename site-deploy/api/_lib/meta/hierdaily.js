const { verifySession, isValidAccountId, isValidDate } = require('../verifySession');
const { fetchAllPages } = require('../metaFetch');

const META_API_VERSION = 'v21.0';

module.exports = async (req, res) => {
  const user = await verifySession(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });

  const { accountId, since, until } = req.query || {};
  if (!isValidAccountId(accountId) || !isValidDate(since) || !isValidDate(until)) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  const acc = accountId.startsWith('act_') ? accountId : 'act_' + accountId;
  const fields = 'campaign_id,adset_id,spend,impressions,clicks,actions,action_values';
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url = `https://graph.facebook.com/${META_API_VERSION}/${acc}/insights?level=adset&time_increment=1&fields=${fields}&time_range=${timeRange}&limit=500&access_token=${encodeURIComponent(process.env.META_ACCESS_TOKEN)}`;

  try {
    res.status(200).json({ data: await fetchAllPages(url) });
  } catch (e) {
    res.status(502).json({ error: 'No se pudo conectar con la API de Meta: ' + e.message });
  }
};
