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

export function DashboardPage() {
  const { user, demo } = useAuth()
  const { notify } = useOutletContext<ShellContext>()
  const [products, setProducts] = useState(sampleProducts)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const todayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toLocaleUpperCase('pt-BR')
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date())
  const monthDay = new Date().getDate()
  useEffect(() => {
    if (demo) return
    api<Product[]>('/estoque').then(setProducts).catch(() => undefined)
    api<Purchase[]>('/compras').then(setPurchases).catch(() => undefined)
  }, [demo])
  const lowStock = products.filter((item) => item.quantidade < 8)
  const displayPurchases = demo ? demoPurchases : purchases

  return <><section className="welcome-row"><div><span className="eyebrow"><i />{todayLabel}</span><h1>Bom dia, {user?.nome.split(' ')[0]} <span className="welcome-spark">✳</span></h1><p>Um resumo do que está acontecendo no mercado hoje.</p></div><Link className="button button-primary" to="/estoque"><PackagePlus size={17} />Adicionar produto</Link></section>
    <section className="metric-grid" aria-label="Indicadores do mês"><MetricCard icon={<ShoppingBag />} label="Vendas no mês" value="R$ 4.286,50" delta="12,8%" tone="green" detail="vs. mês passado" /><MetricCard icon={<Box />} label="Itens no estoque" value={String(products.length * 24 + 38)} delta={`${lowStock.length} itens`} tone="amber" detail="precisam de atenção" /><MetricCard icon={<UsersRound />} label="Compras hoje" value="18" delta="6 a mais" tone="blue" detail="que ontem" /><MetricCard icon={<CreditCard />} label="Ticket médio" value="R$ 23,81" delta="R$ 2,40" tone="coral" detail="vs. mês passado" /></section>
    <section className="dashboard-grid"><article className="panel sales-panel"><div className="panel-heading"><div><span className="panel-eyebrow">ACOMPANHAMENTO</span><h2>Vendas do mês</h2></div><button className="select-compact" onClick={() => notify(`Visualizando ${monthLabel}`)}>Este mês <span>⌄</span></button></div><div className="sales-summary"><strong>R$ 4.286,50</strong><span className="trend-pill"><ArrowUpRight size={14} />12,8%</span></div><p className="subtle-copy">Em relação ao mês passado</p><div className="chart" role="img" aria-label="Gráfico de vendas crescente ao longo das últimas semanas"><div className="chart-grid"><span>R$ 1.500</span><span>R$ 1.000</span><span>R$ 500</span><span>R$ 0</span></div><div className="chart-bars">{[36, 52, 44, 62, 55, 71, 58, 78, 63, 86, 72, 94].map((height, index) => <div className={`bar-column ${index === 11 ? 'bar-current' : ''}`} key={index}><i style={{ height: `${height}%` }} /><small>{['1','3','5','7','9','11','13','15','17','19','21','23'][index]}</small></div>)}</div></div><div className="chart-legend"><span><i />Vendas realizadas</span><span>1 — {monthDay} {monthLabel}</span></div></article>
      <article className="panel stock-panel"><div className="panel-heading"><div><span className="panel-eyebrow">AÇÃO NECESSÁRIA</span><h2>Estoque baixo <span className="count-badge">{lowStock.length}</span></h2></div><Link className="text-link" to="/estoque">Ver estoque <OpenIcon size={14} /></Link></div><div className="low-stock-list">{lowStock.slice(0, 4).map((product) => <div className="stock-row" key={product.id}><span className="product-thumb"><Box size={16} /></span><span className="stock-name"><strong>{product.nome}</strong><small>{product.categoria}</small></span><span className={`stock-qty ${product.quantidade < 4 ? 'qty-critical' : ''}`}>{product.quantidade} un.</span></div>)}</div><Link className="replenish-button" to="/estoque"><PackagePlus size={16} />Repor itens em falta</Link></article></section>
    <section className="panel recent-panel dashboard-purchases"><div className="panel-heading"><div><span className="panel-eyebrow">ATIVIDADE RECENTE</span><h2>Últimas compras</h2></div><Link className="text-link" to="/compras">Ver todas <OpenIcon size={14} /></Link></div><div className="table-scroll"><table><thead><tr><th>COMPRA</th><th>UNIDADE</th><th>DATA</th><th>ITENS</th><th>VALOR</th><th>STATUS</th></tr></thead><tbody>{displayPurchases.slice(0, 4).map((purchase) => <tr key={purchase.id}><td><span className="table-product"><span className="purchase-thumb"><ShoppingBag size={15} /></span><span><strong>{purchase.item.nome}</strong><small>#{purchase.id}</small></span></span></td><td>Apto {purchase.unidade.numero}</td><td>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(purchase.data))}</td><td>{purchase.quantidade} un.</td><td><strong>{money(purchase.valor)}</strong></td><td><span className="status-pill status-ok"><i />Retirado</span></td></tr>)}</tbody></table>{displayPurchases.length === 0 && <div className="empty-state">As compras registradas aparecerão aqui.</div>}</div></section>
  </>
}

function MetricCard({ icon, label, value, delta, tone, detail }: { icon: React.ReactNode; label: string; value: string; delta: string; tone: string; detail: string }) {
  return <article className="metric-card"><div className="metric-top"><span className={`metric-icon icon-${tone}`}>{icon}</span><span className={`metric-delta delta-${tone}`}>{tone === 'amber' ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{delta}</span></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></article>
}