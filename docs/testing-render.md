# Teste inicial no Render

Este roteiro usa dados de teste persistidos diretamente no PostgreSQL do Render. Ele não altera o código da aplicação nem o seed oficial de administradores.

## 1. Confirmar a API e as migrations

Antes de inserir dados:

1. Abra o serviço `minimercado-api` no Render.
2. Confirme que o deploy está com status **Live**.
3. Verifique `https://<dominio-da-api>.onrender.com/health`.
4. Confirme nos logs que `prisma migrate deploy` terminou sem erro.

## 2. Conectar ao banco

Use a extensão PostgreSQL do VS Code ou outro cliente PostgreSQL. No Render, copie a **External Database URL** do banco `minimercado-db` e habilite SSL com modo `require`.

Não publique a URL de conexão: ela contém a senha do banco.

## 3. Criar os usuários de teste

No editor SQL conectado ao banco Render, execute o script abaixo. Ele é idempotente para os IDs de teste e pode ser executado novamente.

```sql
BEGIN;

INSERT INTO "Usuario" (
  "id", "numeroUsuario", "email", "emailContato", "senhaHash",
  "deveTrocarSenha", "nome", "perfil", "criadoEm", "atualizadoEm"
)
VALUES
  ('teste-usuario-admin', '910001', 'teste.admin@example.com', 'teste.admin@example.com',
   '$2a$10$ZVAEzxaWxFp4miitLZU28OgvA1Z1a.t/6I56vTj2mnI1WoQJOcwoe', false,
   'Usuário ADMIN - Administrador', 'ADMIN', NOW(), NOW()),
  ('teste-usuario-sindico', '910002', 'teste.sindico@example.com', 'teste.sindico@example.com',
   '$2a$10$ZVAEzxaWxFp4miitLZU28OgvA1Z1a.t/6I56vTj2mnI1WoQJOcwoe', false,
   'Usuário SINDICO - Síndico', 'SINDICO', NOW(), NOW()),
  ('teste-usuario-estoquista', '910003', 'teste.estoquista@example.com', 'teste.estoquista@example.com',
   '$2a$10$ZVAEzxaWxFp4miitLZU28OgvA1Z1a.t/6I56vTj2mnI1WoQJOcwoe', false,
   'Usuário ESTOQUISTA - Gestor de Estoque', 'ESTOQUISTA', NOW(), NOW()),
  ('teste-usuario-condomino', '910004', 'teste.condomino@example.com', 'teste.condomino@example.com',
   '$2a$10$ZVAEzxaWxFp4miitLZU28OgvA1Z1a.t/6I56vTj2mnI1WoQJOcwoe', false,
   'Usuário CONDOMINO - Condômino', 'CONDOMINO', NOW(), NOW()),
  ('teste-usuario-visitante', '910005', 'teste.visitante@example.com', 'teste.visitante@example.com',
   '$2a$10$ZVAEzxaWxFp4miitLZU28OgvA1Z1a.t/6I56vTj2mnI1WoQJOcwoe', false,
   'Usuário VISITANTE - Visitante', 'VISITANTE', NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "numeroUsuario" = EXCLUDED."numeroUsuario",
  "email" = EXCLUDED."email",
  "emailContato" = EXCLUDED."emailContato",
  "senhaHash" = EXCLUDED."senhaHash",
  "deveTrocarSenha" = EXCLUDED."deveTrocarSenha",
  "nome" = EXCLUDED."nome",
  "perfil" = EXCLUDED."perfil",
  "atualizadoEm" = NOW();

COMMIT;
```

Todos os usuários usam a senha:

```text
secret
```

| Perfil | Usuário | Nome |
| --- | --- | --- |
| ADMIN | `910001` | Usuário ADMIN - Administrador |
| SINDICO | `910002` | Usuário SINDICO - Síndico |
| ESTOQUISTA | `910003` | Usuário ESTOQUISTA - Gestor de Estoque |
| CONDOMINO | `910004` | Usuário CONDOMINO - Condômino |
| VISITANTE | `910005` | Usuário VISITANTE - Visitante |

O login local usa o número do usuário, não o e-mail.

## 4. Validar os registros

```sql
SELECT
  "numeroUsuario",
  "nome",
  "perfil",
  "senhaHash" IS NOT NULL AS "possuiSenha",
  "deveTrocarSenha",
  "excluidoEm"
FROM "Usuario"
WHERE "id" LIKE 'teste-usuario-%'
ORDER BY "numeroUsuario";
```

O resultado deve indicar `possuiSenha = true`, `deveTrocarSenha = false` e `excluidoEm` nulo.

## 5. Testar no frontend

Para cada perfil:

1. Abra a URL do Static Site Render.
2. Informe o número do usuário e a senha `secret`.
3. Teste as telas e ações disponíveis para o perfil.
4. Faça logout antes de testar o próximo usuário.

Para testar compras e relatórios do condômino ou síndico, associe previamente uma unidade ao usuário e crie produtos pelo sistema ou por SQL. O usuário visitante deve ser usado apenas para validar acesso de leitura.

## 6. Remover os usuários de teste

Quando os testes terminarem, execute:

```sql
DELETE FROM "Usuario"
WHERE "id" LIKE 'teste-usuario-%';
```

Execute essa remoção somente em ambiente de teste. Não use esses usuários como contas reais.
