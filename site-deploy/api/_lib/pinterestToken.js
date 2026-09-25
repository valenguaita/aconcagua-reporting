// Token de Pinterest con renovación automática. El par de tokens más reciente se guarda en Supabase
// (tabla platform_tokens, solo accesible con la service_role key) porque cada renovación entrega un
// refresh token nuevo y las variables de Vercel no se pueden modificar desde el código.
// Si faltan las variables nuevas se usa PINTEREST_ACCESS_TOKEN como antes (compatibilidad).
const DAY = 86400000;
let mem = null;

function configured() {
  return !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET);
}

// Las claves nuevas de Supabase (sb_secret_...) van solo en "apikey"; las viejas (service_role, un JWT) también en Authorization.
function sbHeaders(extra) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const h = { apikey: k, 'Content-Type': 'application/json', ...(extra || {}) };
  if (!k.startsWith('sb_')) h.Authorization = `Bearer ${k}`;
  return h;
}

async function readRow() {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/platform_tokens?provider=eq.pinterest&select=*`, { headers: sbHeaders() });
  if (!res.ok) throw new Error('No se pudo leer platform_tokens (' + res.status + ')');
  const rows = await res.json();
  return rows[0] || null;
}

async function saveRow(t) {
  const now = Date.now();
  const body = {
    provider: 'pinterest',
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    access_expires_at: new Date(now + (t.expires_in || 2592000) * 1000).toISOString(),
    refresh_expires_at: new Date(now + (t.refresh_token_expires_in || 5184000) * 1000).toISOString(),
    updated_at: new Date(now).toISOString()
  };
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/platform_tokens?on_conflict=provider`, {
    method: 'POST', headers: sbHeaders({ Prefer: 'resolution=merge-duplicates' }), body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('No se pudo guardar platform_tokens (' + res.status + ')');
  return body;
}

async function doRefresh(refreshToken) {
  const basic = Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) throw new Error(json.message || 'No se pudo renovar el token de Pinterest');
  return json;
}

// Devuelve un access token válido. Renueva si le queda menos de minRemainingMs (o si force).
async function resolveToken({ force, minRemainingMs }) {
  if (!configured()) return process.env.PINTEREST_ACCESS_TOKEN;
  if (!force && mem && mem.exp - Date.now() > minRemainingMs) return mem.access;
  const row = await readRow();
  if (!force && row && new Date(row.access_expires_at).getTime() - Date.now() > minRemainingMs) {
    mem = { access: row.access_token, exp: new Date(row.access_expires_at).getTime() };
    return row.access_token;
  }
  const candidates = [row && row.refresh_token, process.env.PINTEREST_REFRESH_TOKEN].filter(Boolean);
  if (!candidates.length) return (row && row.access_token) || process.env.PINTEREST_ACCESS_TOKEN;
  let lastErr;
  for (const rt of candidates) {
    try {
      const saved = await saveRow(await doRefresh(rt));
      mem = { access: saved.access_token, exp: new Date(saved.access_expires_at).getTime() };
      return saved.access_token;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

// Si la renovación automática falla (variables mal cargadas, Supabase caído, etc.) y existe el token fijo
// anterior, se usa ese para no cortar el servicio. Con strict (tarea diaria) el error se propaga para verlo.
async function getPinterestToken({ force = false, minRemainingMs = DAY, strict = false } = {}) {
  try {
    return await resolveToken({ force, minRemainingMs });
  } catch (e) {
    if (!strict && process.env.PINTEREST_ACCESS_TOKEN) return process.env.PINTEREST_ACCESS_TOKEN;
    throw e;
  }
}

async function pinterestTokenStatus() {
  if (!configured()) return { mode: 'legacy', note: 'Usa PINTEREST_ACCESS_TOKEN fijo (sin renovación automática)' };
  const row = await readRow();
  return row ? { mode: 'auto', accessExpiresAt: row.access_expires_at, refreshExpiresAt: row.refresh_expires_at, updatedAt: row.updated_at } : { mode: 'auto', note: 'Sin fila todavía' };
}

module.exports = { getPinterestToken, pinterestTokenStatus, DAY };
