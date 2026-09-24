const routes = {
  totals: require('./_lib/google/totals'),
  daily: require('./_lib/google/daily'),
  campaigns: require('./_lib/google/campaigns'),
};

module.exports = (req, res) => {
  const handler = routes[(req.query || {}).type];
  if (!handler) return res.status(400).json({ error: 'Tipo inválido' });
  return handler(req, res);
};
