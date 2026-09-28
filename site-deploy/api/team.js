// Panel de "Equipo": invitar/sacar gente de Aconcagua y dar/sacar admin desde la propia app, en vez de
// entrar a Supabase o Vercel a mano. Usa la Admin API de Supabase (SUPABASE_SERVICE_ROLE_KEY).
// Dos formas de ser admin, combinadas: los mails fijos de ADMIN_EMAILS (siempre admin, no se pueden sacar
// desde acá — así nunca te quedás afuera vos mismo por error) y los que estén en la tabla `admins`
// (esos sí se agregan/sacan desde la pantalla).
const { verifySession } = require('./_lib/verifySession');

function seedAdmins() {
  return (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}
function isSeedAdmin(email) { return !!email && seedAdmins().includes(String(email).toLowerCase()); }

async function sbAdmin(path, opts) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, 'Content-Type': 'application/json', ...((opts && opts.headers) || {}) };
  if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(`${process.env.SUPABASE_URL}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.msg || json.message || json.error_description || `Error ${res.status}`);
  return json;
}

async function dbAdminIds() {
  const rows = await sbAdmin('/rest/v1/admins?select=user_id');
  return new Set((rows || []).map(r => r.user_id));
}
async function isAdmin(user) {
  if (isSeedAdmin(user.email)) return true;
  try { return (await dbAdminIds()).has(user.id); } catch (e) { return false; }
}

module.exports = async (req, res) => {
  const user = await verifySession(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  if (!(await isAdmin(user))) return res.status(403).json({ error: 'Esta sección es solo para administradores.' });

  const { type, email, id } = req.query || {};
  try {
    if (type === 'list') {
      const [json, admins] = await Promise.all([
        sbAdmin('/auth/v1/admin/users?per_page=200'),
        dbAdminIds()
      ]);
      const users = (json.users || []).map(u => ({
        id: u.id, email: u.email,
        confirmed: !!(u.email_confirmed_at || u.confirmed_at),
        lastSignIn: u.last_sign_in_at, invitedAt: u.invited_at || u.created_at,
        isSeedAdmin: isSeedAdmin(u.email),
        isAdmin: isSeedAdmin(u.email) || admins.has(u.id)
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
      await sbAdmin(`/rest/v1/admins?user_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
      return res.status(200).json({ ok: true });
    }
    if (type === 'promote') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
      if (!id || !email) return res.status(400).json({ error: 'Falta el id o el mail' });
      await sbAdmin('/rest/v1/admins?on_conflict=user_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ user_id: id, email: String(email).toLowerCase(), added_by: user.email })
      });
      return res.status(200).json({ ok: true });
    }
    if (type === 'demote') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
      if (!id) return res.status(400).json({ error: 'Falta el id' });
      if (id === user.id) return res.status(400).json({ error: 'No te podés sacar el admin a vos mismo desde acá.' });
      if (isSeedAdmin(email)) return res.status(400).json({ error: 'Ese admin está fijo por configuración (ADMIN_EMAILS) — no se puede sacar desde acá.' });
      await sbAdmin(`/rest/v1/admins?user_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Tipo inválido' });
  } catch (e) {
    res.status(502).json({ error: 'No se pudo completar la acción: ' + e.message });
  }
};
