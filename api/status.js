const { getAccountByToken, sendJson } = require('./_lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' });

  const token = req.query.token;
  if (!token) return sendJson(res, 400, { error: 'missing_token' });

  const acc = await getAccountByToken(token);
  if (!acc) return sendJson(res, 404, { error: 'not_found' });

  return sendJson(res, 200, {
    status: acc.status,
    role: acc.role,
    name: acc.name,
  });
};
