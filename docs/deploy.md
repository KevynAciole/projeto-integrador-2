# Deploy

## Railway: API e PostgreSQL

1. Crie um projeto Railway com serviço PostgreSQL e serviço Node conectado ao repositório.
2. Mantenha a raiz do repositório como diretório do serviço. `railway.json` define build, migração, comando de start e health check. O projeto requer Node.js 22 ou superior.
3. Configure as variáveis `DATABASE_URL` (referência interna do PostgreSQL Railway), `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `ADMIN_EMAILS`, `CLIENT_URL`, `CORS_ORIGIN` e `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM`.
4. Defina `GOOGLE_CALLBACK_URL` como `https://<dominio-api>/auth/google/callback` e autorize esse URI no cliente OAuth do Google.
5. O comando de deploy executa `prisma migrate deploy` antes de iniciar a API. Verifique `/health` e `/api/docs` no domínio Railway.

Use um segredo aleatório forte em `SESSION_SECRET`; nunca o versione. Configure `CLIENT_URL` e `CORS_ORIGIN` com a origem HTTPS exata do frontend Vercel.

## Vercel: frontend

1. Importe o mesmo repositório na Vercel, com raiz do projeto na raiz do monorepo.
2. `vercel.json` configura o build do workspace frontend, `frontend/dist` como saída e fallback SPA.
3. Configure `VITE_API_URL` com o domínio HTTPS público do serviço Railway, sem barra final.
4. Atualize no Railway `CLIENT_URL` e `CORS_ORIGIN` para o domínio Vercel definitivo.
5. No cliente OAuth Google, cadastre a origem Vercel em *Authorized JavaScript origins* e a URL Railway em *Authorized redirect URIs*.

Depois do deploy, valide o login, um GET autenticado de estoque, a compra de um item e o relatório do mês. Em produção, cookies cross-site exigem HTTPS (`SameSite=None; Secure`), já configurado quando `NODE_ENV=production`.