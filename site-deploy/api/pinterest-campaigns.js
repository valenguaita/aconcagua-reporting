const { makeEntityHandler } = require('./_lib/pinterestHandler');

module.exports = makeEntityHandler({ entity: 'campaigns', idField: 'campaign', nameColumn: 'CAMPAIGN_NAME' });
