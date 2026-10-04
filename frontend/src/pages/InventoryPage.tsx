import { useEffect, useMemo, useState } from 'react'
import { Box, Download, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { api, money, type Product } from '../api'
import { useAuth } from '../auth/useAuth'

const examples: Product[] = [
  { id: 'd1', nome: 'Leite integral 1L', categoria: 'Laticínios', quantidade: 24, preco: 5.49 },
  { id: 'd2', nome: 'Ovos caipiras · 12 un.', categoria: 'Mercearia', quantidade: 7, preco: 12.9 },
  { id: 'd3', nome: 'Pão de forma', categoria: 'Padaria', quantidade: 3, preco: 9.75 },
  { id: 'd4', nome: 'Café moído 500g', categoria: 'Mercearia', quantidade: 18, preco: 18.5 },
  { id: 'd5', nome: 'Água mineral 1,5L', categoria: 'Bebidas', quantidade: 2, preco: 3.25 },
]
type ShellContext = { notify: (message: string) => void }

export function InventoryPage({ readOnly = false }: { readOnly?: boolean }) {
  const { demo } = useAuth()
  const { notify } = useOutletContext<ShellContext>()
  const [products, setProducts] = useState<Product[]>(() => demo ? examples : [])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas as categorias')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  useEffect(() => {
    if (demo) return
    api<Product[]>('/estoque').then(setProducts).catch((error: Error) => {
      setProducts([])
      notify(error.message)
    })
  }, [demo, notify])
  const categories = Array.from(new Set(products.map((product) => product.categoria)))
  const filtered = useMemo(() => products.filter((product) => product.nome.toLowerCase().includes(query.toLowerCase()) && (category === 'Todas as categorias' || product.categoria === category)), [products, query, category])

  const saveProduct = async (data: Omit<Product, 'id'>, id?: string) => {
    if (demo) setProducts((current) => id ? current.map((item) => item.id === id ? { ...data, id } : item) : [{ ...data, id: `d${Date.now()}` }, ...current])
    else if (id) {
      const product = await api<Product>(`/estoque/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
      setProducts((current) => current.map((item) => item.id === id ? product : item))
    } else {
      const product = await api<Product>('/estoque', { method: 'POST', body: JSON.stringify(data) })
      setProducts((current) => current.concat(product))
    }
    setModalOpen(false)
    setEditing(null)
    notify(id ? 'Produto atualizado.' : 'Produto adicionado ao estoque.')
  }

  const removeProduct = async (product: Product) => {
    if (demo) setProducts((current) => current.filter((item) => item.id !== product.id))
    else { await api<void>(`/estoque/${product.id}`, { method: 'DELETE' }); setProducts((current) => current.filter((item) => item.id !== product.id)) }
    notify('Produto removido do estoque.')
  }

  return <><section className="page-title-row"><div><span className="eyebrow"><i />{readOnly ? 'CONSULTA DE PRODUTOS' : 'CONTROLE DE PRODUTOS'}</span><h1>{readOnly ? 'Produtos e preços' : 'Estoque'}</h1><p>{readOnly ? 'Produtos disponíveis no minimercado.' : 'Produtos disponíveis no minimercado do condomínio.'}</p></div>{!readOnly && <button className="button button-primary" onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={17} />Novo produto</button>}</section><div className="inventory-summary"><span><strong>{products.length}</strong> produtos cadastrados</span><span><i className="inventory-dot" />Estoque atualizado agora</span></div><section className="panel table-panel"><div className="table-toolbar"><label className="search-field"><Search size={17} /><input aria-label="Buscar produto" placeholder="Buscar produto..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></label><label className="filter-field"><SlidersHorizontal size={16} /><select aria-label="Filtrar categoria" value={category} onChange={(event) => setCategory(event.target.value)}><option>Todas as categorias</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><button className="icon-button export-button" aria-label="Exportar estoque" onClick={() => notify('A exportação estará disponível em breve.')}><Download size={17} /></button></div><div className="table-scroll"><table><thead><tr><th>PRODUTO</th><th>CATEGORIA</th><th>QUANTIDADE</th><th>PREÇO UNITÁRIO</th><th>STATUS</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><span className="table-product"><span className="product-thumb"><Box size={16} /></span><strong>{product.nome}</strong></span></td><td><span className="category-label">{product.categoria}</span></td><td><strong>{product.quantidade}<small className="unit-suffix"> un.</small></strong></td><td><strong>{money(product.preco)}</strong></td><td><span className={`status-pill ${product.quantidade < 4 ? 'status-danger' : product.quantidade < 8 ? 'status-warning' : 'status-ok'}`}><i />{product.quantidade < 4 ? 'Crítico' : product.quantidade < 8 ? 'Estoque baixo' : 'Disponível'}</span></td><td>{!readOnly && <span className="row-actions"><button className="icon-button row-action" aria-label={`Editar ${product.nome}`} onClick={() => { setEditing(product); setModalOpen(true) }}><Pencil size={14} /></button><button className="icon-button row-action" aria-label={`Remover ${product.nome}`} onClick={() => { void removeProduct(product).catch((error: Error) => notify(error.message)) }}><Trash2 size={15} /></button></span>}</td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state">Nenhum produto encontrado.</div>}</div><div className="table-footer">Exibindo <strong>{filtered.length}</strong> de <strong>{products.length}</strong> produtos<span>Atualizado hoje</span></div></section>{!readOnly && modalOpen && <ProductModal initial={editing} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={saveProduct} />}</>
}

function ProductModal({ initial, onClose, onSave }: { initial: Product | null; onClose: () => void; onSave: (product: Omit<Product, 'id'>, id?: string) => Promise<void> }) {
  const [name, setName] = useState(initial?.nome ?? '')
  const [category, setCategory] = useState(initial?.categoria ?? 'Mercearia')
  const [quantity, setQuantity] = useState(initial ? String(initial.quantidade) : '')
  const [price, setPrice] = useState(initial ? String(initial.preco) : '')
  const [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    try { await onSave({ nome: name.trim(), categoria: category, quantidade: Number(quantity), preco: Number(price.replace(',', '.')) }, initial?.id) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Erro ao salvar o produto.') }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-heading"><div className="modal-heading"><div><span className="panel-eyebrow">CADASTRO DE PRODUTO</span><h2 id="product-modal-heading">{initial ? 'Editar produto' : 'Novo produto'}</h2></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={19} /></button></div><form onSubmit={(event) => { void submit(event) }}><label>Nome do produto<input autoFocus required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Arroz integral 1kg" /></label><label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Mercearia</option><option>Laticínios</option><option>Bebidas</option><option>Padaria</option><option>Higiene</option></select></label><div className="form-row"><label>Quantidade<input required min="0" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0" /></label><label>Preço unitário<input required min="0.01" step="0.01" type="number" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0,00" /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary">{initial ? 'Salvar alterações' : <><Plus size={16} />Adicionar produto</>}</button></div></form></section></div>
}