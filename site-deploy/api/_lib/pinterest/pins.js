const { makeEntityHandler } = require('../pinterestHandler');

module.exports = makeEntityHandler({ entity: 'ads', idField: 'ad', nameColumn: 'AD_NAME', extraColumns: ['PIN_ID'] });
