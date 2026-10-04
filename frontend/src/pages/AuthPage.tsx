import { useState } from 'react'
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
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [demoRole, setDemoRole] = useState<Role>('admin')
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [selfName, setSelfName] = useState('')
  const [selfEmail, setSelfEmail] = useState('')
  const [selfPhone, setSelfPhone] = useState('')
  const [selfUnit, setSelfUnit] = useState('')
  const [info, setInfo] = useState('')
  const [error, setError] = useState(new URLSearchParams(location.search).get('erro') === 'nao-cadastrado'
    ? 'Essa conta Google ainda não está cadastrada. Peça acesso à administração.'
    : new URLSearchParams(location.search).has('erro') ? 'Não foi possível concluir o login.' : '')
  const [busy, setBusy] = useState(false)
  const from = (location.state as { from?: string } | null)?.from

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

  return <main className="login-page">
    <section className="login-story">
      <div className="login-topline"><span className="brand-mark"><House size={19} /></span><span className="login-brand">mercado<span>.</span><small>do pátio</small></span><span className="login-edition">CONDOMÍNIO PÁTIO DAS FLORES</span></div>
      <div className="login-hero"><span className="eyebrow"><i />UM BOM DIA COMEÇA PERTO</span><h1>O seu mercado,<br /><em>do lado de casa.</em></h1><p>Compras simples, estoque organizado e tudo em harmonia com a vida do condomínio.</p><div className="login-illustration" aria-hidden="true"><div className="sun-disc" /><div className="shop-building"><div className="awning"><i /><i /><i /><i /><i /><i /><i /></div><div className="shop-window"><span /><span /><span /></div><div className="shop-door" /></div><div className="plant plant-one"><i /><i /><i /><b /></div><div className="plant plant-two"><i /><i /><i /><b /></div><div className="ground-line" /></div></div>
      <div className="login-footnote"><span><ShieldCheck size={16} />Acesso exclusivo para moradores</span><span>01 — 03</span></div>
    </section>
    <section className="login-panel"><div className="login-panel-content">
      <span className="login-kicker">BEM-VINDO AO MERCADO DO PÁTIO</span><h2>Entre para continuar</h2><p>Acesse com Google ou suas credenciais do condomínio.</p>
      {error && <div className="login-error" role="alert">{error}</div>}
      <a className="google-button" href={`${API_URL}/auth/google`}><GoogleMark />Continuar com Google<ArrowUpRight size={16} /></a>
      <div className="login-separator"><span />ou entre com número/telefone<span /></div>
      <form className="local-login" onSubmit={(event) => { void submit(event) }}>
        <label>Número de usuário ou telefone<input autoComplete="username" inputMode="tel" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="000123 ou (11) 99999-0000" /></label>
        <label>Senha<input autoComplete="current-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="button button-primary demo-button" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}<ArrowUpRight size={16} /></button>
      </form>
      <div className="login-separator"><span />recuperação de senha<span /></div>
      <form className="local-login" onSubmit={async (event) => { event.preventDefault(); try { setBusy(true); setInfo(''); setError(''); await requestPasswordRecovery(recoveryIdentifier); setInfo('Se os dados estiverem corretos, enviaremos instruções de recuperação para o e-mail ou telefone cadastrado.'); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível solicitar recuperação.'); } finally { setBusy(false); } }}>
        <label>Informe seu número/telefone para recuperar o acesso<input value={recoveryIdentifier} onChange={(event) => setRecoveryIdentifier(event.target.value)} placeholder="000123 ou (11) 99999-0000" /></label>
        <button type="submit" className="button button-dark demo-button" disabled={busy}>Solicitar recuperação</button>
      </form>
      <div className="login-separator"><span />redefinir senha<span /></div>
      <form className="local-login" onSubmit={async (event) => { event.preventDefault(); try { setBusy(true); setInfo(''); setError(''); if (resetPassword.length < 10) throw new Error('Use uma senha com pelo menos 10 caracteres.'); if (resetPassword !== resetConfirm) throw new Error('As senhas não conferem.'); await fetch(`${API_URL}/auth/redefinir-senha`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken, novaSenha: resetPassword }) }).then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error ?? 'Não foi possível redefinir a senha.'); setInfo('Senha redefinida com sucesso.'); }); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível redefinir a senha.'); } finally { setBusy(false); } }}>
        <label>Token de recuperação<input value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder="Cole o token recebido" /></label>
        <label>Nova senha<input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} placeholder="Mínimo 10 caracteres" /></label>
        <label>Confirmar nova senha<input type="password" value={resetConfirm} onChange={(event) => setResetConfirm(event.target.value)} placeholder="Repita a nova senha" /></label>
        <button type="submit" className="button button-primary demo-button" disabled={busy}>Redefinir senha</button>
      </form>
      <div className="login-separator"><span />autoinscrição de condômino<span /></div>
      <form className="local-login" onSubmit={async (event) => { event.preventDefault(); try { setBusy(true); setInfo(''); setError(''); if (!selfName || !selfEmail || !selfPhone || !selfUnit) throw new Error('Preencha nome, e-mail, telefone e unidade.'); await selfRegisterCondomino({ nome: selfName, emailContato: selfEmail, telefone: selfPhone, unidadeId: selfUnit }); setInfo('Cadastro enviado com sucesso. Você receberá as instruções de acesso no e-mail cadastrado.'); setSelfName(''); setSelfEmail(''); setSelfPhone(''); setSelfUnit(''); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível cadastrar o condômino.'); } finally { setBusy(false); } }}>
        <label>Nome completo<input value={selfName} onChange={(event) => setSelfName(event.target.value)} placeholder="Ex.: Ana Souza" /></label>
        <label>E-mail de contato<input type="email" value={selfEmail} onChange={(event) => setSelfEmail(event.target.value)} placeholder="ana@exemplo.com" /></label>
        <label>Telefone<input value={selfPhone} onChange={(event) => setSelfPhone(event.target.value)} placeholder="(11) 99999-0000" /></label>
        <label>Unidade vinculado<input value={selfUnit} onChange={(event) => setSelfUnit(event.target.value)} placeholder="ID da unidade" /></label>
        <button type="submit" className="button button-dark demo-button" disabled={busy}>Cadastrar-se como condômino</button>
      </form>
      {info && <div className="login-success" role="status">{info}</div>}
      <div className="login-separator"><span />modo demonstração<span /></div>
      <div className="demo-entry"><div className="demo-title"><span className="demo-icon">✳</span><span><strong>Conhecer o sistema</strong><small>Dados fictícios, sem gravação no banco</small></span></div><label htmlFor="demo-role">Perfil de acesso</label><select id="demo-role" value={demoRole} onChange={(event) => setDemoRole(event.target.value as Role)}><option value="admin">Administrador</option><option value="sindico">Síndico</option><option value="estoquista">Gestor de Estoque</option><option value="condomino">Condômino</option><option value="visitante">Visitante</option></select><button className="button button-dark demo-button" onClick={() => { enterDemo(demoRole); navigate(startPath[demoRole]) }}>Entrar na demonstração<ArrowUpRight size={16} /></button></div>
      <p className="privacy-note"><ShieldCheck size={14} />A senha temporária deve ser trocada no primeiro acesso.</p>
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