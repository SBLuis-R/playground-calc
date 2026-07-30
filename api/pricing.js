const { supabase, getAccountByToken, requireManager, sendJson, readBody } = require('./_lib/db');

// Valores padrão de fábrica — usados só se ainda não houver nada salvo no banco.
const DEFAULT_PRICING = {
  tiersEmissoes: [
    { limit: 30, price: 77 }, { limit: 100, price: 137 }, { limit: 200, price: 207 }, { limit: 300, price: 267 },
    { limit: 400, price: 337 }, { limit: 500, price: 367 }, { limit: 600, price: 407 }, { limit: 700, price: 437 },
    { limit: 800, price: 467 }, { limit: 900, price: 507 }, { limit: 1000, price: 547 }, { limit: 1500, price: 657 },
    { limit: 2000, price: 757 }, { limit: 2500, price: 847 }, { limit: 3000, price: 917 }, { limit: 3500, price: 987 },
    { limit: 4000, price: 1057 }, { limit: 4500, price: 1097 }, { limit: 5000, price: 1137 },
  ],
  ciotTiers: [
    { limit: 30, price: 77 }, { limit: 100, price: 97 }, { limit: 200, price: 147 }, { limit: 400, price: 197 },
  ],
  pedagioTiers: [
    { limit: 1000, price: 197 },
    { limit: 5000, price: 297 }, { limit: 10000, price: 347 }, { limit: 20000, price: 497 }, { limit: 30000, price: 647 },
  ],
  recursosFixos: [
    { id: 'edi', nome: 'Integração EDI', preco: 67 },
    { id: 'averb', nome: 'Averbação automática', preco: 47 },
    { id: 'fin', nome: 'Controle financeiro', preco: 37 },
    { id: 'lote', nome: 'Emissão em lote', preco: 37 },
    { id: 'frete', nome: 'Tabela de frete', preco: 37 },
    { id: 'coleta', nome: 'Ordem de coleta', preco: 27 },
    { id: 'gnre', nome: 'Emissão GNRe', preco: 27 },
  ],
};

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const token = req.query.token;
    const acc = token ? await getAccountByToken(token) : null;

    // Se for gestor com override pessoal salvo, devolve o override
    if (acc && acc.role === 'manager') {
      const { data: override } = await supabase
        .from('pricing_override')
        .select('data')
        .eq('account_id', acc.id)
        .maybeSingle();
      if (override) return sendJson(res, 200, { data: override.data, scope: 'personal' });
    }

    const { data: global } = await supabase
      .from('pricing_config')
      .select('data')
      .eq('id', 1)
      .maybeSingle();

    return sendJson(res, 200, { data: global ? global.data : DEFAULT_PRICING, scope: 'global' });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: 'invalid_body' }); }

    const manager = await requireManager(body.token);
    if (!manager) return sendJson(res, 401, { error: 'unauthorized' });

    const { data, scope } = body;
    if (!data) return sendJson(res, 400, { error: 'missing_data' });

    if (scope === 'personal') {
      const { error } = await supabase
        .from('pricing_override')
        .upsert({ account_id: manager.id, data, updated_at: new Date().toISOString() });
      if (error) return sendJson(res, 500, { error: 'db_error', details: error.message });
      return sendJson(res, 200, { ok: true, scope: 'personal' });
    }

    // scope === 'global' (padrão)
    const { error } = await supabase
      .from('pricing_config')
      .upsert({ id: 1, data, updated_at: new Date().toISOString() });
    if (error) return sendJson(res, 500, { error: 'db_error', details: error.message });
    return sendJson(res, 200, { ok: true, scope: 'global' });
  }

  return sendJson(res, 405, { error: 'method_not_allowed' });
};
