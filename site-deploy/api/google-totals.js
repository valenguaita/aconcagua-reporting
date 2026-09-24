const { makeGoogleHandler, METRICS } = require('./_lib/googleHandler');

module.exports = makeGoogleHandler((since, until) =>
  `SELECT ${METRICS} FROM customer WHERE segments.date BETWEEN '${since}' AND '${until}'`);
