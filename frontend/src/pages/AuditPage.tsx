import { useEffect, useState } from 'react'
import { api } from '../api'

type AuditEntry = {
  id: string
  acao: string
  detalhes?: string | null
  usuarioNome?: string | null
  usuarioId?: string | null
  ipAddress?: string | null
  criadoEm: string
}

type AuditSummary = { total: number; ultimas24h: number; usuariosDistintos: number }

export function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [summary, setSummary] = useState<AuditSummary>({ total: 0, ultimas24h: 0, usuariosDistintos: 0 })
  const [error, setError] = useState('')
  const [acao, setAcao] = useState('')
  const [usuario, setUsuario] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const [list, stats] = await Promise.all([
          api<AuditEntry[]>(`/auditoria?${new URLSearchParams({ ...(acao ? { acao } : {}), ...(usuario ? { usuario } : {}), ...(dataInicio ? { dataInicio } : {}), ...(dataFim ? { dataFim } : {}) }).toString()}`),
          api<AuditSummary>('/auditoria/resumo'),
        ])
        setEntries(list)
        setSummary(stats)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Não foi possível carregar a auditoria.')
      }
    })()
  }, [acao, usuario, dataInicio, dataFim])

  return <section className="panel audit-page" style={{ padding: 24 }}>
    <div className="panel-heading">
      <div>
        <span className="panel-eyebrow">REGISTRO DE SEGURANÇA</span>
        <h2>Auditoria</h2>
      </div>
    </div>

    <div className="audit-metrics">
      <article className="metric-card"><div className="metric-top"><span className="metric-label">Total de eventos</span></div><strong className="metric-value">{summary.total}</strong></article>
      <article className="metric-card"><div className="metric-top"><span className="metric-label">Últimas 24h</span></div><strong className="metric-value">{summary.ultimas24h}</strong></article>
      <article className="metric-card"><div className="metric-top"><span className="metric-label">Usuários acionados</span></div><strong className="metric-value">{summary.usuariosDistintos}</strong></article>
    </div>

    <div className="audit-filters">
      <label>Tipo de ação<input value={acao} onChange={(event) => setAcao(event.target.value)} placeholder="Ex.: COMPRA" /></label>
      <label>Usuário<input value={usuario} onChange={(event) => setUsuario(event.target.value)} placeholder="Nome ou ID" /></label>
      <label>Data início<input type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} /></label>
      <label>Data fim<input type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} /></label>
    </div>

    {error && <div className="inline-error" role="alert">{error}</div>}
    <div className="table-scroll audit-list">
      <table>
        <thead>
          <tr>
            <th>AÇÃO</th>
            <th>USUÁRIO</th>
            <th>DETALHES</th>
            <th>IP</th>
            <th>DATA</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? <tr><td colSpan={5}>Nenhum registro de auditoria.</td></tr> : entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.acao}</td>
              <td>{entry.usuarioNome ?? entry.usuarioId ?? 'Sistema'}</td>
              <td>{entry.detalhes ?? '—'}</td>
              <td>{entry.ipAddress ?? '—'}</td>
              <td>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.criadoEm))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
}
