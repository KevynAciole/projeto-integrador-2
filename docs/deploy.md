# Deploy

## Railway: API e PostgreSQL

1. Crie um projeto Railway com serviço PostgreSQL e serviço Node conectado ao repositório.
2. Mantenha a raiz do repositório como diretório do serviço. `railway.json` define build, migração, comando de start e health check. O projeto requer Node.js 22 ou superior.
3. Configure as variáveis `DATABASE_URL` (referência interna do PostgreSQL Railway), `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `ADMIN_EMAILS`, `CLIENT_URL`, `CORS_ORIGIN`, `RESEND_API_KEY` e `RESEND_FROM`.
4. Defina `GOOGLE_CALLBACK_URL` como a URL pública da API Railway terminando em `/auth/google/callback` e autorize esse URI no cliente OAuth do Google.
5. O comando de deploy executa `prisma migrate deploy` antes de iniciar a API. Verifique `/health` e `/api/docs` no domínio Railway.

Use um segredo aleatório forte em `SESSION_SECRET`; nunca o versione. Configure `CLIENT_URL` e `CORS_ORIGIN` com a origem HTTPS exata do frontend escolhido.
Crie uma API key no Resend e verifique o domínio usado em `RESEND_FROM` antes de enviar e-mails para usuários. O remetente de teste `onboarding@resend.dev` só entrega para destinatários autorizados pela conta Resend.

## Render: frontend, API e PostgreSQL

Este é o procedimento recomendado para publicar todos os componentes no Render. O deploy Railway acima permanece documentado para referência, mas não é necessário neste cenário. O projeto usa PostgreSQL com Prisma, API Node/Express e frontend React/Vite, todos compatíveis com o Render.

### 1. Criar o PostgreSQL

1. Acesse o [Render Dashboard](https://dashboard.render.com/) e selecione **New > PostgreSQL**.
2. Escolha um nome, uma região e o plano desejado. Use a mesma região no Web Service para reduzir a latência.
3. Após a criação, abra o banco e copie a **Internal Database URL**. Ela será usada como `DATABASE_URL` no Web Service da API.
4. Em produção, configure backups e retenção conforme a necessidade do projeto. Não use um banco descartável para dados reais.

### 2. Criar o Web Service da API

1. Selecione **New > Web Service**, conecte o repositório GitHub e escolha a branch de produção.
2. Configure:
   - **Root Directory:** deixe vazio, usando a raiz do monorepo;
   - **Runtime:** Node;
   - **Build Command:** `npm install --include=dev && npm run build --workspace @minimercado/backend`;
   - **Start Command:** `npm run db:deploy --workspace @minimercado/backend && npm start --workspace @minimercado/backend`;
   - **Health Check Path:** `/health`;
   - **Node Version:** `22` ou superior. O projeto declara essa exigência no `package.json`.
3. Em **Environment**, adicione as variáveis abaixo:

```env
NODE_ENV=production
DATABASE_URL=<Internal Database URL do PostgreSQL Render>
SESSION_SECRET=<segredo aleatório forte com pelo menos 32 caracteres>
GOOGLE_CLIENT_ID=<client ID do Google>
GOOGLE_CLIENT_SECRET=<client secret do Google>
GOOGLE_CALLBACK_URL=https://<dominio-da-api>/auth/google/callback
ADMIN_EMAILS=admin@exemplo.com
CLIENT_URL=https://<dominio-do-frontend>
CORS_ORIGIN=https://<dominio-do-frontend>
RESEND_API_KEY=<chave do Resend>
RESEND_FROM=Minimercado <acesso@seu-dominio.com>
```

Não é necessário definir `PORT`: o Render fornece essa variável e [backend/src/server.ts](../backend/src/server.ts) já a utiliza. `VITE_API_URL` será configurada somente no Static Site.

4. Faça o deploy e aguarde o status **Live**.
5. Teste `https://<dominio-do-render>/health` e `https://<dominio-do-render>/api/docs`. O primeiro deve retornar `{"status":"ok"}`.
6. Confira os logs do deploy. O comando de inicialização executa `prisma migrate deploy` antes de iniciar a API; não execute `prisma migrate dev` no ambiente de produção.

### 3. Criar o Static Site do frontend

1. Selecione **New > Static Site**, conecte o mesmo repositório e use a mesma branch da API.
2. Configure:
   - **Root Directory:** deixe vazio, usando a raiz do monorepo;
   - **Build Command:** `npm install --include=dev && npm run build --workspace @minimercado/frontend`;
   - **Publish Directory:** `frontend/dist`.
3. Adicione a variável de ambiente:

```env
VITE_API_URL=https://<dominio-da-api>
```

4. Em **Redirects/Rewrites**, crie uma regra de rewrite de `/*` para `/index.html`, para que as rotas do React funcionem após atualizar a página.
5. Publique o Static Site e anote o domínio, por exemplo `https://minimercado-frontend.onrender.com`.
6. Volte ao Web Service da API e atualize `CLIENT_URL` e `CORS_ORIGIN` com esse domínio exato, sem barra final.

O frontend usa `VITE_API_URL` em produção para chamar diretamente a API Render. As requisições incluem credenciais, e a API configura o cookie de sessão como `Secure` e `SameSite=None`.

### 4. Configurar o Google OAuth

Depois de conhecer o domínio definitivo do frontend:

1. No Google Cloud Console, abra o cliente OAuth usado pelo projeto.
2. Em **Authorized JavaScript origins**, adicione `https://<dominio-do-frontend>`.
3. Em **Authorized redirect URIs**, adicione exatamente `https://<dominio-da-api>/auth/google/callback`.
4. Atualize `GOOGLE_CALLBACK_URL` no Web Service para essa mesma URL, sem barra final adicional.
5. Salve e faça um novo deploy da API se alguma variável tiver sido alterada.

### 5. Checklist de validação

1. Abra `/health` e `/api/docs` no domínio da API Render.
2. Abra o frontend e confirme que não há erros de CORS no navegador.
3. Teste login local, troca de senha e logout.
4. Teste login Google e confirme que o retorno ocorre no domínio do frontend.
5. Teste leitura de estoque, cadastro/alteração de produto, compra e relatório mensal.
6. Confirme nos logs que as migrações foram aplicadas sem erro.
7. Verifique se o cookie `sid` está sendo criado com `Secure` e `HttpOnly`.

Não versione `.env`, URLs que contenham credenciais, chaves OAuth ou API keys. O arquivo [backend/src/app.ts](../backend/src/app.ts) configura sessões persistentes no PostgreSQL em produção quando `DATABASE_URL` está presente.

Depois do deploy, valide o login local e Google, um GET autenticado de estoque, a compra de um item e o relatório do mês. Como o frontend e a API usam domínios Render diferentes, a API deve manter `CORS_ORIGIN` igual à URL do Static Site; os cookies de sessão continuam usando HTTPS, `SameSite=None` e `Secure`.