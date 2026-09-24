const routes = {
  totals: require('./_lib/tiktok/totals'),
  daily: require('./_lib/tiktok/daily'),
  campaigns: require('./_lib/tiktok/campaigns'),
  ads: require('./_lib/tiktok/ads'),
  campdaily: require('./_lib/tiktok/campdaily'),
};

module.exports = (req, res) => {
  const handler = routes[(req.query || {}).type];
  if (!handler) return res.status(400).json({ error: 'Tipo inválido' });
  return handler(req, res);
};
