const { makeEntityHandler } = require('./_lib/pinterestHandler');

module.exports = makeEntityHandler({ entity: 'ads', idField: 'ad', nameColumn: 'AD_NAME', extraColumns: ['PIN_ID'] });
