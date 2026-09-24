const { makeGoogleHandler } = require('../googleHandler');

module.exports = makeGoogleHandler((since, until) =>
  `SELECT metrics.search_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share FROM customer WHERE segments.date BETWEEN '${since}' AND '${until}'`);
