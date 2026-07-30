const { supabase, generateToken, sendJson, readBody } = require('./_lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });

  let body;
  try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: 'invalid_body' }); }

  const name = (body.name || '').trim();
  if (!name || name.length < 2) {
    return sendJson(res, 400, { error: 'invalid_name' });
  }

  const token = generateToken();

  const { data, error } = await supabase
    .from('accounts')
    .insert({ name, role: 'seller', status: 'pending', token })
    .select()
    .single();

  if (error) {
    return sendJson(res, 500, { error: 'db_error', details: error.message });
  }

  return sendJson(res, 200, { token: data.token, status: data.status });
};
