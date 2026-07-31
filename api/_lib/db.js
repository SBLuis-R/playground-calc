const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Cliente com a service role key: roda só no servidor, nunca no navegador.
// Ignora RLS de propósito — todo controle de acesso é feito aqui nas funções.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function checkPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Busca uma conta pelo token (seller aprovado OU manager com sessão válida)
async function getAccountByToken(token) {
  if (!token) return null;
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

// Exige uma sessão de gestor válida (token + não expirado). Retorna a conta ou null.
async function requireManager(token) {
  const acc = await getAccountByToken(token);
  if (!acc) return null;
  if (acc.role !== 'manager') return null;
  if (acc.status !== 'approved') return null;
  if (acc.session_expires_at && new Date(acc.session_expires_at) < new Date()) return null;
  return acc;
}

function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  // A runtime Node.js da Vercel já faz o parse do corpo (JSON/urlencoded)
  // e disponibiliza em req.body — não dá pra ler o stream de novo.
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try { return Promise.resolve(req.body ? JSON.parse(req.body) : {}); }
      catch (e) { return Promise.resolve({}); }
    }
    return Promise.resolve(req.body);
  }
  // Fallback (ambientes que não fazem o parse automático)
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

module.exports = {
  supabase,
  generateToken,
  hashPassword,
  checkPassword,
  getAccountByToken,
  requireManager,
  sendJson,
  readBody,
};
