const { makeGoogleHandler } = require('../googleHandler');

module.exports = makeGoogleHandler((since, until) =>
  `SELECT campaign.id, search_term_view.search_term, segments.keyword.info.text, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM search_term_view WHERE segments.date BETWEEN '${since}' AND '${until}' AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT 2000`);
