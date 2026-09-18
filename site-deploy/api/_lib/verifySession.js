async function verifySession(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}
function isValidAccountId(id) {
  return typeof id === 'string' && /^(act_)?\d+$/.test(id);
}
function isValidDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
module.exports = { verifySession, isValidAccountId, isValidDate };
