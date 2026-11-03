import { useEffect, useState } from 'react'
import { AlertTriangle, ArchiveRestore, ArrowUpRight, CheckCircle2, Download, House, PackagePlus, Pencil, Plus, RotateCcw, ShoppingBag, Trash2, UsersRound, X } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { api, money, type Product, type Purchase } from '../api'
import { useAuth } from '../auth/useAuth'

type ShellContext = { notify: (message: string) => void }
type UnitPurchase = { id: string; data: string; quantidade: number; valor: number; usuario: { nome: string }; item: { nome: string; categoria: string } }
type Unit = { id: string; numero: string; bloco?: string | null; moradores: { id?: string; nome: string }[]; compras?: UnitPurchase[]; _count?: { moradores?: number; compras: number } }
type Resident = { id: string; numeroUsuario: string; nome: string; email?: string | null; telefone?: string | null; perfil: string; unidadeId?: string | null; unidade?: { numero: string; bloco?: string | null } | null; excluidoEm?: string | null }
const demoProducts: Product[] = [{ id: '1', nome: 'Leite integral 1L', categoria: 'Laticínios', quantidade: 24, preco: 5.49 }, { id: '2', nome: 'Café moído 500g', categoria: 'Mercearia', quantidade: 18, preco: 18.5 }, { id: '3', nome: 'Ovos caipiras · 12 un.', categoria: 'Mercearia', quantidade: 7, preco: 12.9 }]
const demoUnits: Unit[] = [{ id: 'a', numero: '302', bloco: 'A', moradores: [{ nome: 'Camila Rocha' }, { nome: 'Pedro Rocha' }] }, { id: 'b', numero: '105', bloco: 'A', moradores: [{ nome: 'Lucas Pereira' }] }, { id: 'c', numero: '804', bloco: 'B', moradores: [{ nome: 'Ana Souza' }, { nome: 'Caio Souza' }] }]
const demoResidents: Resident[] = [{ id: '1', numeroUsuario: '100302', nome: 'Camila Rocha', email: 'camila@email.com', telefone: '5511999990302', perfil: 'condomino', unidadeId: 'a', unidade: { numero: '302', bloco: 'A' } }, { id: '2', numeroUsuario: '100105', nome: 'Lucas Pereira', email: 'lucas@email.com', telefone: '5511999990105', perfil: 'condomino', unidadeId: 'b', unidade: { numero: '105', bloco: 'A' } }, { id: '3', numeroUsuario: '100804', nome: 'Ana Souza', email: 'ana@email.com', telefone: '5511999990804', perfil: 'condomino', unidadeId: 'c', unidade: { numero: '804', bloco: 'B' } }]
const demoPurchases: Purchase[] = [
  { id: 'CM-1048', data: new Date().toISOString(), quantidade: 2, valor: 10.98, usuario: { id: '1', nome: 'Camila Rocha' }, unidade: { id: '1', numero: '302', bloco: 'A' }, item: { id: '1', nome: 'Leite integral 1L', categoria: 'Laticínios' } },
  { id: 'CM-1047', data: new Date(Date.now() - 3600000).toISOString(), quantidade: 1, valor: 18.5, usuario: { id: '2', nome: 'Lucas Pereira' }, unidade: { id: '2', numero: '105', bloco: 'A' }, item: { id: '2', nome: 'Café moído 500g', categoria: 'Mercearia' } },
  { id: 'CM-1046', data: new Date(Date.now() - 86400000).toISOString(), quantidade: 1, valor: 12.9, usuario: { id: '3', nome: 'Ana Souza' }, unidade: { id: '3', numero: '804', bloco: 'B' }, item: { id: '3', nome: 'Ovos caipiras · 12 un.', categoria: 'Mercearia' } },
]

export function PurchasesPage({ resident = false }: { resident?: boolean }) {
  const { demo } = useAuth()
  const [purchases, setPurchases] = useState(demo ? demoPurchases : [])
  const [error, setError] = useState('')
  useEffect(() => { if (!demo) api<Purchase[]>('/compras').then(setPurchases).catch((caught: Error) => setError(caught.message)) }, [demo])
  const total = purchases.reduce((sum, purchase) => sum + Number(purchase.valor), 0)
  return <><section className="page-title-row"><div><span className="eyebrow"><i />{resident ? 'SEU HISTÓRICO' : 'MOVIMENTAÇÃO DO MERCADO'}</span><h1>{resident ? 'Minhas compras' : 'Compras'}</h1><p>{resident ? 'Acompanhe os produtos retirados na sua unidade.' : 'Acompanhe as compras e retiradas dos moradores.'}</p></div><button className="button button-secondary"><Download size={16} />Exportar</button></section><section className="metric-grid compact-metrics"><MiniMetric icon={<ShoppingBag />} label={resident ? 'Compras neste mês' : 'Compras hoje'} value={resident ? String(purchases.length) : '18'} /><MiniMetric icon={<span className="money-symbol">R$</span>} label="Total no período" value={money(resident ? total : 428.5)} /></section><section className={`panel recent-panel ${resident ? 'resident-purchases' : 'manager-purchases'}`}><div className="panel-heading"><div><span className="panel-eyebrow">JUNHO 2026</span><h2>Histórico de compras</h2></div><button className="button button-filter"><span>⌁</span>Filtrar</button></div>{error && <div className="inline-error" role="alert">{error}</div>}<div className="table-scroll"><table><thead><tr><th>COMPRA</th>{!resident && <th>UNIDADE</th>}<th>DATA</th><th>ITENS</th><th>VALOR</th><th>STATUS</th></tr></thead><tbody>{purchases.map((purchase) => <tr key={purchase.id}><td><span className="table-product"><span className="purchase-thumb"><ShoppingBag size={15} /></span><span><strong>{purchase.item.nome}</strong><small>#{purchase.id}</small></span></span></td>{!resident && <td>Apto {purchase.unidade.numero}</td>}<td>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(purchase.data))}</td><td>{purchase.quantidade} un.</td><td><strong>{money(purchase.valor)}</strong></td><td><span className="status-pill status-ok"><i />Retirado</span></td></tr>)}</tbody></table>{purchases.length === 0 && !error && <div className="empty-state">Nenhuma compra registrada neste período.</div>}</div></section></>
}

export function BuyPage() {
  const { demo, user } = useAuth()
  const [products, setProducts] = useState<Product[]>(() => demo ? demoProducts : [])
  const [selected, setSelected] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  useEffect(() => {
    if (!demo) api<Product[]>('/estoque').then(setProducts).catch((caught: Error) => setError(caught.message))
  }, [demo])
  const item = products.find((product) => product.id === selected)
  const submit = async () => {
    if (!item) return
    setBusy(true)
    setError('')
    try {
      if (!demo) await api<Purchase>('/compras', { method: 'POST', body: JSON.stringify({ itemId: item.id, quantidade: quantity }) })
      setProducts((current) => current.map((product) => product.id === item.id ? { ...product, quantidade: product.quantidade - quantity } : product))
      setSelected('')
      setQuantity(1)
      setSuccessMessage(`Compra registrada para ${user?.nome ?? 'o usuário'}. O estoque foi atualizado.`)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível registrar a compra.') }
    finally { setBusy(false) }
  }
  return <><section className="page-title-row"><div><span className="eyebrow"><i /> MERCADO DO CONDOMÍNIO</span><h1>Comprar produtos</h1><p>Escolha o que precisa e registre a retirada na sua unidade.</p></div><Link className="button button-secondary" to={user?.perfil === 'estoquista' ? '/minhas-compras-funcionario' : '/minhas-compras'}><ShoppingBag size={16} />Meu histórico</Link></section><div className="buy-layout"><section className="panel buy-panel"><div className="panel-heading"><div><span className="panel-eyebrow">PRODUTOS DISPONÍVEIS</span><h2>Escolha um produto</h2></div><span className="available-label"><i />Estoque atualizado</span></div><div className="shop-product-list">{products.filter((product) => product.quantidade > 0).map((product) => <button className={`shop-product ${selected === product.id ? 'shop-product-selected' : ''}`} key={product.id} onClick={() => { setSelected(product.id); setError('') }}><span className="product-thumb"><PackagePlus size={18} /></span><span className="shop-product-name"><strong>{product.nome}</strong><small>{product.categoria} · {product.quantidade} disponíveis</small></span><strong className="shop-product-price">{money(product.preco)}</strong><i className="radio-dot" /></button>)}{products.length === 0 && <div className="empty-state">Carregando produtos disponíveis…</div>}</div></section><aside className="panel order-panel"><span className="panel-eyebrow">SUA RETIRADA</span><h2>Resumo da compra</h2>{item ? <><div className="order-item"><span className="product-thumb"><PackagePlus size={17} /></span><span><strong>{item.nome}</strong><small>{money(item.preco)} / unidade</small></span></div><label className="quantity-control">Quantidade<span><button aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><input aria-label="Quantidade" min="1" max={item.quantidade} type="number" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(item.quantidade, Number(event.target.value))))} /><button aria-label="Aumentar quantidade" disabled={quantity >= item.quantidade} onClick={() => setQuantity((value) => Math.min(item.quantidade, value + 1))}>+</button></span></label><div className="order-total"><span>Total</span><strong>{money(item.preco * quantity)}</strong></div><button className="button button-primary order-submit" disabled={busy} onClick={() => { void submit() }}>{busy ? 'Registrando…' : 'Confirmar retirada'}<ArrowUpRight size={16} /></button></> : <div className="order-empty"><span className="order-empty-icon"><ShoppingBag size={20} /></span><p>Selecione um produto para ver o resumo.</p></div>}{error && <p className="form-error" role="alert">{error}</p>}<p className="order-note"><House size={14} />Retirada vinculada à sua unidade cadastrada.</p></aside></div>{successMessage && <div className="modal-backdrop" role="presentation"><section className="modal purchase-success-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-success-heading" aria-describedby="purchase-success-message"><CheckCircle2 className="purchase-success-icon" size={42} aria-hidden="true" /><h2 id="purchase-success-heading">Compra efetuada com sucesso!</h2><p id="purchase-success-message">{successMessage}</p><button className="button button-primary" autoFocus onClick={() => setSuccessMessage('')}>Entendi</button></section></div>}</>
}

export function UnitsPage({ resident = false }: { resident?: boolean }) {
  const { demo } = useAuth()
  const { notify } = useOutletContext<ShellContext>()
  const [units, setUnits] = useState<Unit[]>(() => demo ? (resident ? [{ ...demoUnits[0], compras: [{ id: 'CM-1048', data: new Date().toISOString(), quantidade: 2, valor: 10.98, usuario: { nome: 'Camila Rocha' }, item: { nome: 'Leite integral 1L', categoria: 'Laticínios' } }] }] : demoUnits) : [])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Unit | null>(null)
  const [deleting, setDeleting] = useState<Unit | null>(null)
  useEffect(() => {
    if (demo) return
    if (resident) api<Unit>('/unidades/minha-unidade').then((unit) => setUnits([unit])).catch((error: Error) => notify(error.message))
    else api<Unit[]>('/unidades').then(setUnits).catch((error: Error) => notify(error.message))
  }, [demo, resident, notify])
  const unit = units[0]
  const saveUnit = async (data: { numero: string; bloco?: string }, id?: string) => {
    if (demo) setUnits((current) => id ? current.map((item) => item.id === id ? { ...item, ...data } : item) : [...current, { ...data, id: `d${Date.now()}`, moradores: [] }])
    else if (id) await api<Omit<Unit, 'moradores'>>(`/unidades/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((saved) => setUnits((current) => current.map((item) => item.id === id ? { ...item, ...saved } : item)))
    else await api<Omit<Unit, 'moradores'>>('/unidades', { method: 'POST', body: JSON.stringify(data) }).then((saved) => setUnits((current) => [...current, { ...saved, moradores: [] }]))
    setModalOpen(false)
    setEditing(null)
    notify(id ? 'Unidade atualizada.' : 'Unidade cadastrada.')
  }
  const removeUnit = async (item: Unit) => {
    if (!demo) await api<void>(`/unidades/${item.id}`, { method: 'DELETE' })
    setUnits((current) => current.filter((unitItem) => unitItem.id !== item.id))
    setDeleting(null)
    notify('Unidade excluída.')
  }
  if (resident) return <><section className="page-title-row"><div><span className="eyebrow"><i />DADOS DO CONDOMÍNIO</span><h1>Minha unidade</h1><p>Informações vinculadas ao seu cadastro.</p></div></section>{unit ? <><section className="unit-profile panel"><span className="unit-icon"><House size={23} /></span><div><span className="panel-eyebrow">CONDOMÍNIO PÁTIO DAS FLORES</span><h2>Unidade {unit.numero}</h2><p>Bloco {unit.bloco ?? '—'} <i>·</i> {unit.moradores.length} moradores cadastrados</p></div><span className="status-pill status-ok"><i />Cadastro ativo</span></section><section className="panel unit-details"><h2>Moradores vinculados</h2>{unit.moradores.length ? unit.moradores.map((morador) => <div key={morador.id ?? morador.nome}><span>{morador.nome}</span><strong>Morador</strong></div>) : <div><span>Nenhum morador vinculado.</span></div>}</section><section className="panel unit-details"><div className="panel-heading"><div><span className="panel-eyebrow">HISTÓRICO COMPARTILHADO</span><h2>Compras da unidade</h2></div></div>{unit.compras?.length ? <div className="table-scroll"><table><thead><tr><th>PRODUTO</th><th>COMPRADOR</th><th>DATA</th><th>QUANTIDADE</th><th>VALOR</th></tr></thead><tbody>{unit.compras.map((purchase) => <tr key={purchase.id}><td><span className="table-product"><span className="purchase-thumb"><ShoppingBag size={15} /></span><strong>{purchase.item.nome}</strong></span></td><td>{purchase.usuario.nome}</td><td>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(purchase.data))}</td><td>{purchase.quantidade} un.</td><td><strong>{money(purchase.valor)}</strong></td></tr>)}</tbody></table></div> : <div className="empty-state">Ainda não há compras registradas para esta unidade.</div>}</section></> : <section className="panel empty-state">Nenhuma unidade vinculada ao seu cadastro.</section>}</>
  return <><section className="page-title-row"><div><span className="eyebrow"><i />MORADORES E CADASTROS</span><h1>Unidades</h1><p>Unidades e moradores do Condomínio Pátio das Flores.</p></div><button className="button button-primary" onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={17} />Nova unidade</button></section><section className="metric-grid compact-metrics"><MetricCard icon={<House />} label="Unidades cadastradas" value={String(units.length)} detail="no condomínio" /><MetricCard icon={<UsersRound />} label="Moradores vinculados" value={String(units.reduce((total, item) => total + item.moradores.length, 0))} detail="nas unidades listadas" /></section><section className="panel unit-details"><div className="panel-heading"><div><span className="panel-eyebrow">CADASTROS RECENTES</span><h2>Unidades do condomínio</h2></div></div>{units.map((item) => <div className="unit-row" key={item.id}><span className="unit-icon small"><House size={17} /></span><span><strong>Apto {item.numero}</strong><small>Bloco {item.bloco ?? '—'} · {item.moradores.map((residentItem) => residentItem.nome).join(', ') || 'Sem moradores vinculados'}</small></span><span className="unit-count">{item.moradores.length} morador(es)</span><button className="icon-button row-action" aria-label={`Editar unidade ${item.numero}`} onClick={() => { setEditing(item); setModalOpen(true) }}><Pencil size={14} /></button><button className="icon-button row-action" aria-label={`Excluir unidade ${item.numero}`} title="Excluir unidade" onClick={() => setDeleting(item)}><Trash2 size={14} /></button></div>)}</section>{modalOpen && <UnitModal initial={editing} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={saveUnit} />}{deleting && <UnitDeleteModal unit={deleting} onClose={() => setDeleting(null)} onConfirm={() => removeUnit(deleting)} />}</>
}

export function UsersPage() {
  const { demo, user: actor } = useAuth()
  const { notify } = useOutletContext<ShellContext>()
  const [users, setUsers] = useState<Resident[]>(() => demo ? demoResidents : [])
  const [units, setUnits] = useState<{ id: string; numero: string; bloco?: string | null }[]>(() => demo ? demoUnits.map(({ id, numero, bloco }) => ({ id, numero, bloco })) : [])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Resident | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  useEffect(() => {
    if (demo) return
    Promise.all([api<Resident[]>('/usuarios?incluiExcluidos=true'), api<{ id: string; numero: string; bloco?: string | null }[]>('/unidades')]).then(([residentList, unitList]) => { setUsers(residentList); setUnits(unitList) }).catch((error: Error) => notify(error.message))
  }, [demo, notify])
  const saveUser = async (data: { nome: string; email: string; telefone?: string; perfil: string; unidadeId?: string }, id?: string) => {
    if (demo) setUsers((current) => id ? current.map((item) => item.id === id ? { ...item, ...data, unidade: units.find((unit) => unit.id === data.unidadeId) ?? null } : item) : [...current, { ...data, id: `d${Date.now()}`, numeroUsuario: String(Math.floor(100000 + Math.random() * 900000)), unidade: units.find((unit) => unit.id === data.unidadeId) ?? null }])
    else {
      await api<Resident>(id ? `/usuarios/${id}` : '/usuarios', { method: id ? 'PATCH' : 'POST', body: JSON.stringify({ ...data, perfil: data.perfil.toUpperCase() }) })
      setUsers(await api<Resident[]>('/usuarios?incluiExcluidos=true'))
    }
    setModalOpen(false)
    setEditing(null)
    notify(id ? 'Cadastro atualizado.' : 'Usuário cadastrado e credenciais enviadas por e-mail.')
  }
  const archiveUser = async (residentUser: Resident) => {
    if (residentUser.id === actor?.id || residentUser.perfil === 'admin' && actor?.perfil !== 'admin') return
    if (!window.confirm(`Excluir o usuário ${residentUser.nome}? Os dados serão preservados e poderão ser restaurados.`)) return
    if (demo) setUsers((current) => current.map((item) => item.id === residentUser.id ? { ...item, excluidoEm: new Date().toISOString() } : item))
    else {
      await api<void>(`/usuarios/${residentUser.id}`, { method: 'DELETE' })
      setUsers((current) => current.map((item) => item.id === residentUser.id ? { ...item, excluidoEm: new Date().toISOString() } : item))
    }
    notify('Usuário excluído. Os dados foram preservados e podem ser restaurados.')
  }
  const restoreUser = async (residentUser: Resident) => {
    if (residentUser.perfil === 'admin' && actor?.perfil !== 'admin') return
    if (demo) setUsers((current) => current.map((item) => item.id === residentUser.id ? { ...item, excluidoEm: null } : item))
    else {
      await api<void>(`/usuarios/${residentUser.id}/restaurar`, { method: 'POST' })
      setUsers((current) => current.map((item) => item.id === residentUser.id ? { ...item, excluidoEm: null } : item))
    }
    notify('Usuário restaurado.')
  }
  const visibleUsers = users.filter((residentUser) => showArchived ? Boolean(residentUser.excluidoEm) : !residentUser.excluidoEm)
  const canManageUser = (residentUser: Resident) => residentUser.id !== actor?.id && (actor?.perfil === 'admin' || residentUser.perfil !== 'admin')
  return <>
    <section className="page-title-row">
      <div><span className="eyebrow"><i />ACESSO AO CONDOMÍNIO</span><h1>Moradores e usuários</h1><p>Perfis e unidades vinculados ao minimercado.</p></div>
      <button className="button button-primary" onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={17} />Cadastrar usuário</button>
    </section>
    <section className="panel table-panel">
      <div className="panel-heading users-heading">
        <div><span className="panel-eyebrow">{showArchived ? 'USUÁRIOS EXCLUÍDOS' : 'CADASTROS ATIVOS'}</span><h2>{visibleUsers.length} usuários</h2></div>
        <button className="button button-secondary" onClick={() => setShowArchived((current) => !current)}>
          {showArchived ? <UsersRound size={16} /> : <ArchiveRestore size={16} />}
          {showArchived ? 'Ver ativos' : `Ver excluídos (${users.filter((residentUser) => residentUser.excluidoEm).length})`}
        </button>
      </div>
      <div className="table-scroll">
        <table><thead><tr><th>Nº USUÁRIO</th><th>NOME</th><th>TELEFONE</th><th>E-MAIL</th><th>UNIDADE</th><th>PERFIL</th><th><span className="sr-only">Ações</span></th></tr></thead>
          <tbody>{visibleUsers.map((residentUser) => <tr key={residentUser.id}>
            <td>{residentUser.numeroUsuario}</td>
            <td><span className="table-product"><span className="avatar table-avatar">{residentUser.nome.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{residentUser.nome}</strong></span></td>
            <td>{residentUser.telefone ?? '—'}</td>
            <td>{residentUser.email ?? '—'}</td>
            <td>{residentUser.unidade ? `Apto ${residentUser.unidade.numero} · Bloco ${residentUser.unidade.bloco ?? '—'}` : 'Sem unidade'}</td>
            <td><span className="category-label">{roleTitle(residentUser.perfil)}</span></td>
            <td><div className="row-actions">
              {residentUser.excluidoEm
                ? canManageUser(residentUser) && <button className="icon-button row-action" aria-label={`Restaurar cadastro de ${residentUser.nome}`} title="Restaurar usuário" onClick={() => { void restoreUser(residentUser).catch((error: Error) => notify(error.message)) }}><RotateCcw size={14} /></button>
                : canManageUser(residentUser) && <>
                  <button className="icon-button row-action" aria-label={`Editar cadastro de ${residentUser.nome}`} onClick={() => { setEditing(residentUser); setModalOpen(true) }}><Pencil size={14} /></button>
                  <button className="icon-button row-action" aria-label={`Excluir cadastro de ${residentUser.nome}`} title="Excluir usuário" onClick={() => { void archiveUser(residentUser).catch((error: Error) => notify(error.message)) }}><Trash2 size={14} /></button>
                </>}
            </div></td>
          </tr>)}</tbody>
        </table>
        {visibleUsers.length === 0 && <div className="empty-state">{showArchived ? 'Nenhum usuário excluído.' : 'Nenhum usuário ativo.'}</div>}
      </div>
    </section>
    {modalOpen && <ResidentModal initial={editing} units={units} manager={actor?.perfil === 'admin'} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={saveUser} />}
  </>
}

function UnitModal({ initial, onClose, onSave }: { initial: Unit | null; onClose: () => void; onSave: (data: { numero: string; bloco?: string }, id?: string) => Promise<void> }) {
  const [numero, setNumero] = useState(initial?.numero ?? '')
  const [bloco, setBloco] = useState(initial?.bloco ?? '')
  const [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => { event.preventDefault(); try { await onSave({ numero: numero.trim(), bloco: bloco.trim() }, initial?.id) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível salvar a unidade.') } }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="unit-modal-heading"><div className="modal-heading"><div><span className="panel-eyebrow">UNIDADE CONDOMINIAL</span><h2 id="unit-modal-heading">{initial ? 'Editar unidade' : 'Nova unidade'}</h2></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={18} /></button></div><form onSubmit={(event) => { void submit(event) }}><label>Número<input autoFocus required type="number" min="0" step="1" value={numero} onChange={(event) => setNumero(event.target.value)} placeholder="Ex.: 302" /></label><label>Bloco<input value={bloco} onChange={(event) => setBloco(event.target.value)} placeholder="Ex.: A" /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary">Salvar unidade</button></div></form></section></div>
}

function UnitDeleteModal({ unit, onClose, onConfirm }: { unit: Unit; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const residentCount = unit._count?.moradores ?? unit.moradores.length
  const purchaseCount = unit._count?.compras ?? 0
  const hasLinks = residentCount > 0 || purchaseCount > 0
  const unitLabel = `Unidade ${unit.numero}${unit.bloco ? ` · Bloco ${unit.bloco}` : ''}`

  const confirm = async () => {
    setBusy(true)
    setError('')
    try { await onConfirm() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível excluir a unidade.') }
    finally { setBusy(false) }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}><section className="modal unit-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="unit-delete-heading" aria-describedby="unit-delete-description"><button autoFocus className="icon-button unit-delete-close" aria-label="Fechar" disabled={busy} onClick={onClose}><X size={18} /></button><span className={`unit-delete-icon ${hasLinks ? 'unit-delete-blocked' : ''}`}><AlertTriangle size={25} /></span><span className="panel-eyebrow">EXCLUSÃO DE UNIDADE</span><h2 id="unit-delete-heading">{hasLinks ? 'Esta unidade não pode ser excluída' : 'Excluir esta unidade?'}</h2><p id="unit-delete-description">{hasLinks ? `${unitLabel} ainda possui vínculos. Remova ou transfira esses registros antes de tentar novamente.` : `Você está prestes a excluir ${unitLabel}. Esta ação é permanente e não pode ser desfeita.`}</p><div className="unit-delete-details"><span><UsersRound size={16} />Moradores vinculados<strong>{residentCount}</strong></span><span><ShoppingBag size={16} />Compras registradas<strong>{purchaseCount}</strong></span></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button button-secondary" disabled={busy} onClick={onClose}>{hasLinks ? 'Fechar' : 'Cancelar'}</button><button type="button" className="button unit-delete-confirm" disabled={busy || hasLinks} onClick={() => { void confirm() }}>{busy ? 'Excluindo…' : hasLinks ? 'Exclusão indisponível' : 'Sim, excluir unidade'}</button></div></section></div>
}

function ResidentModal({ initial, units, manager: isAdmin, onClose, onSave }: { initial: Resident | null; units: { id: string; numero: string; bloco?: string | null }[]; manager: boolean; onClose: () => void; onSave: (data: { nome: string; email: string; telefone?: string; perfil: string; unidadeId?: string }, id?: string) => Promise<void> }) {
  const { user: creator } = useAuth()
  const manager = isAdmin || creator?.perfil === 'sindico'
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [telefone, setTelefone] = useState(initial?.telefone ?? '')
  const [perfil, setPerfil] = useState(initial?.perfil ?? 'condomino')
  const [unidadeId, setUnidadeId] = useState(initial?.unidadeId ?? '')
  const [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => { event.preventDefault(); try { await onSave({ nome: nome.trim(), email: email.trim(), telefone: telefone.replace(/\D/g, '') || undefined, perfil, unidadeId: unidadeId || undefined }, initial?.id) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível salvar o usuário.') } }
  const profiles = isAdmin ? [['admin', 'Administrador'], ['sindico', 'Síndico'], ['estoquista', 'Gestor de Estoque'], ['condomino', 'Condômino'], ['visitante', 'Visitante']] : [['sindico', 'Síndico'], ['estoquista', 'Gestor de Estoque'], ['condomino', 'Condômino'], ['visitante', 'Visitante']]
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="resident-modal-heading"><div className="modal-heading"><div><span className="panel-eyebrow">ACESSO AO CONDOMÍNIO</span><h2 id="resident-modal-heading">{initial ? 'Editar cadastro' : 'Cadastrar usuário'}</h2></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={18} /></button></div><form onSubmit={(event) => { void submit(event) }}><label>Nome<input autoFocus required minLength={2} value={nome} onChange={(event) => setNome(event.target.value)} /></label>{manager && <label>Perfil<select value={perfil} onChange={(event) => { setPerfil(event.target.value); if (event.target.value === 'visitante') setUnidadeId('') }}>{profiles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}<label>E-mail (login Google e recebimento das credenciais)<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="pessoa@exemplo.com" /></label><label>Telefone {perfil === 'condomino' ? '(obrigatório)' : '(opcional)'}<input inputMode="tel" required={perfil === 'condomino'} value={telefone} onChange={(event) => setTelefone(event.target.value)} placeholder="5511999999999" /></label>{perfil !== 'visitante' && <label>Unidade {perfil === 'condomino' ? '(obrigatória)' : '(opcional)'}<select required={perfil === 'condomino'} value={unidadeId} onChange={(event) => setUnidadeId(event.target.value)}><option value="">Sem unidade vinculada</option>{units.map((unit) => <option value={unit.id} key={unit.id}>Bloco {unit.bloco ?? '—'} · Apto {unit.numero}</option>)}</select></label>}{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary">{initial ? 'Salvar cadastro' : 'Criar e enviar credenciais'}</button></div></form></section></div>
}

function roleTitle(role: string) { return ({ admin: 'Administrador', sindico: 'Síndico', estoquista: 'Gestor de Estoque', condomino: 'Condômino', visitante: 'Visitante' } as Record<string, string>)[role] ?? role }

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <article className="mini-metric"><span className="metric-icon icon-green">{icon}</span><span><small>{label}</small><strong>{value}</strong></span></article> }
function MetricCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <article className="metric-card"><div className="metric-top"><span className="metric-icon icon-green">{icon}</span></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></article> }