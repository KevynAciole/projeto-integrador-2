# API REST

Swagger UI: `/api/docs`  
Documento OpenAPI: `/api/openapi.json`  
Autenticação: sessão Google OAuth, cookie HTTP-only `sid`.

As rotas abaixo exigem sessão autenticada, salvo `/health`, `/auth/google`, `/auth/google/callback` e os documentos Swagger.

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/auth/me` | autenticado | Usuário e perfil da sessão |
| `POST` | `/auth/logout` | autenticado | Encerra a sessão |
| `GET` | `/estoque` | todos os perfis | Lista produtos ativos |
| `POST` | `/estoque` | gestor | Cadastra produto |
| `PATCH` | `/estoque/:id` | gestor | Atualiza produto |
| `DELETE` | `/estoque/:id` | gestor | Desativa produto |
| `GET` | `/usuarios` | gestor, síndico | Lista usuários |
| `POST` | `/usuarios` | gestor, síndico | Cadastra morador; síndico só atribui perfil condômino |
| `PATCH` | `/usuarios/:id` | gestor, síndico | Atualiza usuário dentro das permissões do perfil |
| `GET` | `/unidades` | gestor, síndico | Lista unidades e moradores |
| `POST` | `/unidades` | gestor, síndico | Cadastra unidade |
| `GET` | `/unidades/minha-unidade` | condômino | Consulta unidade vinculada à sessão |
| `GET` | `/compras` | todos os perfis | Lista compras; condômino recebe somente as próprias |
| `POST` | `/compras` | condômino | Registra compra e baixa estoque atomicamente |
| `GET` | `/relatorios?mes=6&ano=2026` | gestor, síndico | Totalizadores mensais por unidade |

Corpos de escrita são validados com Zod. A API retorna `400` para dados inválidos, `401` sem sessão, `403` para perfil não autorizado, `404` para registro inexistente e `409` para estoque insuficiente/conflito de cadastro.