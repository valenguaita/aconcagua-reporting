const routes = {
  totals: require('./_lib/google/totals'),
  daily: require('./_lib/google/daily'),
  campaigns: require('./_lib/google/campaigns'),
  keywords: require('./_lib/google/keywords'),
  searchterms: require('./_lib/google/searchterms'),
  devices: require('./_lib/google/devices'),
  share: require('./_lib/google/share'),
};

module.exports = (req, res) => {
  const handler = routes[(req.query || {}).type];
  if (!handler) return res.status(400).json({ error: 'Tipo inválido' });
  return handler(req, res);
};
