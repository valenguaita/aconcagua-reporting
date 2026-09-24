const { makeGoogleHandler } = require('../googleHandler');

module.exports = makeGoogleHandler((since, until) =>
  `SELECT campaign.id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.quality_info.quality_score, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM keyword_view WHERE segments.date BETWEEN '${since}' AND '${until}' AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT 2000`);
