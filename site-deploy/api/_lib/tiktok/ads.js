const { makeTikTokHandler, BASE_METRICS } = require('../tiktokHandler');

module.exports = makeTikTokHandler({
  level: 'AUCTION_AD',
  dimensions: ['ad_id'],
  metrics: ['ad_name', 'campaign_id', ...BASE_METRICS, 'video_play_actions', 'video_watched_2s', 'video_watched_6s', 'video_views_p25', 'video_views_p50', 'video_views_p75', 'video_views_p100', 'average_video_play']
});
