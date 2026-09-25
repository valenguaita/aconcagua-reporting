const { verifySession, isValidDate } = require('./verifySession');

const API_VERSION = 'v24';
let cached = { token: null, exp: 0 };

async function getAccessToken() {
  if (cached.token && Date.now() < cached.exp - 60000) return cached.token;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) throw new Error(json.error_description || 'No se pudo autenticar con Google');
  cached = { token: json.access_token, exp: Date.now() + (json.expires_in || 3600) * 1000 };
  return cached.token;
}

async function searchGoogle(customerId, query) {
  const token = await getAccessToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    'Content-Type': 'application/json'
  };
  const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`;
  const rows = [];
  let pageToken;
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(pageToken ? { query, pageToken } : { query }) });
    const json = await res.json();
    if (!res.ok) {
      const d = json.error && json.error.details && json.error.details[0] && json.error.details[0].errors && json.error.details[0].errors[0];
      throw new Error((d && d.message) || (json.error && json.error.message) || 'Error de la API de Google Ads');
    }
    rows.push(...(json.results || []));
    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }
  return rows;
}

const METRICS = 'metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value';

function makeGoogleHandler(buildQuery) {
  return async (req, res) => {
    const user = await verifySession(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const { customerId, since, until } = req.query || {};
    if (typeof customerId !== 'string' || !/^\d{10}$/.test(customerId) || !isValidDate(since) || !isValidDate(until)) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    try {
      const data = await searchGoogle(customerId, buildQuery(since, until));
      res.status(200).json({ data });
    } catch (e) {
      res.status(502).json({ error: 'No se pudo conectar con la API de Google Ads: ' + e.message });
    }
  };
}

module.exports = { makeGoogleHandler, METRICS, getAccessToken };
