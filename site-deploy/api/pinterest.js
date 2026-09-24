const routes = {
  totals: require('./_lib/pinterest/totals'),
  daily: require('./_lib/pinterest/daily'),
  campaigns: require('./_lib/pinterest/campaigns'),
  pins: require('./_lib/pinterest/pins'),
};

module.exports = (req, res) => {
  const handler = routes[(req.query || {}).type];
  if (!handler) return res.status(400).json({ error: 'Tipo inválido' });
  return handler(req, res);
};
