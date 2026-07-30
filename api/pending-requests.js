const { supabase, requireManager, sendJson, readBody } = require('./_lib/db');

function getBearerToken(req) {
  const header = req.headers['authorization'] || '';
  const match = header.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}

module.exports = async (req, res) => {
  const managerToken = getBearerToken(req);
  const manager = await requireManager(managerToken);
  if (!manager) return sendJson(res, 401, { error: 'unauthorized' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, name, status, created_at')
      .eq('role', 'seller')
      .order('created_at', { ascending: true });

    if (error) return sendJson(res, 500, { error: 'db_error', details: error.message });
    return sendJson(res, 200, { accounts: data });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: 'invalid_body' }); }

    const { accountId, action } = body;
    if (!accountId || !['approve', 'reject'].includes(action)) {
      return sendJson(res, 400, { error: 'invalid_params' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error } = await supabase
      .from('accounts')
      .update({ status: newStatus, approved_at: action === 'approve' ? new Date().toISOString() : null })
      .eq('id', accountId)
      .eq('role', 'seller');

    if (error) return sendJson(res, 500, { error: 'db_error', details: error.message });
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 405, { error: 'method_not_allowed' });
};
