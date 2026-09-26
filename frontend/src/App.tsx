import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Bell, Box, ChevronDown, CircleHelp, House, LogOut, Menu, PackagePlus, ShieldCheck, ShoppingBag, SlidersHorizontal, UsersRound, X } from 'lucide-react'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import type { Role } from './auth/auth-context'
import { DashboardPage } from './pages/DashboardPage'
import { InventoryPage } from './pages/InventoryPage'
import { PurchasesPage, BuyPage, UnitsPage, UsersPage } from './pages/CommercePages'
import { ReportsPage } from './pages/ReportsPageLive'
import { LoginPage } from './pages/LoginPage'
import './App.css'

const profileName: Record<Role, string> = { gestor: 'Gestor do estoque', sindico: 'Síndico', condomino: 'Condômino' }

function Protected({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="loading-screen" aria-label="Carregando sessão"><span className="loader" /></div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.perfil)) return <Navigate to={user.perfil === 'condomino' ? '/minhas-compras' : '/'} replace />
  return children
}

function LandingRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.perfil === 'condomino' ? '/minhas-compras' : '/'} replace />
}

function Shell() {
  const { user, demo, signOut } = useAuth()
  const [contrast, setContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const role = user?.perfil ?? 'gestor'
  const links = role === 'gestor'
    ? [{ to: '/', label: 'Visão geral', icon: House, end: true }, { to: '/estoque', label: 'Estoque', icon: Box }, { to: '/compras', label: 'Compras', icon: ShoppingBag }, { to: '/relatorios', label: 'Relatórios', icon: BarChart3 }, { to: '/usuarios', label: 'Moradores', icon: UsersRound }]
    : role === 'sindico'
      ? [{ to: '/', label: 'Visão geral', icon: House, end: true }, { to: '/compras', label: 'Compras', icon: ShoppingBag }, { to: '/relatorios', label: 'Relatórios', icon: BarChart3 }, { to: '/unidades', label: 'Unidades', icon: House }, { to: '/usuarios', label: 'Moradores', icon: UsersRound }]
      : [{ to: '/minhas-compras', label: 'Minhas compras', icon: ShoppingBag }, { to: '/comprar', label: 'Comprar produtos', icon: PackagePlus }, { to: '/minha-unidade', label: 'Minha unidade', icon: House }]

  useEffect(() => { document.documentElement.dataset.contrast = contrast ? 'high' : 'normal' }, [contrast])
  useEffect(() => { document.documentElement.dataset.textSize = largeText ? 'large' : 'normal' }, [largeText])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const pageTitle = links.find((link) => link.to === location.pathname)?.label ?? (location.pathname === '/' ? 'Visão geral' : 'Mercado do Pátio')
  const initials = user?.nome.split(' ').map((part) => part[0]).slice(0, 2).join('') ?? 'MP'

  return <div className="app-frame">
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    {mobileOpen && <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Navegação principal">
      <Link className="brand" to={role === 'condomino' ? '/minhas-compras' : '/'} aria-label="Mercado do Pátio, início"><span className="brand-mark"><House size={19} /></span><span className="brand-copy"><strong>mercado<span>.</span></strong><small>do pátio</small></span></Link>
      <div className="side-label">ESPAÇO DO CONDOMÍNIO</div>
      <nav className="nav-list">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} end={end} title={label} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`} to={to}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></NavLink>)}</nav>
      <div className="side-spacer" />
      <section className="accessibility-tools" aria-label="Opções de acessibilidade"><span className="side-label">ACESSIBILIDADE</span><button className={`tool-toggle ${contrast ? 'tool-on' : ''}`} aria-pressed={contrast} onClick={() => setContrast(!contrast)}><SlidersHorizontal size={16} /><span>Alto contraste</span><i className="toggle-dot" /></button><button className={`tool-toggle ${largeText ? 'tool-on' : ''}`} aria-pressed={largeText} onClick={() => setLargeText(!largeText)}><span className="text-size-icon">A+</span><span>Aumentar fonte</span><i className="toggle-dot" /></button></section>
      <div className="sidebar-bottom"><button className="help-link" onClick={() => setNotice('Fale com a administração do condomínio para receber ajuda.')}><CircleHelp size={17} />Central de ajuda<ArrowRight size={14} /></button><div className="profile-row"><span className="avatar">{initials}</span><span className="profile-copy"><strong>{user?.nome}</strong><small>{profileName[role]}</small></span><button className="icon-button" aria-label="Sair da conta" onClick={() => { void signOut(); navigate('/login') }}><LogOut size={16} /></button></div></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Abrir menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button><div className="breadcrumb"><span>Condomínio Pátio das Flores</span><span className="crumb-divider">/</span><strong>{pageTitle}</strong></div><div className="top-actions"><button className="icon-button notification-button" aria-label="Notificações" onClick={() => setNotice('Você está em dia com as notificações.')}><Bell size={18} /><i /></button><span className="top-divider" /><button className="condo-switch" onClick={() => setNotice('Condomínio Pátio das Flores')}><span className="condo-dot" />Pátio das Flores<ChevronDown size={15} /></button></div></header>
      {demo && <div className="demo-banner"><span className="demo-star">✳</span><strong>Demonstração interativa</strong><span>Os dados exibidos são exemplos.</span><button onClick={() => { void signOut(); navigate('/login') }}>Encerrar</button></div>}
      <main id="conteudo" className="page-content" tabIndex={-1}><Outlet context={{ notify: setNotice }} /></main>
      <footer className="page-footer"><span>Mercado do Pátio <i>·</i> Gestão do condomínio</span><span>Atualizado agora <i className="live-dot" /></span></footer>
    </div>
    {notice && <div className="toast" role="status"><ShieldCheck size={17} />{notice}<button className="icon-button" aria-label="Fechar aviso" onClick={() => setNotice('')}><X size={15} /></button></div>}
  </div>
}

export default function App() {
  return <AuthProvider><BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route element={<Protected><Shell /></Protected>}><Route index element={<Protected roles={['gestor', 'sindico']}><DashboardPage /></Protected>} /><Route path="estoque" element={<Protected roles={['gestor']}><InventoryPage /></Protected>} /><Route path="compras" element={<Protected roles={['gestor', 'sindico']}><PurchasesPage /></Protected>} /><Route path="minhas-compras" element={<Protected roles={['condomino']}><PurchasesPage resident /></Protected>} /><Route path="comprar" element={<Protected roles={['condomino']}><BuyPage /></Protected>} /><Route path="relatorios" element={<Protected roles={['gestor', 'sindico']}><ReportsPage /></Protected>} /><Route path="unidades" element={<Protected roles={['gestor', 'sindico']}><UnitsPage /></Protected>} /><Route path="minha-unidade" element={<Protected roles={['condomino']}><UnitsPage resident /></Protected>} /><Route path="usuarios" element={<Protected roles={['gestor', 'sindico']}><UsersPage /></Protected>} /><Route path="*" element={<LandingRedirect />} /></Route></Routes></BrowserRouter></AuthProvider>
}
