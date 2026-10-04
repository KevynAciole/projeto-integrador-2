# API REST

Swagger UI: `/api/docs`  
Documento OpenAPI: `/api/openapi.json`  
Autenticação: sessão de Google OAuth + login local por número/telefone e senha, com cookie HTTP-only `sid`.

As rotas abaixo exigem sessão autenticada, salvo `/health`, `/auth/google`, `/auth/google/callback`, `/auth/login` e os documentos Swagger.

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/auth/me` | autenticado | Usuário e perfil da sessão |
| `POST` | `/auth/login` | público | Login com número de usuário ou telefone e senha |
| `POST` | `/auth/alterar-senha` | autenticado | Troca a senha temporária |
| `POST` | `/auth/logout` | autenticado | Encerra a sessão |
| `GET` | `/inscricao/unidades` | público | Lista bloco e número das unidades para autoinscrição |
| `POST` | `/inscricao` | público | Solicita autoinscrição de condômino e envia credenciais |
| `GET` | `/estoque` | todos os perfis | Lista produtos ativos |
| `POST` | `/estoque` | administrador, estoquista | Cadastra produto |
| `PATCH` | `/estoque/:id` | administrador, estoquista | Atualiza produto |
| `DELETE` | `/estoque/:id` | administrador, estoquista | Desativa produto |
| `GET` | `/usuarios` | administrador, síndico | Lista usuários ativos; `?incluiExcluidos=true` inclui os excluídos |
| `POST` | `/usuarios` | administrador, síndico | Cadastra usuário e envia credenciais |
| `PATCH` | `/usuarios/:id` | administrador, síndico | Atualiza usuário dentro da regra de perfis |
| `DELETE` | `/usuarios/:id` | administrador, síndico | Exclui usuário logicamente, preservando os dados |
| `POST` | `/usuarios/:id/restaurar` | administrador, síndico | Restaura um usuário excluído |
| `GET` | `/unidades` | administrador, síndico | Lista unidades e moradores |
| `POST` | `/unidades` | administrador, síndico | Cadastra unidade |
| `GET` | `/unidades/minha-unidade` | condômino | Consulta unidade vinculada à sessão |
| `GET` | `/compras` | todos | Lista compras visíveis ao perfil |
| `POST` | `/compras` | condômino, estoquista, administrador, síndico | Registra compra e baixa estoque |
| `GET` | `/relatorios?mes=6&ano=2026` | administrador, síndico | Totalizadores mensais por unidade |

Corpos de escrita são validados com Zod. A API retorna `400` para dados inválidos, `401` sem sessão, `403` para perfil não autorizado, `404` para registro inexistente e `409` para estoque insuficiente ou conflito de cadastro.