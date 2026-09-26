import { useEffect, useState } from 'react'
import { BarChart3, Box, Download, ShoppingBag, UsersRound } from 'lucide-react'
import { api, money } from '../api'
import { useAuth } from '../auth/useAuth'

type Report = {
  mes: number
  ano: number
  valorTotal: number
  totalCompras: number
  totalItens: number
  unidades: { unidade: { id: string; numero: string; bloco?: string | null }; valorTotal: number; totalCompras: number }[]
}

const demoReport: Report = {
  mes: 6,
  ano: 2026,
  valorTotal: 4286.5,
  totalCompras: 180,
  totalItens: 516,
  unidades: [
    { unidade: { id: 'a', numero: '302', bloco: 'A' }, valorTotal: 286.4, totalCompras: 12 },
    { unidade: { id: 'b', numero: '105', bloco: 'A' }, valorTotal: 198.75, totalCompras: 9 },
    { unidade: { id: 'c', numero: '804', bloco: 'B' }, valorTotal: 174.2, totalCompras: 7 },
  ],
}

export function ReportsPage() {
  const { demo } = useAuth()
  const [report, setReport] = useState<Report | null>(() => demo ? demoReport : null)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [error, setError] = useState('')

  useEffect(() => {
    if (demo) return
    let active = true
    api<Report>(`/relatorios?mes=${month}&ano=${year}`)
      .then((result) => { if (active) setReport(result) })
      .catch((caught: Error) => {
        if (!active) return
        setReport(null)
        setError(caught.message)
      })
    return () => { active = false }
  }, [demo, month, year])

  const currentReport = report ?? { mes: month, ano: year, valorTotal: 0, totalCompras: 0, totalItens: 0, unidades: [] }
  const period = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, month - 1))
  const chartRows = demo
    ? [42, 58, 49, 72, 60, 88].map((value, index) => ({ label: `Sem. ${index + 1}`, valor: value * 49.5 }))
    : currentReport.unidades.slice(0, 6).map((row) => ({ label: `${row.unidade.bloco ?? ''}-${row.unidade.numero}`, valor: row.valorTotal }))
  const chartMax = Math.max(...chartRows.map((row) => row.valor), 1)

  const downloadCsv = () => {
    const rows = [['Unidade', 'Compras', 'Total'], ...currentReport.unidades.map((row) => [`${row.unidade.bloco ?? ''}-${row.unidade.numero}`, String(row.totalCompras), row.valorTotal.toFixed(2)])]
    const file = new Blob([rows.map((row) => row.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `relatorio-${year}-${String(month).padStart(2, '0')}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <>
    <section className="page-title-row">
      <div><span className="eyebrow"><i />PRESTAÇÃO DE CONTAS</span><h1>Relatórios</h1><p>Resumo mensal das movimentações do minimercado.</p></div>
      <button className="button button-secondary" onClick={downloadCsv}><Download size={16} />Baixar relatório</button>
    </section>
    <div className="report-period">
      <span className="period-label">PERÍODO</span>
      <label className="select-compact"><span className="sr-only">Mês do relatório</span><select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option value={index + 1} key={index}>{new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, index))}</option>)}</select></label>
      <label className="select-compact"><span className="sr-only">Ano do relatório</span><select value={year} onChange={(event) => setYear(Number(event.target.value))}>{[2025, 2026, 2027].map((value) => <option key={value}>{value}</option>)}</select></label>
      <span className="period-note">Totalizadores por unidade</span>
    </div>
    {error && <div className="inline-error" role="alert">Não foi possível carregar o relatório: {error}</div>}
    <section className="metric-grid">
      <ReportMetric icon={<ShoppingBag />} label="Faturamento do mês" value={money(currentReport.valorTotal)} tone="green" detail={demo ? 'dados de exemplo' : 'total registrado'} />
      <ReportMetric icon={<BarChart3 />} label="Compras registradas" value={String(currentReport.totalCompras)} tone="blue" detail="no período selecionado" />
      <ReportMetric icon={<UsersRound />} label="Unidades atendidas" value={String(currentReport.unidades.length)} tone="coral" detail="com movimentação" />
      <ReportMetric icon={<Box />} label="Itens vendidos" value={String(currentReport.totalItens)} tone="amber" detail="unidades movimentadas" />
    </section>
    <section className="dashboard-grid report-grid">
      <article className="panel report-chart-panel">
        <div className="panel-heading"><div><span className="panel-eyebrow">DETALHAMENTO</span><h2>{demo ? 'Vendas por semana' : 'Vendas por unidade'}</h2></div><span className="chart-range">{period}, {year}</span></div>
        {chartRows.length ? <div className="report-bars">{chartRows.map((row) => <div className="report-bar-item" key={row.label}><i className="report-bar" style={{ height: `${Math.max(4, row.valor / chartMax * 88)}%` }} /><small>{row.label}</small><strong>{money(row.valor)}</strong></div>)}</div> : <div className="chart-empty">Nenhuma compra registrada neste período.</div>}
      </article>
      <article className="panel category-panel">
        <div className="panel-heading"><div><span className="panel-eyebrow">DETALHAMENTO</span><h2>Por unidade</h2></div></div>
        {currentReport.unidades.slice(0, 5).map((row, index) => <div className="best-seller" key={row.unidade.id}><span className={`rank-number rank-${index + 1}`}>A{row.unidade.numero}</span><span><strong>Bloco {row.unidade.bloco ?? '—'}</strong><small>{row.totalCompras} compras</small></span><b>{money(row.valorTotal)}</b></div>)}
        {!currentReport.unidades.length && <div className="chart-empty">Nenhuma unidade teve compras neste período.</div>}
      </article>
    </section>
  </>
}

function ReportMetric({ icon, label, value, tone, detail }: { icon: React.ReactNode; label: string; value: string; tone: string; detail: string }) {
  return <article className="metric-card"><div className="metric-top"><span className={`metric-icon icon-${tone}`}>{icon}</span></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></article>
}