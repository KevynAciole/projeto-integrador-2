# Gestão de Minimercado e Compras de Condôminos

Sistema web para administrar o minimercado de um condomínio. Administradores e gestores de estoque cuidam do catálogo; condôminos e funcionários registram compras; síndicos acompanham usuários, unidades e relatórios mensais.

## Tecnologias

- **Frontend:** React, TypeScript, Vite e Tailwind CSS
- **Backend:** Node.js e Express
- **Banco de dados:** PostgreSQL com Prisma ORM
- **Autenticação:** OAuth 2.0 do Google com Passport.js e sessão HTTP-only
- **Validação:** Zod
- **Testes:** Jest e Supertest
- **Documentação da API:** Swagger UI e OpenAPI
- **Hospedagem:** Render para frontend, API e PostgreSQL

## Requisitos

- Node.js 22 ou superior e npm
- PostgreSQL local ou gerenciado. Para desenvolvimento local, pode usar Docker Desktop/Engine
- Credenciais OAuth 2.0 do Google para habilitar o login real

## Clonar e iniciar

Clone o repositório e entre na pasta do projeto:

```bash
git clone <URL-DO-REPOSITORIO>
cd projeto-integrador-2
```

Instale as dependências do monorepo e crie seu arquivo de ambiente local:

```bash
npm install
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Edite `.env` com os valores do seu ambiente. Para PostgreSQL local via Docker, inicie o serviço:

```bash
docker compose up -d
```

Aplique as migrações e cadastre os administradores iniciais:

```bash
npm run db:migrate --workspace @minimercado/backend -- --name init
npm run db:seed
```

Inicie frontend e backend juntos:

```bash
npm run dev
```

O frontend fica em `http://localhost:5173` e a API em `http://localhost:3000`. Também é possível iniciá-los em terminais separados:

```bash
npm run dev --workspace @minimercado/backend
npm run dev --workspace @minimercado/frontend
```

O login Google real requer banco configurado, uma conta cadastrada e credenciais OAuth válidas. Sem essas configurações, use a entrada de demonstração da tela de login.

## Variáveis de ambiente

O modelo completo está em `.env.example`. Os valores de exemplo servem somente para desenvolvimento local e devem ser ajustados antes de qualquer deploy.

| Variável | Exemplo/uso |
| --- | --- |
| `DATABASE_URL` | `postgresql://user:password@host:port/dbname` |
| `GOOGLE_CLIENT_ID` | `<sua-client-id>` criada no Google Cloud |
| `GOOGLE_CLIENT_SECRET` | `<sua-client-secret>` criada no Google Cloud |
| `GOOGLE_CALLBACK_URL` | URL pública da API terminando em `/auth/google/callback` |
| `SESSION_SECRET` | `<string-secreta>` aleatória e forte, com mais de 32 caracteres |
| `ADMIN_EMAILS` | E-mails Google de administradores iniciais, separados por vírgula |
| `RESEND_API_KEY` | Chave de API do Resend para envio de e-mails transacionais |
| `RESEND_FROM` | Remetente autorizado no Resend, por exemplo `Minimercado <acesso@seudominio.com>` |
| `PORT` | Porta da API; padrão local `3000` |
| `CLIENT_URL` | Origem do frontend; local `http://localhost:5173` |
| `CORS_ORIGIN` | Origem(ns) autorizada(s) para chamadas com cookie |
| `VITE_API_URL` | URL pública da API; em desenvolvimento pode ficar vazio para usar `http://localhost:3000` |

No Google Cloud, cadastre a origem do frontend como origem JavaScript autorizada e a URL da API configurada em `GOOGLE_CALLBACK_URL` como URI de redirecionamento autorizado. No Render, o callback deve usar o domínio público do Web Service da API.

No Resend, crie uma API key e verifique o domínio remetente para enviar e-mails aos usuários. O remetente de teste `onboarding@resend.dev` só pode ser usado com destinatários autorizados pela conta Resend.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia frontend e API em paralelo |
| `npm run build` | Gera o cliente Prisma e compila os dois workspaces |
| `npm run test` | Executa testes unitários e de integração com Jest/Supertest |
| `npm run lint` | Verifica os workspaces |
| `npm run db:generate` | Gera o cliente Prisma |
| `npm run db:migrate --workspace @minimercado/backend -- --name <nome>` | Cria/aplica migração de desenvolvimento |
| `npm run db:deploy` | Aplica migrações pendentes em produção |
| `npm run db:seed` | Cadastra administradores definidos em `ADMIN_EMAILS` |

## Perfis e acessibilidade

- **Administrador:** todos os acessos; gerencia usuários, produtos, unidades, compras e relatórios. Pode usar senha local sem vincular login Google.
- **Síndico:** pode comprar, consulta relatórios/compras, gerencia unidades e cadastra usuários exceto administradores. Pode usar senha local sem vincular login Google.
- **Gestor de Estoque:** administra produtos, pode comprar e consulta suas próprias compras; unidade e login Google opcionais.
- **Condômino:** exige conta Google, telefone e unidade; consulta suas compras e pode comprar.
- **Visitante:** consulta produtos e preços; não pode comprar nem acessar usuários/unidades.

Todo usuário tem um único e-mail cadastrado, usado tanto para receber credenciais pelo Resend quanto para identificar a conta no login Google. O login local continua disponível com número de usuário ou telefone e senha. Cadastro local usa número de usuário de seis dígitos e senha temporária; a senha precisa ser trocada no primeiro acesso. Configure a API key e verifique o domínio remetente antes de cadastrar contas reais.

As permissões são verificadas no backend e também refletidas nas rotas da interface. A aplicação inclui controles de alto contraste e aumento de fonte, navegação por teclado, rótulos para leitores de tela, tabelas semânticas e respeito à preferência por movimento reduzido.

Administradores e síndicos podem excluir usuários logicamente e restaurá-los pela tela de usuários. Os registros e o histórico de compras permanecem armazenados; usuários excluídos não podem iniciar sessão.

Consulte [docs/jornada-perfis.md](docs/jornada-perfis.md) para conhecer a jornada e as permissões detalhadas de cada perfil.

## Dados de demonstração

A tela de login oferece um modo de demonstração com perfis e dados fictícios, incluindo os usuários Marina Costa, Rafael Almeida e Camila Rocha, produtos de exemplo e compras simuladas. Alterações feitas nesse modo ficam apenas na interface e não são gravadas no PostgreSQL.

O seed real (`npm run db:seed`) cria somente os administradores listados em `ADMIN_EMAILS`; não inclui produtos, unidades ou compras de teste. O cadastro de usuário gera número de usuário e senha temporária, envia as credenciais ao e-mail de contato e força a troca da senha no primeiro acesso. Antes de abrir o sistema ao público, desative ou remova a entrada de demonstração e substitua os exemplos por cadastros controlados no banco. Não use dados fictícios como dados operacionais.

## Documentação da API

Com a API em execução, Swagger UI está disponível em [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) e o documento OpenAPI em `/api/openapi.json`. A lista de endpoints e permissões também está em [docs/api.md](docs/api.md).

## Segurança e publicação

O passo a passo completo para publicar frontend, API e PostgreSQL no Render está em [docs/deploy.md](docs/deploy.md).

- Nunca publique arquivos `.env`. O `.gitignore` já os exclui e mantém `.env.example` como modelo sem segredos.
- Não versione credenciais, chaves privadas, certificados, dumps de banco ou dados pessoais. Revise `git status` antes de cada commit.
- Configure `DATABASE_URL`, segredos OAuth, `SESSION_SECRET`, `CLIENT_URL`, `CORS_ORIGIN`, `RESEND_API_KEY` e `RESEND_FROM` diretamente nas configurações protegidas do Web Service Render. No Static Site Render, configure `VITE_API_URL` com a URL pública da API.
- Use HTTPS em produção e um `SESSION_SECRET` exclusivo e aleatório. Não reutilize os valores de exemplo.
- Revise logs e mensagens de erro para garantir que tokens, cookies, credenciais e dados pessoais não sejam registrados.
- No Render, o Web Service aplica migrações com `prisma migrate deploy` antes de iniciar a API; no Static Site, configure `VITE_API_URL` com o domínio público da API.

Consulte [docs/deploy.md](docs/deploy.md) para o roteiro de publicação completo. O GitHub Actions executa testes e build em pushes e pull requests para `main`.