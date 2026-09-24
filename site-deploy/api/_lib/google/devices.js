const { makeGoogleHandler } = require('../googleHandler');

module.exports = makeGoogleHandler((since, until) =>
  `SELECT segments.device, metrics.clicks, metrics.cost_micros FROM customer WHERE segments.date BETWEEN '${since}' AND '${until}'`);
