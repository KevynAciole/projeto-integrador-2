# AGENTS.md

Este arquivo orienta IA e desenvolvedores sobre como entender e trabalhar neste projeto.

## Visão geral do projeto

Este repositório é um sistema web para gestão de minimercado e compras de condôminos.

Principais objetivos:
- Administrar catálogo de produtos e estoque
- Registrar compras por usuários e unidades
- Gerenciar usuários, perfis e permissões
- Acompanhar relatórios e auditoria de ações
- Permitir login com Google e autenticação local

## Stack principal

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express
- Banco: PostgreSQL + Prisma ORM
- Autenticação: Passport.js + OAuth 2.0 do Google + sessão HTTP-only
- Validação: Zod
- Testes: Jest + Supertest
- Documentação API: Swagger/OpenAPI

## Estrutura do repositório

- `backend/` — API REST, regras de negócio, Prisma, autenticação e rotas
- `frontend/` — aplicação web em React
- `docs/` — documentação funcional e operacional do projeto
- `.env.example` — modelo de variáveis de ambiente
- `docker-compose.yml` — ambiente local com PostgreSQL
- `package.json` — scripts do monorepo
- `README.md` — visão geral e instruções principais

## Estrutura técnica importante

### Backend

- `backend/src/app.ts` — configuração da aplicação Express
- `backend/src/server.ts` — bootstrap da API
- `backend/src/routes/` — endpoints por domínio (auth, users, products, purchases, reports, etc.)
- `backend/src/middleware/` — autenticação e autorização
- `backend/src/lib/` — utilidades, e-mail, auditoria, Prisma, helpers
- `backend/prisma/` — schema, migrations e seeds

### Frontend

- `frontend/src/App.tsx` — estrutura principal da interface
- `frontend/src/pages/` — telas por módulo
- `frontend/src/auth/` — autenticação no cliente
- `frontend/src/api.ts` — chamadas para o backend
- `frontend/src/theme.css` e `frontend/src/index.css` — estilos globais

## Como rodar o projeto localmente

### 1) Instalar dependências

```bash
npm install
```

### 2) Configurar ambiente

```bash
cp .env.example .env
```

Ou no PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha as variáveis conforme o README e o `.env.example`.

### 3) Subir banco local

```bash
docker compose up -d
```

### 4) Migrar banco e iniciar seed

```bash
npm run db:migrate --workspace @minimercado/backend -- --name init
npm run db:seed
```

### 5) Rodar o projeto

```bash
npm run dev
```

Dica:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger/OpenAPI: `http://localhost:3000/api/docs`

## Scripts úteis

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run db:generate
npm run db:migrate --workspace @minimercado/backend -- --name <nome>
npm run db:deploy
npm run db:seed
```

## Regras de negócio importantes

- Existem perfis com permissões distintas: administrador, síndico, gestor de estoque, condômino e visitante.
- Usuários podem ter login local e/ou Google.
- Admins e síndicos possuem regras mais amplas de acesso.
- Usuários excluídos logicamente não podem mais iniciar sessão, mas o histórico permanece.
- O sistema usa permissões verificadas no backend e no frontend.
- A demo de login deve ser usada somente para apresentação; não substituir dados reais de produção.

## Segurança e ambiente

- Nunca versionar `.env` ou credenciais reais
- Usar HTTPS em produção
- Manter `SESSION_SECRET` forte e único
- Revisar logs para evitar vazamento de cookies, tokens e dados pessoais
- Não publicar dumps, certificados ou dados sensíveis

## Como uma IA pode entender este projeto rapidamente

Quando alguém pedir para uma IA analisar este repositório, pode usar uma instrução como:

```text
Leia este projeto como um sistema full-stack de gestão de minimercado para condomínio.
Considere os arquivos AGENTS.md, README.md e a estrutura em backend/ e frontend/.
Entenda a arquitetura, os fluxos principais, as regras de autenticação e permissões, e então me ajude a:
1. explicar o projeto;
2. localizar arquivos relevantes;
3. identificar o ponto de entrada da API e do frontend;
4. propor mudanças ou correções;
5. implementar melhorias com segurança e seguindo o padrão do projeto.
```

## Pontos de entrada recomendados

Se a IA precisar começar por localizações mais rápidas, comece por:

- `README.md`
- `backend/src/app.ts`
- `backend/src/server.ts`
- `backend/src/routes/`
- `frontend/src/App.tsx`
- `backend/prisma/schema.prisma`

## Convenções de desenvolvimento

- Preferir seguir o padrão já existente em cada módulo
- Respeitar autenticação/autorização nas rotas do backend
- Validar entradas com Zod quando aplicável
- Revisar testes antes de finalização
- Priorizar mudanças pequenas e consistentes com a arquitetura atual

## Objetivo para a IA

A IA deve ser capaz de responder perguntas sobre:
- arquitetura do sistema
- fluxos de login e autorização
- endpoints e funcionalidades principais
- como rodar o ambiente local
- onde está a lógica de negócio relevante
- como evoluir o sistema sem quebrar padrões existentes

Se uma tarefa exigir mudanças em código, a IA deve consultar este arquivo, o README e os arquivos mais próximos da área afetada antes de alterar comportamento.
