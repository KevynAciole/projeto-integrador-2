import request from 'supertest'
import { createApp } from './app'

const app = createApp()

describe('API REST', () => {
  it('responde ao health check sem banco de dados', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('publica o documento OpenAPI em /api/openapi.json', async () => {
    const response = await request(app).get('/api/openapi.json')
    expect(response.status).toBe(200)
    expect(response.body.paths).toHaveProperty('/estoque')
    expect(response.body.paths).toHaveProperty('/compras')
    expect(response.body.paths).toHaveProperty('/relatorios')
  })

  it.each(['/estoque', '/usuarios', '/unidades', '/compras', '/relatorios'])('protege %s contra acesso anônimo', async (path) => {
    const response = await request(app).get(path)
    expect(response.status).toBe(401)
    expect(response.body.error).toBe('Autenticação necessária.')
  })
})