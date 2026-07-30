-- ====================================================================
-- Schema da Calculadora de Planos: contas, aprovações, preços e prefs
-- Rode este arquivo inteiro no SQL Editor do Supabase (uma vez só).
-- ====================================================================

create extension if not exists "pgcrypto";

-- Tabela única de contas (vendedores E gestores)
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,                    -- só preenchido para gestores
  password_hash text,                   -- só preenchido para gestores
  role text not null default 'seller',  -- 'seller' | 'manager'
  status text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  token text unique not null,           -- token do dispositivo/sessão
  session_expires_at timestamptz,       -- só usado para sessão de gestor
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists idx_accounts_token on accounts(token);
create index if not exists idx_accounts_role_status on accounts(role, status);

-- Tabela de preços/regras global (uma linha só, id fixo = 1)
create table if not exists pricing_config (
  id int primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Override de preços pessoal (só para gestores testarem sem afetar todos)
create table if not exists pricing_override (
  account_id uuid primary key references accounts(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Preferências pessoais (periodicidade padrão, textos da proposta, etc.)
create table if not exists preferences (
  account_id uuid primary key references accounts(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Como todo acesso passa pelas funções serverless (com a service role key),
-- não precisamos de políticas de RLS complexas — deixamos a tabela travada
-- para o cliente anônimo e só a service role (usada nas funções) acessa.
alter table accounts enable row level security;
alter table pricing_config enable row level security;
alter table pricing_override enable row level security;
alter table preferences enable row level security;
-- (nenhuma policy criada = acesso público bloqueado; só a service role, que
-- ignora RLS, consegue ler/escrever — exatamente o que as funções usam)
