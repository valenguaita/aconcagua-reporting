const { makeEntityHandler } = require('../pinterestHandler');

module.exports = makeEntityHandler({ entity: 'campaigns', idField: 'campaign', nameColumn: 'CAMPAIGN_NAME' });
