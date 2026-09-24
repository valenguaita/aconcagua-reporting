const { makeGoogleHandler, METRICS } = require('./_lib/googleHandler');

module.exports = makeGoogleHandler((since, until) =>
  `SELECT segments.date, ${METRICS} FROM customer WHERE segments.date BETWEEN '${since}' AND '${until}' ORDER BY segments.date`);
