const { makeTikTokHandler, BASE_METRICS } = require('../tiktokHandler');

module.exports = makeTikTokHandler({
  level: 'AUCTION_AD',
  dimensions: ['ad_id'],
  metrics: ['ad_name', 'campaign_id', ...BASE_METRICS, 'video_play_actions', 'video_views_p100']
});
