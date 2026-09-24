const { verifySession, isValidAccountId, isValidDate } = require('./verifySession');

const PINTEREST_API = 'https://api.pinterest.com/v5';

async function pinterestGet(path) {
  const res = await fetch(`${PINTEREST_API}${path}`, {
    headers: { Authorization: `Bearer ${process.env.PINTEREST_ACCESS_TOKEN}` }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error de la API de Pinterest');
  return json;
}

const BASE_COLUMNS = ['SPEND_IN_MICRO_DOLLAR', 'TOTAL_IMPRESSION', 'OUTBOUND_CLICK_1', 'TOTAL_CLICKTHROUGH', 'REPIN_1', 'TOTAL_CHECKOUT', 'TOTAL_CHECKOUT_VALUE_IN_MICRO_DOLLAR', 'CTR', 'CHECKOUT_ROAS'];

function makeAccountHandler({ granularity }) {
  return async (req, res) => {
    const user = await verifySession(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const { accountId, since, until } = req.query || {};
    if (!isValidAccountId(accountId) || !isValidDate(since) || !isValidDate(until)) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    const qs = new URLSearchParams({
      start_date: since,
      end_date: until,
      granularity,
      columns: BASE_COLUMNS.join(',')
    });

    try {
      const json = await pinterestGet(`/ad_accounts/${accountId}/analytics?${qs}`);
      res.status(200).json({ data: Array.isArray(json) ? json : [] });
    } catch (e) {
      res.status(502).json({ error: 'No se pudo conectar con la API de Pinterest: ' + e.message });
    }
  };
}

function makeEntityHandler({ entity, idField, nameColumn, extraColumns, granularity }) {
  return async (req, res) => {
    const user = await verifySession(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const { accountId, since, until } = req.query || {};
    if (!isValidAccountId(accountId) || !isValidDate(since) || !isValidDate(until)) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    try {
      const list = await pinterestGet(`/ad_accounts/${accountId}/${entity}?page_size=100&entity_statuses=ACTIVE,PAUSED`);
      const ids = (list.items || []).map((it) => it.id);
      if (!ids.length) return res.status(200).json({ data: [] });

      const qs = new URLSearchParams({
        start_date: since,
        end_date: until,
        granularity: granularity || 'TOTAL',
        columns: [nameColumn, ...BASE_COLUMNS, ...(extraColumns || [])].join(','),
        [`${idField}_ids`]: ids.join(',')
      });
      const json = await pinterestGet(`/ad_accounts/${accountId}/${entity}/analytics?${qs}`);
      res.status(200).json({ data: Array.isArray(json) ? json : [] });
    } catch (e) {
      res.status(502).json({ error: 'No se pudo conectar con la API de Pinterest: ' + e.message });
    }
  };
}

module.exports = { makeAccountHandler, makeEntityHandler, BASE_COLUMNS };
