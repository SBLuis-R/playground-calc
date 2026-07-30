const { supabase, generateToken, checkPassword, sendJson, readBody } = require('./_lib/db');

const SESSION_DAYS = 30;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });

  let body;
  try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: 'invalid_body' }); }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  const { data: acc, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('role', 'manager')
    .eq('email', email)
    .maybeSingle();

  if (error) return sendJson(res, 500, { error: 'db_error', details: error.message });
  if (!acc) return sendJson(res, 401, { error: 'invalid_credentials' });

  const ok = await checkPassword(password, acc.password_hash || '');
  if (!ok) return sendJson(res, 401, { error: 'invalid_credentials' });

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: updErr } = await supabase
    .from('accounts')
    .update({ token, session_expires_at: expiresAt })
    .eq('id', acc.id);

  if (updErr) return sendJson(res, 500, { error: 'db_error', details: updErr.message });

  return sendJson(res, 200, { token });
};
