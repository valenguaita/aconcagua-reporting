const { makeTikTokHandler, BASE_METRICS } = require('../tiktokHandler');

module.exports = makeTikTokHandler({
  level: 'AUCTION_ADVERTISER',
  dimensions: ['stat_time_day'],
  metrics: BASE_METRICS
});
