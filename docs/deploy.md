# Deploy

## Railway: API e PostgreSQL

1. Crie um projeto Railway com serviço PostgreSQL e serviço Node conectado ao repositório.
2. Mantenha a raiz do repositório como diretório do serviço. `railway.json` define build, migração, comando de start e health check. O projeto requer Node.js 22 ou superior.
3. Configure as variáveis `DATABASE_URL` (referência interna do PostgreSQL Railway), `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `ADMIN_EMAILS`, `CLIENT_URL`, `CORS_ORIGIN`, `RESEND_API_KEY` e `RESEND_FROM`.
4. Defina `GOOGLE_CALLBACK_URL` como `https://<dominio-vercel>/auth/google/callback` e autorize esse URI no cliente OAuth do Google. O callback passa pelo proxy do Vercel e encaminha a sessão para o navegador no mesmo domínio do frontend.
5. O comando de deploy executa `prisma migrate deploy` antes de iniciar a API. Verifique `/health` e `/api/docs` no domínio Railway.

Use um segredo aleatório forte em `SESSION_SECRET`; nunca o versione. Configure `CLIENT_URL` e `CORS_ORIGIN` com a origem HTTPS exata do frontend Vercel.
Crie uma API key no Resend e verifique o domínio usado em `RESEND_FROM` antes de enviar e-mails para usuários. O remetente de teste `onboarding@resend.dev` só entrega para destinatários autorizados pela conta Resend.

## Vercel: frontend

1. Importe o mesmo repositório na Vercel, com raiz do projeto na raiz do monorepo.
2. `vercel.json` configura o build do workspace frontend, `frontend/dist` como saída e fallback SPA.
3. O frontend declara os bindings nativos Linux do Rolldown, do Lightning CSS e do Tailwind Oxide como dependências opcionais para o build Linux da Vercel.
4. Deixe `VITE_API_URL` vazio. As rotas da API são encaminhadas pelo `vercel.json` ao Railway para que os cookies de sessão sejam first-party no navegador.
5. Atualize no Railway `CLIENT_URL` e `CORS_ORIGIN` para a origem Vercel definitiva.
6. No cliente OAuth Google, cadastre a origem Vercel em *Authorized JavaScript origins* e `https://<dominio-vercel>/auth/google/callback` em *Authorized redirect URIs*.

Depois do deploy, valide o login local e Google, um GET autenticado de estoque, a compra de um item e o relatório do mês. O proxy evita que o navegador precise enviar cookies de sessão de terceiros; a API continua usando cookies HTTPS em produção (`SameSite=None; Secure`).