const { makeGoogleHandler, METRICS } = require('../googleHandler');

module.exports = makeGoogleHandler((since, until) =>
  `SELECT campaign.id, segments.date, ${METRICS} FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}' AND metrics.impressions > 0`);
