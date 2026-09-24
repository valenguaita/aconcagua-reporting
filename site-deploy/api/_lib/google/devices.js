const { makeGoogleHandler } = require('../googleHandler');

module.exports = makeGoogleHandler((since, until) =>
  `SELECT campaign.id, segments.device, metrics.clicks, metrics.cost_micros FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}' AND metrics.impressions > 0`);
