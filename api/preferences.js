const { supabase, getAccountByToken, sendJson, readBody } = require('./_lib/db');

const DEFAULT_PREFERENCES = {
  periodoPadrao: 1, // 1=mensal, 3=trimestral, 12=anual
  preMarcados: {},  // { edi:true, averb:false, ..., ciot:false, vpo:false }
  tituloProposta: 'Plano Mensal',
  observacaoFinal: 'O número de emissões é o total entre CTe e MDFe',
  check: '✓',
  copyLines: null,  // null = o front monta a lista padrão a partir dos recursos
  modoLivre: false,
  textoLivre: '',
};

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const token = req.query.token;
    const acc = await getAccountByToken(token);
    if (!acc || acc.status !== 'approved') return sendJson(res, 401, { error: 'unauthorized' });

    const { data } = await supabase
      .from('preferences')
      .select('data')
      .eq('account_id', acc.id)
      .maybeSingle();

    return sendJson(res, 200, { data: data ? data.data : DEFAULT_PREFERENCES });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: 'invalid_body' }); }

    const acc = await getAccountByToken(body.token);
    if (!acc || acc.status !== 'approved') return sendJson(res, 401, { error: 'unauthorized' });
    if (!body.data) return sendJson(res, 400, { error: 'missing_data' });

    const { error } = await supabase
      .from('preferences')
      .upsert({ account_id: acc.id, data: body.data, updated_at: new Date().toISOString() });

    if (error) return sendJson(res, 500, { error: 'db_error', details: error.message });
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 405, { error: 'method_not_allowed' });
};
