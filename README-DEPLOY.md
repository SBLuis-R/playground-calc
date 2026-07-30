# Como colocar no ar (Supabase + Vercel)

## 1. Supabase

1. Crie um projeto em https://supabase.com (se ainda não tiver).
2. No painel do projeto, vá em **SQL Editor** → cole o conteúdo de `supabase-schema.sql` → **Run**.
3. Vá em **Project Settings → API** e copie:
   - `Project URL` → vai virar a variável `SUPABASE_URL`
   - `service_role` key (**não** a `anon` key) → vai virar `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ a `service_role` key dá acesso total ao banco — nunca coloque no código do navegador, só nas variáveis de ambiente do Vercel (ela só é usada dentro das funções em `/api`, que rodam no servidor).

## 2. Arquivos do projeto

Coloque estes arquivos na raiz do seu projeto atual (junto do `index.html` que já existe):

```
/index.html          <- substitua pelo novo (já integrado com login/permissões)
/api/
  _lib/db.js
  request-access.js
  status.js
  manager-check.js
  manager-bootstrap.js
  manager-login.js
  pending-requests.js
  pricing.js
  preferences.js
/package.json
```

## 3. Variáveis de ambiente no Vercel

No painel do projeto na Vercel → **Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | a Project URL do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | a service_role key do Supabase |

Depois de adicionar, faça um novo deploy (ou "Redeploy") para que as variáveis entrem em vigor.

## 4. Primeiro acesso (virar gestor)

1. Abra o site. Digite qualquer nome na tela inicial — isso é só para testar o fluxo de vendedor (fica "aguardando aprovação").
2. Para virar gestor: no canto, clique em **⚙ Configurações → Área do gestor**.
3. Como ainda não existe nenhum gestor, o formulário vai avisar isso — digite um e-mail e uma senha (mín. 6 caracteres) e clique em **Entrar**. Isso cria a conta de gestor com essa senha (guarde bem, é ela que abre o modo gestor dali pra frente).
4. Agora, na aba **Área do gestor**, você verá a lista de solicitações pendentes (inclusive a que você mesmo criou) — aprove ou recuse.
5. Na aba **Tabela de preços** (só aparece pra gestor), edite os valores e escolha "Todo mundo" ou "Só para mim" antes de salvar.

## 5. Como funciona o acesso de vendedores

- Vendedor só digita o nome (sem senha). Isso cria uma solicitação com status `pending`.
- A tela do vendedor fica em "aguardando aprovação" e verifica sozinha a cada poucos segundos.
- O gestor aprova ou recusa pela aba **Área do gestor → Solicitações pendentes**.
- Depois de aprovado, o navegador guarda um token (localStorage) — em outro dispositivo, a pessoa precisa solicitar de novo e ser aprovada de novo (id novo por dispositivo).

## Observação de segurança

Este é um sistema simples para uso interno de uma equipe pequena. Ele não usa autenticação "de verdade" para vendedores (só nome + aprovação manual). Para um cenário com mais gente ou dados mais sensíveis, valeria migrar para Supabase Auth completo.
