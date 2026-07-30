const { supabase, sendJson } = require('./_lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' });

  const { count, error } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'manager');

  if (error) return sendJson(res, 500, { error: 'db_error', details: error.message });

  return sendJson(res, 200, { exists: (count || 0) > 0 });
};
