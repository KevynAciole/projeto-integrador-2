import { useEffect, useState } from 'react'
import { Download, ShoppingBag } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { api, money, type Purchase } from '../api'
import { useAuth } from '../auth/useAuth'

type HistoryPurchase = Omit<Purchase, 'unidade'> & { unidade: Purchase['unidade'] | null }
type ShellContext = { notify: (message: string) => void }
const demoHistory: HistoryPurchase[] = [
  { id: 'CM-1048', data: new Date().toISOString(), quantidade: 2, valor: 10.98, usuario: { id: '1', nome: 'Camila Rocha' }, unidade: { id: 'a', numero: '302', bloco: 'A' }, item: { id: '1', nome: 'Leite integral 1L', categoria: 'Laticínios' } },
  { id: 'CM-1047', data: new Date(Date.now() - 3600000).toISOString(), quantidade: 1, valor: 18.5, usuario: { id: '2', nome: 'Lucas Martins' }, unidade: null, item: { id: '2', nome: 'Café moído 500g', categoria: 'Mercearia' } },
]

export function PurchaseHistoryPage({ resident = false, employee = false }: { resident?: boolean; employee?: boolean }) {
  const { demo } = useAuth()
  const { notify } = useOutletContext<ShellContext>()
  const [purchases, setPurchases] = useState<HistoryPurchase[]>(() => demo ? demoHistory.filter((purchase) => !employee || purchase.usuario.nome === 'Lucas Martins') : [])
  const [error, setError] = useState('')

  useEffect(() => {
    if (demo) return
    let active = true
    api<HistoryPurchase[]>('/compras').then((rows) => { if (active) setPurchases(rows) }).catch((caught: Error) => {
      if (!active) return
      setPurchases([])
      setError(caught.message)
      notify(caught.message)
    })
    return () => { active = false }
  }, [demo, notify])

  const now = new Date()
  const monthly = purchases.filter((purchase) => {
    const date = new Date(purchase.data)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  })
  const total = monthly.reduce((sum, purchase) => sum + purchase.valor, 0)
  const pageTitle = resident || employee ? 'Minhas compras' : 'Compras'

  return <>
    <section className="page-title-row"><div><span className="eyebrow"><i />{resident ? 'SEU HISTÓRICO' : employee ? 'COMPRAS DO FUNCIONÁRIO' : 'MOVIMENTAÇÃO DO MERCADO'}</span><h1>{pageTitle}</h1><p>{resident ? 'Acompanhe as compras vinculadas à sua unidade.' : employee ? 'Acompanhe suas compras registradas no minimercado.' : 'Acompanhe os compradores e as retiradas dos moradores.'}</p></div><button className="button button-secondary" onClick={() => notify('Exportação de compras em breve.')}><Download size={16} />Exportar</button></section>
    <section className="metric-grid compact-metrics"><Metric icon={<ShoppingBag />} label="Compras neste mês" value={String(monthly.length)} detail={demo ? 'dados de demonstração' : 'registros reais'} /><Metric icon={<span className="money-symbol">R$</span>} label="Total no período" value={money(total)} detail="no mês selecionado" /></section>
    {error && <div className="inline-error" role="alert">Não foi possível carregar as compras: {error}</div>}
    <section className="panel recent-panel"><div className="panel-heading"><div><span className="panel-eyebrow">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now).toLocaleUpperCase('pt-BR')}</span><h2>Histórico de compras</h2></div></div><div className="table-scroll"><table><thead><tr><th>PRODUTO</th><th>COMPRADOR</th><th>UNIDADE</th><th>DATA</th><th>ITENS</th><th>VALOR</th></tr></thead><tbody>{monthly.map((purchase) => <tr key={purchase.id}><td><span className="table-product"><span className="purchase-thumb"><ShoppingBag size={15} /></span><span><strong>{purchase.item.nome}</strong><small>#{purchase.id}</small></span></span></td><td>{purchase.usuario.nome}</td><td>{purchase.unidade ? `Apto ${purchase.unidade.numero} · ${purchase.unidade.bloco ?? ''}` : 'Sem unidade'}</td><td>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(purchase.data))}</td><td>{purchase.quantidade} un.</td><td><strong>{money(purchase.valor)}</strong></td></tr>)}</tbody></table>{!monthly.length && !error && <div className="empty-state">Nenhuma compra registrada neste mês.</div>}</div></section>
  </>
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <article className="mini-metric"><span className="metric-icon icon-green">{icon}</span><span><small>{label}</small><strong>{value}</strong><small>{detail}</small></span></article>
}