const { makeGoogleHandler, METRICS } = require('../googleHandler');

module.exports = makeGoogleHandler((since, until) =>
  `SELECT campaign.id, campaign.name, campaign.advertising_channel_type, ${METRICS} FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}' AND metrics.impressions > 0`);
