// Panel de "Equipo": invitar/sacar gente de Aconcagua desde la propia app, en vez de entrar a Supabase
// a mano. Usa la Admin API de Supabase (necesita SUPABASE_SERVICE_ROLE_KEY) y solo la puede tocar
// alguien cuyo mail esté en ADMIN_EMAILS (lista separada por comas), sin importar si tiene sesión válida.
const { verifySession } = require('./_lib/verifySession');

function isAdmin(email) {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(String(email).toLowerCase());
}

async function sbAdmin(path, opts) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, 'Content-Type': 'application/json', ...((opts && opts.headers) || {}) };
  if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(`${process.env.SUPABASE_URL}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.msg || json.message || json.error_description || `Error ${res.status}`);
  return json;
}

module.exports = async (req, res) => {
  const user = await verifySession(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  if (!isAdmin(user.email)) return res.status(403).json({ error: 'Esta sección es solo para administradores.' });

  const { type, email, id } = req.query || {};
  try {
    if (type === 'list') {
      const json = await sbAdmin('/auth/v1/admin/users?per_page=200');
      const users = (json.users || []).map(u => ({
        id: u.id, email: u.email,
        confirmed: !!(u.email_confirmed_at || u.confirmed_at),
        lastSignIn: u.last_sign_in_at, invitedAt: u.invited_at || u.created_at
      })).sort((a, b) => (a.email || '').localeCompare(b.email || ''));
      return res.status(200).json({ users });
    }
    if (type === 'invite') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
      if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Mail inválido' });
      await sbAdmin('/auth/v1/invite', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase() }) });
      return res.status(200).json({ ok: true });
    }
    if (type === 'remove') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
      if (!id) return res.status(400).json({ error: 'Falta el id' });
      if (id === user.id) return res.status(400).json({ error: 'No podés sacarte tu propio acceso desde acá.' });
      await sbAdmin(`/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Tipo inválido' });
  } catch (e) {
    res.status(502).json({ error: 'No se pudo completar la acción: ' + e.message });
  }
};
