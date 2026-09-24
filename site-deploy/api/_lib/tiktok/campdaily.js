const { makeTikTokHandler, BASE_METRICS } = require('../tiktokHandler');

module.exports = makeTikTokHandler({
  level: 'AUCTION_CAMPAIGN',
  dimensions: ['campaign_id', 'stat_time_day'],
  metrics: BASE_METRICS
});
