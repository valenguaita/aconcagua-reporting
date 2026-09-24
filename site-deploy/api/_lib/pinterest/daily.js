const { makeAccountHandler } = require('../pinterestHandler');

module.exports = makeAccountHandler({ granularity: 'DAY' });
