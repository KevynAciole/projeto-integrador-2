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
      Perfil: { type: 'string', enum: ['GESTOR', 'SINDICO', 'CONDOMINO'] },
      Erro: { type: 'object', properties: { error: { type: 'string' } } },
      Produto: { type: 'object', properties: { id: { type: 'string' }, nome: { type: 'string' }, categoria: { type: 'string' }, quantidade: { type: 'integer' }, preco: { type: 'number' } } },
    },
  },
  paths: {
    '/auth/google': { get: { tags: ['Autenticação'], summary: 'Iniciar login Google', responses: { '302': { description: 'Redireciona para o Google' }, '503': { description: 'OAuth não configurado' } } } },
    '/auth/google/callback': { get: { tags: ['Autenticação'], summary: 'Retorno OAuth Google', responses: { '302': { description: 'Redireciona para a aplicação' } } } },
    '/auth/me': { get: { tags: ['Autenticação'], summary: 'Consultar usuário autenticado', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Sessão atual' }, '401': { description: 'Não autenticado' } } } },
    '/auth/logout': { post: { tags: ['Autenticação'], summary: 'Encerrar sessão', security: [{ cookieAuth: [] }], responses: { '204': { description: 'Sessão encerrada' } } } },
    '/estoque': {
      get: { tags: ['Estoque'], summary: 'Listar produtos ativos', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Lista de produtos' }, '401': { description: 'Não autenticado' } } },
      post: { tags: ['Estoque'], summary: 'Cadastrar produto (gestor)', security: [{ cookieAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Produto' } } } }, responses: { '201': { description: 'Produto criado' }, '403': { description: 'Perfil sem permissão' } } },
    },
    '/estoque/{id}': { patch: { tags: ['Estoque'], summary: 'Atualizar produto (gestor)', security: [{ cookieAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Produto atualizado' } } }, delete: { tags: ['Estoque'], summary: 'Desativar produto (gestor)', security: [{ cookieAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Produto desativado' } } } },
    '/usuarios': { get: { tags: ['Usuários'], summary: 'Listar usuários (gestor/síndico)', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Lista de usuários' } } }, post: { tags: ['Usuários'], summary: 'Cadastrar usuário', security: [{ cookieAuth: [] }], responses: { '201': { description: 'Usuário criado' } } } },
    '/unidades': { get: { tags: ['Unidades'], summary: 'Listar unidades (gestor/síndico)', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Lista de unidades' } } }, post: { tags: ['Unidades'], summary: 'Cadastrar unidade (síndico)', security: [{ cookieAuth: [] }], responses: { '201': { description: 'Unidade criada' } } } },
    '/unidades/{id}': { patch: { tags: ['Unidades'], summary: 'Editar unidade', security: [{ cookieAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Unidade atualizada' } } } },
    '/compras': { get: { tags: ['Compras'], summary: 'Listar compras visíveis ao perfil', security: [{ cookieAuth: [] }], responses: { '200': { description: 'Histórico de compras' } } }, post: { tags: ['Compras'], summary: 'Registrar compra/retirada', security: [{ cookieAuth: [] }], responses: { '201': { description: 'Compra registrada' } } } },
    '/relatorios': { get: { tags: ['Relatórios'], summary: 'Totalizador mensal por unidade', security: [{ cookieAuth: [] }], parameters: [{ in: 'query', name: 'mes', schema: { type: 'integer', minimum: 1, maximum: 12 } }, { in: 'query', name: 'ano', schema: { type: 'integer' } }], responses: { '200': { description: 'Totalizadores mensais' } } } },
  },
}