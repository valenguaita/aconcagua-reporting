const routes = {
  daily: require('./_lib/meta/daily'),
  hierarchy: require('./_lib/meta/hierarchy'),
  hierdaily: require('./_lib/meta/hierdaily'),
  totals: require('./_lib/meta/totals'),
};

module.exports = (req, res) => {
  const handler = routes[(req.query || {}).type];
  if (!handler) return res.status(400).json({ error: 'Tipo inválido' });
  return handler(req, res);
};
