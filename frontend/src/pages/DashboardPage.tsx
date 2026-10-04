import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ArrowUpRight as OpenIcon, Box, CreditCard, PackagePlus, ShoppingBag, UsersRound } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { api, money, type Product, type Purchase } from '../api'
import { useAuth } from '../auth/useAuth'

const sampleProducts: Product[] = [
  { id: 'a', nome: 'Leite integral 1L', categoria: 'Laticínios', quantidade: 24, preco: 5.49 },
  { id: 'b', nome: 'Ovos caipiras · 12 un.', categoria: 'Mercearia', quantidade: 7, preco: 12.9 },
  { id: 'c', nome: 'Pão de forma', categoria: 'Padaria', quantidade: 3, preco: 9.75 },
  { id: 'd', nome: 'Café moído 500g', categoria: 'Mercearia', quantidade: 18, preco: 18.5 },
  { id: 'e', nome: 'Água mineral 1,5L', categoria: 'Bebidas', quantidade: 2, preco: 3.25 },
]
const demoPurchases: Purchase[] = [
  { id: 'CM-1048', usuario: { id: '1', nome: 'Camila Rocha' }, unidade: { id: '1', numero: '302', bloco: 'A' }, item: { id: '1', nome: 'Leite integral 1L', categoria: 'Laticínios' }, data: '2026-06-24T10:42:00.000Z', quantidade: 2, valor: 10.98 },
  { id: 'CM-1047', usuario: { id: '2', nome: 'Lucas Pereira' }, unidade: { id: '2', numero: '105', bloco: 'A' }, item: { id: '2', nome: 'Café moído 500g', categoria: 'Mercearia' }, data: '2026-06-24T09:18:00.000Z', quantidade: 1, valor: 18.5 },
  { id: 'CM-1046', usuario: { id: '3', nome: 'Ana Souza' }, unidade: { id: '3', numero: '804', bloco: 'B' }, item: { id: '3', nome: 'Ovos caipiras · 12 un.', categoria: 'Mercearia' }, data: '2026-06-23T20:31:00.000Z', quantidade: 1, valor: 12.9 },
]
type ShellContext = { notify: (message: string) => void }
type MonthlySummary = { valorTotal: number; totalCompras: number }
const demoSummary: MonthlySummary = { valorTotal: 4286.5, totalCompras: 180 }

export function DashboardPage() {
  const { user, demo } = useAuth()
  const { notify } = useOutletContext<ShellContext>()
  const [products, setProducts] = useState<Product[]>(() => demo ? sampleProducts : [])
  const [purchases, setPurchases] = useState<Purchase[]>(() => demo ? demoPurchases : [])
  const [summary, setSummary] = useState<MonthlySummary | null>(() => demo ? demoSummary : null)
  const [loadError, setLoadError] = useState('')
  const todayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toLocaleUpperCase('pt-BR')
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date())
  const monthDay = new Date().getDate()
  useEffect(() => {
    if (demo) return
    let active = true
    Promise.all([api<Product[]>('/estoque'), api<Purchase[]>('/compras'), api<MonthlySummary>('/relatorios')])
      .then(([stock, history, monthly]) => {
        if (!active) return
        setProducts(stock)
        setPurchases(history)
        setSummary(monthly)
      })
      .catch((error: Error) => {
        if (!active) return
        setProducts([])
        setPurchases([])
        setSummary(null)
        setLoadError(error.message)
      })
    return () => { active = false }
  }, [demo])
  const lowStock = products.filter((item) => item.quantidade < 8)
  const displayPurchases = demo ? demoPurchases : purchases
  const monthlySales = summary?.valorTotal ?? 0
  const monthlyPurchaseCount = summary?.totalCompras ?? 0
  const stockUnits = products.reduce((total, product) => total + product.quantidade, 0)
  const todayPurchases = demo ? 18 : purchases.filter((purchase) => new Date(purchase.data).toDateString() === new Date().toDateString()).length
  const averageTicket = monthlyPurchaseCount > 0 ? monthlySales / monthlyPurchaseCount : 0
  const monthPurchases = purchases.filter((purchase) => {
    const date = new Date(purchase.data)
    return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()
  })
  const weeklySales = demo ? [450, 680, 520, 1120, 1516.5] : [0, 0, 0, 0, 0]
  if (!demo) monthPurchases.forEach((purchase) => {
    const weekIndex = Math.min(4, Math.floor((new Date(purchase.data).getDate() - 1) / 7))
    weeklySales[weekIndex] += purchase.valor
  })
  const chartMax = Math.max(...weeklySales, 1)

  return <><section className="welcome-row"><div><span className="eyebrow"><i />{todayLabel}</span><h1>Bom dia, {user?.nome.split(' ')[0]} <span className="welcome-spark">✳</span></h1><p>Um resumo do que está acontecendo no mercado hoje.</p></div><Link className="button button-primary" to="/estoque"><PackagePlus size={17} />Adicionar produto</Link></section>
    {loadError && <div className="inline-error" role="alert">Não foi possível carregar os dados do painel: {loadError}</div>}
    <section className="metric-grid" aria-label="Indicadores do mês"><MetricCard icon={<ShoppingBag />} label="Vendas no mês" value={money(monthlySales)} delta={demo ? '12,8%' : undefined} tone="green" detail={demo ? 'vs. mês passado · exemplo' : `${monthlyPurchaseCount} compras no mês`} /><MetricCard icon={<Box />} label="Unidades em estoque" value={String(stockUnits)} delta={lowStock.length ? `${lowStock.length} itens baixos` : undefined} tone="amber" detail={products.length ? `${products.length} produtos cadastrados` : 'Nenhum produto cadastrado'} /><MetricCard icon={<UsersRound />} label="Compras hoje" value={String(todayPurchases)} delta={demo ? '6 a mais' : undefined} tone="blue" detail={demo ? 'que ontem · exemplo' : 'registradas hoje'} /><MetricCard icon={<CreditCard />} label="Ticket médio" value={money(averageTicket)} delta={demo ? 'R$ 2,40' : undefined} tone="coral" detail={demo ? 'vs. mês passado · exemplo' : 'neste mês'} /></section>
    <section className="dashboard-grid"><article className="panel sales-panel"><div className="panel-heading"><div><span className="panel-eyebrow">ACOMPANHAMENTO</span><h2>Vendas do mês</h2></div><button className="select-compact" onClick={() => notify(`Visualizando ${monthLabel}`)}>Este mês <span>⌄</span></button></div><div className="sales-summary"><strong>{money(monthlySales)}</strong>{demo && <span className="trend-pill"><ArrowUpRight size={14} />12,8%</span>}</div><p className="subtle-copy">{demo ? 'Dados de exemplo' : 'Total de vendas registradas neste mês'}</p>{weeklySales.some((value) => value > 0) ? <><div className="chart" role="img" aria-label="Vendas agrupadas por semana no mês atual"><div className="chart-grid"><span>{money(monthlySales)}</span><span>{money(monthlySales * 2 / 3)}</span><span>{money(monthlySales / 3)}</span><span>R$ 0</span></div><div className="chart-bars">{weeklySales.map((value, index) => <div className={`bar-column ${index === weeklySales.length - 1 ? 'bar-current' : ''}`} key={index} style={{ width: '14%' }}><i style={{ height: `${Math.max(4, value / chartMax * 90)}%` }} /><small>Sem. {index + 1}</small></div>)}</div></div><div className="chart-legend"><span><i />Vendas realizadas</span><span>{monthLabel} · {monthDay} dias</span></div></> : <div className="chart-empty">Nenhuma venda registrada neste mês.</div>}</article>
      <article className="panel stock-panel"><div className="panel-heading"><div><span className="panel-eyebrow">AÇÃO NECESSÁRIA</span><h2>Estoque baixo <span className="count-badge">{lowStock.length}</span></h2></div><Link className="text-link" to="/estoque">Ver estoque <OpenIcon size={14} /></Link></div><div className="low-stock-list">{lowStock.slice(0, 4).map((product) => <div className="stock-row" key={product.id}><span className="product-thumb"><Box size={16} /></span><span className="stock-name"><strong>{product.nome}</strong><small>{product.categoria}</small></span><span className={`stock-qty ${product.quantidade < 4 ? 'qty-critical' : ''}`}>{product.quantidade} un.</span></div>)}{!lowStock.length && <div className="chart-empty">{products.length ? 'Nenhum produto com estoque baixo.' : 'Nenhum produto cadastrado.'}</div>}</div><Link className="replenish-button" to="/estoque"><PackagePlus size={16} />{products.length ? 'Repor itens em falta' : 'Cadastrar produtos'}</Link></article></section>
    <section className="panel recent-panel dashboard-purchases"><div className="panel-heading"><div><span className="panel-eyebrow">ATIVIDADE RECENTE</span><h2>Últimas compras</h2></div><Link className="text-link" to="/compras">Ver todas <OpenIcon size={14} /></Link></div><div className="table-scroll"><table><thead><tr><th>COMPRA</th><th>COMPRADOR</th><th>UNIDADE</th><th>DATA</th><th>ITENS</th><th>VALOR</th></tr></thead><tbody>{displayPurchases.slice(0, 4).map((purchase) => <tr key={purchase.id}><td><span className="table-product"><span className="purchase-thumb"><ShoppingBag size={15} /></span><span><strong>{purchase.item.nome}</strong><small>#{purchase.id}</small></span></span></td><td>{purchase.usuario.nome}</td><td>{purchase.unidade ? `Apto ${purchase.unidade.numero}` : 'Sem unidade'}</td><td>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(purchase.data))}</td><td>{purchase.quantidade} un.</td><td><strong>{money(purchase.valor)}</strong></td></tr>)}</tbody></table>{displayPurchases.length === 0 && <div className="empty-state">As compras registradas aparecerão aqui.</div>}</div></section>
  </>
}

function MetricCard({ icon, label, value, delta, tone, detail }: { icon: React.ReactNode; label: string; value: string; delta?: string; tone: string; detail: string }) {
  return <article className="metric-card"><div className="metric-top"><span className={`metric-icon icon-${tone}`}>{icon}</span>{delta && <span className={`metric-delta delta-${tone}`}>{tone === 'amber' ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{delta}</span>}</div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></article>
}