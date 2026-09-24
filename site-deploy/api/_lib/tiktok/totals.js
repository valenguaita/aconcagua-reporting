const { makeTikTokHandler, BASE_METRICS, VIDEO_METRICS } = require('../tiktokHandler');

module.exports = makeTikTokHandler({
  level: 'AUCTION_ADVERTISER',
  dimensions: ['advertiser_id'],
  metrics: [...BASE_METRICS, 'reach', ...VIDEO_METRICS]
});
