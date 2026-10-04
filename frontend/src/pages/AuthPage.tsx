import { useEffect, useState } from 'react'
import { ArrowUpRight, House, ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_URL } from '../api'
import type { Role } from '../auth/auth-context'
import { useAuth } from '../auth/useAuth'

const startPath: Record<Role, string> = { admin: '/', sindico: '/', estoquista: '/estoque', condomino: '/minhas-compras', visitante: '/estoque' }

export function LoginPage() {
  const { enterDemo, signIn, requestPasswordRecovery, selfRegisterCondomino } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState<'login' | 'recovery' | 'register'>('login')
  const [showLocalLogin, setShowLocalLogin] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [demoRole, setDemoRole] = useState<Role>('admin')
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [selfName, setSelfName] = useState('')
  const [selfEmail, setSelfEmail] = useState('')
  const [selfPhone, setSelfPhone] = useState('')
  const [selfUnit, setSelfUnit] = useState('')
  const [units, setUnits] = useState<{ id: string; numero: string; bloco?: string | null }[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)
  const [registerStep, setRegisterStep] = useState(1)
  const [info, setInfo] = useState('')
  const [error, setError] = useState(new URLSearchParams(location.search).get('erro') === 'nao-cadastrado'
    ? 'Essa conta Google ainda não está cadastrada. Peça acesso à administração.'
    : new URLSearchParams(location.search).has('erro') ? 'Não foi possível concluir o login.' : '')
  const [busy, setBusy] = useState(false)
  const from = (location.state as { from?: string } | null)?.from

  useEffect(() => {
    if (view !== 'register' || units.length > 0) return
    let active = true
    fetch(`${API_URL}/inscricao/unidades`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'Não foi possível carregar as unidades.')
        return data as { id: string; numero: string; bloco?: string | null }[]
      })
      .then((data) => { if (active) setUnits(data) })
      .catch((caught: Error) => {
        if (active) setError(caught instanceof TypeError
          ? 'Não foi possível conectar ao serviço para carregar as unidades.'
          : caught.message)
      })
      .finally(() => { if (active) setUnitsLoading(false) })
    return () => { active = false }
  }, [view, units.length])

  const changeView = (nextView: 'login' | 'recovery' | 'register') => {
    setView(nextView)
    setInfo('')
    setError('')
    setShowResetForm(false)
    if (nextView === 'register' && units.length === 0) setUnitsLoading(true)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await signIn(identifier, password)
      navigate(user.deveTrocarSenha ? '/alterar-senha' : from ?? startPath[user.perfil], { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível entrar.')
    } finally {
      setBusy(false)
    }
  }

  const submitRecovery = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await requestPasswordRecovery(recoveryIdentifier)
      setInfo('Se os dados estiverem corretos, enviaremos instruções de recuperação para o e-mail cadastrado.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível solicitar recuperação.')
    } finally {
      setBusy(false)
    }
  }

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      if (resetPassword.length < 10) throw new Error('Use uma senha com pelo menos 10 caracteres.')
      if (resetPassword !== resetConfirm) throw new Error('As senhas não conferem.')
      const response = await fetch(`${API_URL}/auth/redefinir-senha`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, novaSenha: resetPassword }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível redefinir a senha.')
      setInfo('Senha redefinida. Agora você já pode entrar com sua nova senha.')
      setShowResetForm(false)
      setView('login')
      setShowLocalLogin(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível redefinir a senha.')
    } finally {
      setBusy(false)
    }
  }

  const submitRegistration = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await selfRegisterCondomino({ nome: selfName, emailContato: selfEmail, telefone: selfPhone, unidadeId: selfUnit })
      setInfo('Solicitação enviada. Você receberá as instruções de acesso no e-mail cadastrado.')
      setView('login')
      setSelfName('')
      setSelfEmail('')
      setSelfPhone('')
      setSelfUnit('')
      setRegisterStep(1)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível concluir o cadastro.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="login-page">
    <section className="login-story">
      <div className="login-topline"><span className="brand-mark"><House size={19} /></span><span className="login-brand">mercado<span>.</span><small>do pátio</small></span><span className="login-edition">CONDOMÍNIO PÁTIO DAS FLORES</span></div>
      <div className="login-hero"><span className="eyebrow"><i />UM BOM DIA COMEÇA PERTO</span><h1>O seu mercado,<br /><em>do lado de casa.</em></h1><p>Compras simples, estoque organizado e tudo em harmonia com a vida do condomínio.</p><div className="login-illustration" aria-hidden="true"><div className="sun-disc" /><div className="shop-building"><div className="awning"><i /><i /><i /><i /><i /><i /><i /></div><div className="shop-window"><span /><span /><span /></div><div className="shop-door" /></div><div className="plant plant-one"><i /><i /><i /><b /></div><div className="plant plant-two"><i /><i /><i /><b /></div><div className="ground-line" /></div></div>
      <div className="login-footnote"><span><ShieldCheck size={16} />Acesso exclusivo para moradores</span><span>01 — 03</span></div>
    </section>
    <section className="login-panel"><div className="login-panel-content">
      <span className="login-kicker">BEM-VINDO AO MERCADO DO PÁTIO</span>
      <h2>{view === 'login' ? 'Entre para continuar' : view === 'recovery' ? 'Recupere seu acesso' : 'Cadastre-se como condômino'}</h2>
      <p>{view === 'login' ? 'Acesse o mercado do seu condomínio de forma simples e segura.' : view === 'recovery' ? 'Vamos ajudar você a voltar para sua conta.' : 'Preencha seus dados em poucos passos.'}</p>
      {error && <div className="login-error" role="alert">{error}</div>}
      {info && <div className="login-success" role="status">{info}</div>}
      {view === 'login' && <>
        <a className="google-button google-button-primary" href={`${API_URL}/auth/google`}><GoogleMark />Continuar com Google<ArrowUpRight size={16} /></a>
        <div className="login-separator"><span />ou<span /></div>
        {!showLocalLogin
          ? <button className="button button-secondary local-login-toggle" onClick={() => setShowLocalLogin(true)}>Entrar com número ou telefone</button>
          : <form className="local-login" onSubmit={(event) => { void submit(event) }}>
            <label>Número de usuário ou telefone<input autoComplete="username" inputMode="tel" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Ex.: 000123 ou (11) 99999-0000" /></label>
            <label>Senha<input autoComplete="current-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button className="button button-primary demo-button" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}<ArrowUpRight size={16} /></button>
            <button type="button" className="text-link login-inline-link" onClick={() => changeView('recovery')}>Esqueci minha senha</button>
          </form>}
        {!showLocalLogin && <button className="text-link login-inline-link" onClick={() => changeView('recovery')}>Esqueci minha senha</button>}
        <p className="login-register-prompt">Ainda não tem acesso? <button className="text-link" onClick={() => changeView('register')}>Cadastre-se como condômino</button></p>
        <button type="button" className="text-link demo-disclosure" aria-expanded={showDemo} onClick={() => setShowDemo((current) => !current)}>
          {showDemo ? 'Ocultar demonstração' : 'Conheça o sistema'}
        </button>
        {showDemo && <div className="demo-entry"><div className="demo-title"><span className="demo-icon">✳</span><span><strong>Conhecer o sistema</strong><small>Dados fictícios, sem gravação no banco</small></span></div><label htmlFor="demo-role">Perfil de acesso</label><select id="demo-role" value={demoRole} onChange={(event) => setDemoRole(event.target.value as Role)}><option value="admin">Administrador</option><option value="sindico">Síndico</option><option value="estoquista">Gestor de Estoque</option><option value="condomino">Condômino</option><option value="visitante">Visitante</option></select><button className="button button-dark demo-button" onClick={() => { enterDemo(demoRole); navigate(startPath[demoRole]) }}>Entrar na demonstração<ArrowUpRight size={16} /></button></div>}
        <p className="privacy-note"><ShieldCheck size={14} />A senha temporária deve ser trocada no primeiro acesso.</p>
      </>}
      {view === 'recovery' && <>
        {!showResetForm
          ? <form className="local-login auth-flow-form" onSubmit={(event) => { void submitRecovery(event) }}>
            <label>Número de usuário ou telefone<input autoComplete="username" required value={recoveryIdentifier} onChange={(event) => setRecoveryIdentifier(event.target.value)} placeholder="Ex.: 000123 ou (11) 99999-0000" /></label>
            <button type="submit" className="button button-primary demo-button" disabled={busy}>{busy ? 'Enviando…' : 'Enviar instruções'}</button>
            <button type="button" className="text-link login-inline-link" onClick={() => setShowResetForm(true)}>Já tenho um token de recuperação</button>
          </form>
          : <form className="local-login auth-flow-form" onSubmit={(event) => { void submitReset(event) }}>
            <label>Token de recuperação<input required value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder="Cole o token recebido" /></label>
            <label>Nova senha<input autoComplete="new-password" minLength={10} required type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} placeholder="Mínimo 10 caracteres" /></label>
            <label>Confirmar nova senha<input autoComplete="new-password" required type="password" value={resetConfirm} onChange={(event) => setResetConfirm(event.target.value)} /></label>
            <button type="submit" className="button button-primary demo-button" disabled={busy}>{busy ? 'Salvando…' : 'Redefinir senha'}</button>
          </form>}
        <button className="text-link login-inline-link" onClick={() => changeView('login')}>Voltar para entrar</button>
      </>}
      {view === 'register' && <>
        {info
          ? <div className="auth-registration-success"><p>{info}</p><button className="button button-primary" onClick={() => changeView('login')}>Voltar para entrar</button></div>
          : <>
            <div className="registration-progress" aria-label={`Etapa ${registerStep} de 3`}>
              {[1, 2, 3].map((step) => <span key={step} className={step <= registerStep ? 'step-active' : ''}><i>{step}</i>{step === 1 ? 'Seus dados' : step === 2 ? 'Sua unidade' : 'Confirmação'}</span>)}
            </div>
            {registerStep === 1 && <form className="local-login auth-flow-form" onSubmit={(event) => { event.preventDefault(); setRegisterStep(2); setError('') }}>
              <label>Nome completo<input autoComplete="name" required minLength={2} value={selfName} onChange={(event) => setSelfName(event.target.value)} placeholder="Ex.: Ana Souza" /></label>
              <label>E-mail de contato<input autoComplete="email" required type="email" value={selfEmail} onChange={(event) => setSelfEmail(event.target.value)} placeholder="voce@exemplo.com" /></label>
              <label>Telefone<input autoComplete="tel" required inputMode="tel" value={selfPhone} onChange={(event) => setSelfPhone(event.target.value)} placeholder="(11) 99999-0000" /></label>
              <button className="button button-primary demo-button">Continuar</button>
            </form>}
            {registerStep === 2 && <form className="local-login auth-flow-form" onSubmit={(event) => { event.preventDefault(); setRegisterStep(3); setError('') }}>
              <label>Bloco e apartamento<select required value={selfUnit} onChange={(event) => setSelfUnit(event.target.value)} disabled={unitsLoading || units.length === 0}>
                <option value="">{unitsLoading ? 'Carregando unidades…' : units.length ? 'Selecione sua unidade' : 'Nenhuma unidade disponível'}</option>
                {units.map((unit) => <option value={unit.id} key={unit.id}>Bloco {unit.bloco ?? '—'} · Apto {unit.numero}</option>)}
              </select></label>
              {!unitsLoading && units.length === 0 && <p className="auth-help-text">Não foi possível encontrar unidades para cadastro. Fale com a administração.</p>}
              <div className="auth-step-actions"><button type="button" className="button button-secondary" onClick={() => setRegisterStep(1)}>Voltar</button><button className="button button-primary" disabled={!units.length}>Continuar</button></div>
            </form>}
            {registerStep === 3 && <form className="local-login auth-flow-form" onSubmit={(event) => { void submitRegistration(event) }}>
              <div className="registration-summary"><span>Nome<strong>{selfName}</strong></span><span>E-mail<strong>{selfEmail}</strong></span><span>Telefone<strong>{selfPhone}</strong></span><span>Unidade<strong>{units.find((unit) => unit.id === selfUnit) ? `Bloco ${units.find((unit) => unit.id === selfUnit)?.bloco ?? '—'} · Apto ${units.find((unit) => unit.id === selfUnit)?.numero}` : ''}</strong></span></div>
              <div className="auth-step-actions"><button type="button" className="button button-secondary" onClick={() => setRegisterStep(2)}>Voltar</button><button className="button button-primary" disabled={busy}>{busy ? 'Enviando…' : 'Confirmar cadastro'}</button></div>
            </form>}
          </>}
        <button className="text-link login-inline-link" onClick={() => changeView('login')}>Voltar para entrar</button>
      </>}
    </div><div className="login-panel-bottom"><span>Precisa de acesso? <a href="mailto:administracao@patiodasflores.com.br">Fale com a administração</a></span><span>© 2026 Mercado do Pátio</span></div></section>
  </main>
}

export function PasswordChangePage() {
  const { user, changePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (next !== confirm) return setError('As senhas novas não conferem.')
    if (next.length < 10) return setError('Use uma senha com pelo menos 10 caracteres.')
    setBusy(true)
    setError('')
    try {
      await changePassword(current, next)
      navigate(startPath[user?.perfil ?? 'condomino'], { replace: true })
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível trocar a senha.') }
    finally { setBusy(false) }
  }

  return <main className="password-page"><form className="password-panel" onSubmit={(event) => { void submit(event) }}><span className="eyebrow"><i />SEGURANÇA DA CONTA</span><h1>Crie sua senha pessoal</h1><p>Para continuar, substitua a senha temporária por uma senha nova.</p>{user?.senhaConfigurada && <label>Senha temporária<input autoComplete="current-password" required type="password" value={current} onChange={(event) => setCurrent(event.target.value)} /></label>}<label>Nova senha<input autoComplete="new-password" minLength={10} required type="password" value={next} onChange={(event) => setNext(event.target.value)} /></label><label>Confirme a nova senha<input autoComplete="new-password" minLength={10} required type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar senha'}</button><button className="text-link password-logout" type="button" onClick={() => { void signOut(); navigate('/login') }}>Sair</button></form></main>
}

function GoogleMark() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"/></svg> }