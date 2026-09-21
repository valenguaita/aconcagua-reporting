const { makeTikTokHandler, BASE_METRICS } = require('./_lib/tiktokHandler');

module.exports = makeTikTokHandler({
  level: 'AUCTION_CAMPAIGN',
  dimensions: ['campaign_id'],
  metrics: ['campaign_name', ...BASE_METRICS]
});
