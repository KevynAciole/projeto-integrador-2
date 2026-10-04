export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Gestão de Minimercado e Compras de Condôminos',
    version: '1.0.0',
    description: 'API REST para estoque, moradores, compras e relatórios mensais.',
  },
  servers: [{ url: '/', description: 'API do minimercado' }],
  tags: [
    { name: 'Estoque' }, { name: 'Usuários' }, { name: 'Unidades' },
    { name: 'Compras' }, { name: 'Relatórios' }, { name: 'Autenticação' },
  ],
  components: {
    securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: 'sid' } },
    schemas: {
      Perfil: { type: 'string', enum: ['ADMIN', 'SINDICO', 'ESTOQUISTA', 'CONDOMINO', 'VISITANTE'] },
      Erro: { type: 'object', properties: { error: { type: 'string' } } },
      Produto: { type: 'object', properties: { id: { type: 'string' }, nome: { type: 'string' }, categoria: { type: 'string' }, quantidade: { type: 'integer' }, preco: { type: 'number' } } },
    },
  },
  paths: {
    '/auth/google': { get: { tags: ['Autenticação'], summary: 'Iniciar login Google', responses: { '302': { description: 'Redireciona para o Google' }, '503': { description: 'OAuth não configurado' } } } },
    '/auth/google/callback': { get: { tags: ['Autenticação'], summary: 'Retorno OAuth Google', responses: { '302': { description: 'Redireciona para a aplicação' } } } },
    '/auth/me': { get: { tags: ['Autenticação'], summary: 'Consultar usuário autenticado', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Sessão atual' }, '401': { description: 'Não autenticado' } } } },
    '/auth/logout': { post: { tags: ['Autenticação'], summary: 'Encerrar sessão', security: [{ cookieAuth: [] }], responses: { '204': { description: 'Sessão encerrada' } } } },
    '/auth/login': { post: { tags: ['Autenticação'], summary: 'Entrar por número de usuário ou telefone e senha', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['identificador', 'senha'], properties: { identificador: { type: 'string' }, senha: { type: 'string', format: 'password' } } } } } }, responses: { '200': { description: 'Sessão iniciada' }, '401': { description: 'Credenciais inválidas' } } } },
    '/auth/alterar-senha': { post: { tags: ['Autenticação'], summary: 'Trocar senha temporária', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Senha alterada' }, '400': { description: 'Senha temporária inválida' } } } },
    '/estoque': {
      get: { tags: ['Estoque'], summary: 'Listar produtos ativos', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Lista de produtos' }, '401': { description: 'Não autenticado' } } },
      post: { tags: ['Estoque'], summary: 'Cadastrar produto (administrador/estoquista)', security: [{ cookieAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Produto' } } } }, responses: { '201': { description: 'Produto criado' }, '403': { description: 'Perfil sem permissão' } } },
    },
    '/estoque/{id}': { patch: { tags: ['Estoque'], summary: 'Atualizar produto (administrador/estoquista)', security: [{ cookieAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Produto atualizado' } } }, delete: { tags: ['Estoque'], summary: 'Desativar produto (administrador/estoquista)', security: [{ cookieAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Produto desativado' } } } },
    '/usuarios': { get: { tags: ['Usuários'], summary: 'Listar usuários (administrador/síndico)', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Lista de usuários' } } }, post: { tags: ['Usuários'], summary: 'Cadastrar usuário e enviar credenciais (administrador/síndico)', security: [{ cookieAuth: [] }], responses: { '201': { description: 'Usuário criado e notificado' } } } },
    '/unidades': { get: { tags: ['Unidades'], summary: 'Listar unidades (administrador/síndico)', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Lista de unidades' } } }, post: { tags: ['Unidades'], summary: 'Cadastrar unidade (administrador/síndico)', security: [{ cookieAuth: [] }], responses: { '201': { description: 'Unidade criada' } } } },
    '/unidades/{id}': { patch: { tags: ['Unidades'], summary: 'Editar unidade', security: [{ cookieAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Unidade atualizada' } } } },
    '/compras': { get: { tags: ['Compras'], summary: 'Listar compras visíveis ao perfil (condôminos/estoquistas veem as próprias)', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Histórico de compras' } } }, post: { tags: ['Compras'], summary: 'Registrar compra para a unidade do condômino ou como funcionário', security: [{ cookieAuth: [] }], responses: { '201': { description: 'Compra registrada com nome do comprador' } } } },
    '/relatorios': { get: { tags: ['Relatórios'], summary: 'Totalizador mensal por unidade', security: [{ cookieAuth: [] }], parameters: [{ in: 'query', name: 'mes', schema: { type: 'integer', minimum: 1, maximum: 12 } }, { in: 'query', name: 'ano', schema: { type: 'integer' } }], responses: { '200': { description: 'Totalizadores mensais' } } } },
  },
}