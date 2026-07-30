const { supabase, generateToken, hashPassword, sendJson, readBody } = require('./_lib/db');

const SESSION_DAYS = 30;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });

  let body;
  try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: 'invalid_body' }); }

  const email = (body.email || '').trim().toLowerCase();
  const name = (body.name || 'Gestor').trim();
  const password = body.password || '';

  if (!email || !email.includes('@')) return sendJson(res, 400, { error: 'invalid_email' });
  if (password.length < 6) return sendJson(res, 400, { error: 'password_too_short' });

  // Só permite bootstrap se ainda não existir NENHUM gestor
  const { count, error: countErr } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'manager');

  if (countErr) return sendJson(res, 500, { error: 'db_error', details: countErr.message });
  if ((count || 0) > 0) return sendJson(res, 409, { error: 'manager_already_exists' });

  const passwordHash = await hashPassword(password);
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      name, email, password_hash: passwordHash,
      role: 'manager', status: 'approved',
      token, session_expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) return sendJson(res, 500, { error: 'db_error', details: error.message });

  return sendJson(res, 200, { token: data.token });
};
