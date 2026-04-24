import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

type AuthCandidate = {
  id: string
  nome: string
  email: string
  tenantId: string
}

type AuthSession = {
  accessToken: string
  accessTokenExpiresAtUtc: string
  accessTokenExpiresInSeconds: number
  refreshToken: string
  refreshTokenExpiresAtUtc: string
  candidate: AuthCandidate
}

type PortalProfile = {
  id: string
  nome: string
  email: string
  fone?: string | null
  cidade?: string | null
  uf?: string | null
  linkedinUrl?: string | null
  resumoProfissional?: string | null
  avatarUrl?: string | null
  curriculo?: { id: string; nomeArquivo: string; createdAtUtc: string } | null
}

type PortalCompletion = {
  sections: Record<string, number>
  overall: number
  warnings?: string[]
  evidence?: Record<string, string>
  suggestions?: { section: string; text: string; impact: string }[]
}

type PortalMatchItem = {
  vagaId: string
  score: number
  title?: string | null
  area?: string | null
  city?: string | null
  uf?: string | null
  mode?: string | null
  level?: string | null
  reason?: string | null
}

type PortalSkill = { id: string; tipo: string; nome: string; nivel: string; evidencia?: string | null }
type PortalCertification = { id: string; nome: string; instituicao?: string | null; ano?: string | null; link?: string | null }
type PortalPortfolio = {
  skills: PortalSkill[]
  certifications: PortalCertification[]
  links: { linkedin?: string | null; github?: string | null; portfolio?: string | null; drive?: string | null }
  preferences: { workModel?: string | null; availability?: string | null; salary?: string | null; shift?: string | null; note?: string | null }
  tags?: string | null
}
type PortalEducationItem = { id: string; curso: string; instituicao?: string | null; tipo?: string | null; status?: string | null; inicio?: string | null; fim?: string | null; observacoes?: string | null; link?: string | null }
type PortalEducation = { summary: { nivel?: string | null; areaPrincipal?: string | null; situacao?: string | null; destaques?: string | null }; items: PortalEducationItem[] }
type PortalExperience = { id: string; empresa: string; cargo: string; inicio?: string | null; fim?: string | null; local?: string | null; atividades?: string | null }
type PortalProject = { id: string; nome: string; periodo?: string | null; descricao?: string | null; link?: string | null; stack?: string | null; destaques?: string | null }
type PortalExperienceProject = { experiences: PortalExperience[]; projects: PortalProject[] }
type PortalPreferences = Record<string, string | null | undefined> & { updatedAtUtc?: string | null }
type PortalAccessibility = {
  idioma?: string | null
  canal?: string | null
  melhorHorario?: string | null
  observacoesComunicacao?: string | null
  precisaLegendas: boolean
  precisaInterprete: boolean
  precisaLeitorTela: boolean
  precisaBaixaEstimulo: boolean
  precisaMobilidade: boolean
  precisaTempoExtra: boolean
  detalhesNecessidades?: string | null
  consentimentoPcd: boolean
  pcdIdentificacao?: string | null
  pcdTipo?: string | null
  pcdComprovacao?: string | null
  pcdObservacoes?: string | null
}
type PortalAgendaBlock = { id: string; tipo?: string | null; titulo?: string | null; data?: string | null; horario?: string | null; observacoes?: string | null; updatedAtUtc: string }
type PortalAgenda = {
  preferences: {
    formatoEntrevista?: string | null
    inicioDisponivel?: string | null
    avisoPrevio?: string | null
    observacoes?: string | null
    diaSeg: boolean
    diaTer: boolean
    diaQua: boolean
    diaQui: boolean
    diaSex: boolean
    diaSab: boolean
    diaDom: boolean
    periodoManha: boolean
    periodoTarde: boolean
    periodoNoite: boolean
    horarioPreferido?: string | null
    fusoHorario?: string | null
  }
  blocks: PortalAgendaBlock[]
}
type PortalNotifications = {
  canalEmail: boolean
  canalWhatsapp: boolean
  canalSms: boolean
  canalPush: boolean
  frequencia?: string | null
  idioma?: string | null
  email?: string | null
  telefone?: string | null
  permiteContato: boolean
  alertaNovasVagas: boolean
  alertaAtualizacoes: boolean
  alertaEntrevistas: boolean
  alertaMensagens: boolean
  alertaDocumentos: boolean
  alertaLembretes: boolean
  silencioAtivo?: string | null
  silencioInicio?: string | null
  silencioFim?: string | null
  silencioPrioridade?: string | null
  assinatura?: string | null
}
type PortalDocument = { id: string; tipo: string; nome: string; link?: string | null; data?: string | null; observacoes?: string | null; fileName?: string | null; createdAtUtc: string }
type PortalReference = { id: string; nome: string; relacao?: string | null; empresa?: string | null; cargo?: string | null; contato?: string | null; periodo?: string | null; linkedin?: string | null; observacoes?: string | null; podeContatar: boolean; updatedAtUtc: string }
type PortalLgpd = {
  processarCandidatura: boolean
  permitirContato: boolean
  bancoTalentos: boolean
  retencaoMeses?: number | null
  compartilhamento?: string | null
  dadosSensiveis: boolean
  comunicacoes: boolean
  consentidoEmUtc?: string | null
  revogadoEmUtc?: string | null
}
type PortalJob = {
  id: string
  titulo: string
  area?: string | null
  modalidade?: string | null
  tipoContratacao?: string | null
  senioridade?: string | null
  cidade?: string | null
  uf?: string | null
  tagsKeywordsRaw?: string | null
  tagsStackRaw?: string | null
  tagsResponsabilidadesRaw?: string | null
  salarioMinimo?: number | null
  salarioMaximo?: number | null
  createdAtUtc: string
  tenantName?: string | null
}

type WorkspaceState = {
  profile: PortalProfile | null
  completion: PortalCompletion | null
  matches: PortalMatchItem[]
  portfolio: PortalPortfolio | null
  education: PortalEducation | null
  experience: PortalExperienceProject | null
  preferences: PortalPreferences | null
  accessibility: PortalAccessibility | null
  agenda: PortalAgenda | null
  notifications: PortalNotifications | null
  documents: PortalDocument[]
  references: PortalReference[]
  lgpd: PortalLgpd | null
}

type AccessLanguage = 'pt-BR' | 'en-US' | 'es-ES'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'https://localhost:7073'
const DEFAULT_TENANT = (import.meta.env.VITE_DEFAULT_TENANT as string | undefined) ?? 'liotecnica'
const TENANT_QUERY_KEY = 'tenantId'
const ACCESS_LANGUAGE_STORAGE_KEY = 'portal-vagas-lang'
const DEV_PROXY_BASE_URL = ''
let resolvedApiBaseUrl: string | null = null

const ACCESS_TRANSLATIONS: Record<AccessLanguage, Record<string, string>> = {
  'pt-BR': {
    helpLink: 'Precisa de ajuda?',
    title: 'Acesse sua conta',
    subtitle: 'Faça o seu login ou crie a sua conta. É simples e rápido.',
    tenant: 'Tenant',
    email: 'E-mail',
    password: 'Senha',
    loginButton: 'Entrar no portal',
    processing: 'Processando...',
    createHint: 'Ainda não possui acesso?',
    createAccess: 'Criar acesso',
    languageLabel: 'Idioma do perfil',
    helpTitle: 'Como funciona o processo',
    helpSubtitle: 'Etapas para acompanhar sua candidatura.',
    helpStep1: 'Cadastro rápido e perfil único.',
    helpStep2: 'Triagem e retorno em até 5 dias.',
    helpStep3: 'Entrevista com gestor.',
    helpStep4: 'Proposta e onboarding.',
    close: 'Fechar',
    registerTitle: 'Criar acesso',
    registerSubtitle: 'Preencha os dados básicos para entrar no portal.',
    fullName: 'Nome completo',
    phone: 'Telefone',
    city: 'Cidade',
    uf: 'UF',
    confirmPassword: 'Confirmar senha',
    cancel: 'Cancelar',
  },
  'en-US': {
    helpLink: 'Need help?',
    title: 'Access your account',
    subtitle: 'Log in or create your account. It is simple and fast.',
    tenant: 'Tenant',
    email: 'Email',
    password: 'Password',
    loginButton: 'Enter the portal',
    processing: 'Processing...',
    createHint: 'Do not have access yet?',
    createAccess: 'Create access',
    languageLabel: 'Profile language',
    helpTitle: 'How the process works',
    helpSubtitle: 'Steps to follow your application.',
    helpStep1: 'Quick signup and a single profile.',
    helpStep2: 'Screening and response within 5 days.',
    helpStep3: 'Interview with the manager.',
    helpStep4: 'Offer and onboarding.',
    close: 'Close',
    registerTitle: 'Create access',
    registerSubtitle: 'Fill in the basic data to enter the portal.',
    fullName: 'Full name',
    phone: 'Phone',
    city: 'City',
    uf: 'State',
    confirmPassword: 'Confirm password',
    cancel: 'Cancel',
  },
  'es-ES': {
    helpLink: '¿Necesitas ayuda?',
    title: 'Accede a tu cuenta',
    subtitle: 'Inicia sesión o crea tu cuenta. Es simple y rápido.',
    tenant: 'Tenant',
    email: 'Correo',
    password: 'Contraseña',
    loginButton: 'Entrar al portal',
    processing: 'Procesando...',
    createHint: '¿Aún no tienes acceso?',
    createAccess: 'Crear acceso',
    languageLabel: 'Idioma del perfil',
    helpTitle: 'Cómo funciona el proceso',
    helpSubtitle: 'Pasos para seguir tu candidatura.',
    helpStep1: 'Registro rápido y perfil único.',
    helpStep2: 'Filtrado y respuesta en hasta 5 días.',
    helpStep3: 'Entrevista con el responsable.',
    helpStep4: 'Oferta e incorporación.',
    close: 'Cerrar',
    registerTitle: 'Crear acceso',
    registerSubtitle: 'Completa los datos básicos para entrar al portal.',
    fullName: 'Nombre completo',
    phone: 'Teléfono',
    city: 'Ciudad',
    uf: 'Estado',
    confirmPassword: 'Confirmar contraseña',
    cancel: 'Cancelar',
  },
}

function App() {
  return (
    <BrowserRouter>
      <PortalApp />
    </BrowserRouter>
  )
}

function PortalApp() {
  const location = useLocation()
  const isAccessRoute = location.pathname === '/acesso'
  const tenantId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return (params.get(TENANT_QUERY_KEY) ?? DEFAULT_TENANT).trim().toLowerCase()
  }, [location.search])
  const storageKey = `portal-vagas-react-session:${tenantId}`
  const [session, setSession] = useState<AuthSession | null>(() => loadStoredSession(storageKey))
  const [initializing, setInitializing] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  useEffect(() => {
    setSession(loadStoredSession(storageKey))
  }, [storageKey])
  useEffect(() => {
    if (!session) {
      setInitializing(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const refreshed = await ensureSession(session, tenantId)
        if (cancelled) return
        persistSession(storageKey, refreshed)
        setSession(refreshed)
      } catch {
        if (cancelled) return
        clearSession(storageKey)
        setSession(null)
      } finally {
        if (!cancelled) setInitializing(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session, storageKey, tenantId])
  const authContext = useMemo(() => ({
    tenantId,
    session,
    setSession: (next: AuthSession | null) => {
      if (next) {
        persistSession(storageKey, next)
      } else {
        clearSession(storageKey)
      }
      setSession(next)
    },
    notifyAuthError: setAuthError,
  }), [session, storageKey, tenantId])
  useEffect(() => {
    if (!authError) return
    const timeout = window.setTimeout(() => setAuthError(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [authError])
  useEffect(() => {
    setUserMenuOpen(false)
  }, [location.pathname, location.search])
  const initials = session ? getInitials(session.candidate.nome) : 'LT'
  return (
    <div className={`portal-root${isAccessRoute ? ' access-route' : ''}`}>
      {!isAccessRoute ? (
        <div className="header-wrapper">
          <nav className="portal-navbar">
            <div className="portal-container portal-nav-inner">
              <Link className="portal-brand" to={withTenant('/', tenantId)}>
                <i className="fas fa-flask" aria-hidden="true"></i>
                <span>LT Portal de Vagas</span>
              </Link>
              <div className="portal-actions">
                {session ? (
                  <div className="portal-user-menu">
                    <Link className="portal-action-link" to={withTenant('/candidato', tenantId)}>Meu espaço</Link>
                    <button
                      className="portal-user-btn"
                      type="button"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                      onClick={() => setUserMenuOpen((value) => !value)}
                    >
                      <span className="portal-user-avatar">{initials}</span>
                      <span className="portal-user-copy">
                        <span className="portal-user-name">{session.candidate.nome}</span>
                        <span className="portal-user-email">{session.candidate.email}</span>
                      </span>
                      <i className="fas fa-chevron-down portal-user-chevron" aria-hidden="true"></i>
                    </button>
                    {userMenuOpen ? (
                      <div className="portal-user-dropdown" role="menu">
                        <button
                          className="portal-user-dropdown-item"
                          type="button"
                          onClick={() => {
                            setProfileModalOpen(true)
                            setUserMenuOpen(false)
                          }}
                        >
                          Ver perfil
                        </button>
                        <div className="portal-user-dropdown-divider" />
                        <button
                          className="portal-user-dropdown-item danger"
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false)
                            void signOutPortalSession(authContext)
                          }}
                        >
                          Sair
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link className="portal-login-pill" to={withTenant('/acesso', tenantId)}>
                    Entrar no portal
                  </Link>
                )}
              </div>
            </div>
          </nav>
        </div>
      ) : null}
      {authError ? <div className="toast-banner error">{authError}</div> : null}
      <Routes>
        <Route path="/acesso" element={<AccessPage ctx={authContext} />} />
        <Route path="/" element={<JobsPage ctx={authContext} />} />
        <Route
          path="/candidato"
          element={
            initializing ? (
              <PageLoading label="Preparando seu workspace..." />
            ) : session ? (
              <CandidateWorkspace ctx={authContext} />
            ) : (
              <Navigate to={withTenant('/acesso', tenantId)} replace />
            )
          }
        />
      </Routes>
      {session && profileModalOpen ? (
        <CandidateProfileModal ctx={authContext} onClose={() => setProfileModalOpen(false)} />
      ) : null}
    </div>
  )
}

function AccessPage({ ctx }: { ctx: AuthContext }) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [registerPending, setRegisterPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [language, setLanguage] = useState<AccessLanguage>(() => {
    if (typeof window === 'undefined') return 'pt-BR'
    const stored = window.localStorage.getItem(ACCESS_LANGUAGE_STORAGE_KEY)
    return stored === 'en-US' || stored === 'es-ES' || stored === 'pt-BR' ? stored : 'pt-BR'
  })
  const [login, setLogin] = useState({ email: '', password: '' })
  const [register, setRegister] = useState({
    nome: '',
    email: '',
    fone: '',
    cidade: '',
    uf: '',
    password: '',
    confirmPassword: '',
  })
  const text = ACCESS_TRANSLATIONS[language]

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ACCESS_LANGUAGE_STORAGE_KEY, language)
  }, [language])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    try {
      const session = await portalRequest<AuthSession>(ctx.tenantId, '/api/public/portal-auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: login.email.trim(),
          password: login.password,
        }),
      })
      ctx.setSession(session)
      navigate(withTenant('/', ctx.tenantId))
    } catch (err) {
      setError(readError(err))
    } finally {
      setPending(false)
    }
  }

  async function onRegisterSubmit(event: FormEvent) {
    event.preventDefault()
    setRegisterPending(true)
    setRegisterError(null)

    try {
      if (register.password !== register.confirmPassword) {
        throw new Error('As senhas não conferem.')
      }

      const session = await portalRequest<AuthSession>(ctx.tenantId, '/api/public/portal-auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nome: register.nome.trim(),
          email: register.email.trim(),
          fone: register.fone.trim(),
          cidade: register.cidade.trim(),
          uf: register.uf.trim().toUpperCase(),
          password: register.password,
        }),
      })

      ctx.setSession(session)
      setShowRegisterModal(false)
      navigate(withTenant('/', ctx.tenantId))
    } catch (err) {
      setRegisterError(readError(err))
    } finally {
      setRegisterPending(false)
    }
  }

  return (
    <main className="auth-page-shell">
      <header className="auth-page-header">
        <div className="auth-page-container auth-page-header-inner">
          <div className="auth-page-brand-spacer" aria-hidden="true"></div>
          <button className="auth-page-help" type="button" onClick={() => setShowHelpModal(true)}>
            {text.helpLink}
          </button>
        </div>
      </header>

      <section className="auth-page-body">
        <div className="auth-page-container auth-page-grid">
          <form className="auth-card auth-card-main" onSubmit={onSubmit}>
            <div className="auth-title">
              <img className="auth-logo-img" src="/images/logo-liotecnica.png" alt="Liotecnica" />
              <h1>{text.title}</h1>
              <h2>{text.subtitle}</h2>
            </div>

            <label className="auth-field">
              <span>{text.tenant}</span>
              <input value={ctx.tenantId} readOnly />
            </label>

            <label className="auth-field">
              <span>{text.email}</span>
              <input type="email" value={login.email} onChange={(e) => setLogin((v) => ({ ...v, email: e.target.value }))} required />
            </label>
            <label className="auth-field">
              <span>{text.password}</span>
              <input type="password" value={login.password} onChange={(e) => setLogin((v) => ({ ...v, password: e.target.value }))} required />
            </label>

            {error ? <div className="inline-alert error auth-inline-alert">{error}</div> : null}

            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? text.processing : text.loginButton}
            </button>

            <div className="auth-links">
              <span className="auth-note">{text.createHint}</span>
              <button className="auth-secondary-btn" type="button" onClick={() => setShowRegisterModal(true)}>
                {text.createAccess}
              </button>
            </div>
          </form>
        </div>
      </section>

      <footer className="auth-language-footer">
        <div className="auth-page-container auth-language-inner">
          <span className="auth-language-label">{text.languageLabel}</span>
          <div className="language-flags auth-language-flags">
            <button type="button" className={`auth-flag-btn${language === 'pt-BR' ? ' is-active' : ''}`} onClick={() => setLanguage('pt-BR')} title="Português">
              <img src="/images/flags/flag-br.svg" alt="Português" />
            </button>
            <button type="button" className={`auth-flag-btn${language === 'en-US' ? ' is-active' : ''}`} onClick={() => setLanguage('en-US')} title="English">
              <img src="/images/flags/flag-us.svg" alt="English" />
            </button>
            <button type="button" className={`auth-flag-btn${language === 'es-ES' ? ' is-active' : ''}`} onClick={() => setLanguage('es-ES')} title="Español">
              <img src="/images/flags/flag-es.svg" alt="Español" />
            </button>
          </div>
        </div>
      </footer>

      {showHelpModal ? (
        <div className="auth-modal-backdrop" onClick={() => setShowHelpModal(false)}>
          <div className="auth-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-help-modal-header">
              <div>
                <h2>{text.helpTitle}</h2>
                <div className="auth-help-modal-subtitle">{text.helpSubtitle}</div>
              </div>
              <button type="button" className="auth-modal-close" onClick={() => setShowHelpModal(false)} aria-label="Fechar">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
            <div className="auth-help-timeline">
              <div className="auth-help-step"><span className="auth-help-dot"></span><span>{text.helpStep1}</span></div>
              <div className="auth-help-step"><span className="auth-help-dot"></span><span>{text.helpStep2}</span></div>
              <div className="auth-help-step"><span className="auth-help-dot"></span><span>{text.helpStep3}</span></div>
              <div className="auth-help-step"><span className="auth-help-dot"></span><span>{text.helpStep4}</span></div>
            </div>
            <div className="auth-help-modal-footer">
              <button className="auth-submit auth-modal-primary auth-submit-inline" type="button" onClick={() => setShowHelpModal(false)}>
                {text.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showRegisterModal ? (
        <div className="auth-modal-backdrop">
          <div className="auth-help-modal auth-register-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-help-modal-header">
              <div>
                <h2>{text.registerTitle}</h2>
                <div className="auth-help-modal-subtitle">{text.registerSubtitle}</div>
              </div>
              <button type="button" className="auth-modal-close" onClick={() => setShowRegisterModal(false)} aria-label="Fechar">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            <form className="auth-register-form" onSubmit={onRegisterSubmit}>
              <label className="auth-field">
                <span>{text.fullName}</span>
                <input value={register.nome} onChange={(e) => setRegister((v) => ({ ...v, nome: e.target.value }))} required />
              </label>
              <label className="auth-field">
                <span>{text.email}</span>
                <input type="email" value={register.email} onChange={(e) => setRegister((v) => ({ ...v, email: e.target.value }))} required />
              </label>
              <div className="grid two">
                <label className="auth-field">
                  <span>{text.phone}</span>
                  <input value={register.fone} onChange={(e) => setRegister((v) => ({ ...v, fone: e.target.value }))} required />
                </label>
                <label className="auth-field">
                  <span>{text.uf}</span>
                  <input maxLength={2} value={register.uf} onChange={(e) => setRegister((v) => ({ ...v, uf: e.target.value }))} required />
                </label>
              </div>
              <label className="auth-field">
                <span>{text.city}</span>
                <input value={register.cidade} onChange={(e) => setRegister((v) => ({ ...v, cidade: e.target.value }))} required />
              </label>
              <div className="grid two">
                <label className="auth-field">
                  <span>{text.password}</span>
                  <input type="password" value={register.password} onChange={(e) => setRegister((v) => ({ ...v, password: e.target.value }))} required />
                </label>
                <label className="auth-field">
                  <span>{text.confirmPassword}</span>
                  <input type="password" value={register.confirmPassword} onChange={(e) => setRegister((v) => ({ ...v, confirmPassword: e.target.value }))} required />
                </label>
              </div>

              {registerError ? <div className="inline-alert error auth-inline-alert">{registerError}</div> : null}

              <div className="auth-help-modal-footer auth-register-footer">
                <button className="auth-secondary-btn auth-modal-cancel" type="button" onClick={() => setShowRegisterModal(false)}>
                  {text.cancel}
                </button>
                <button className="auth-submit auth-modal-primary auth-submit-inline" type="submit" disabled={registerPending}>
                  {registerPending ? text.processing : text.createAccess}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  )
}

function JobsPage({ ctx }: { ctx: AuthContext }) {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('Carregando vagas...')
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<PortalJob[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ q: '', location: '', mode: '', type: '', level: '', area: '', sort: 'recent' })
  const [selectedJob, setSelectedJob] = useState<PortalJob | null>(null)
  const [applyPending, setApplyPending] = useState(false)
  const [applyResult, setApplyResult] = useState<string | null>(null)
  const [applyData, setApplyData] = useState({
    nome: ctx.session?.candidate.nome ?? '',
    email: ctx.session?.candidate.email ?? '',
    fone: '',
    cidadeUf: '',
    linkedin: '',
    portfolio: '',
    cargoAtual: '',
    anosExperiencia: '',
    observacoes: '',
    arquivo: null as File | null,
  })
  async function loadJobs(activeFilters = filters) {
    setLoading(true)
    setError(null)
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        setMessage(attempt === 1 ? 'Buscando oportunidades abertas...' : `API indisponível, tentando novamente (${attempt}/3)...`)
        const params = new URLSearchParams({
          tenantId: ctx.tenantId,
          page: '1',
          pageSize: '100',
          sort: activeFilters.sort,
        })
        for (const [key, value] of Object.entries(activeFilters)) {
          if (value && key !== 'sort') params.set(key, value)
        }
        const result = await fetchJson<{ items: PortalJob[] }>(`/api/public/vagas?${params.toString()}`)
        setJobs(result.items)
        setLoading(false)
        return
      } catch (err) {
        if (attempt < 3) {
          await sleep(1800 * attempt)
          continue
        }
        setError(readError(err) || 'Portal temporariamente indisponível. Tente novamente mais tarde.')
        setLoading(false)
        return
      }
    }
  }
  useEffect(() => {
    void loadJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const groupedJobs = useMemo(() => groupJobsByArea(jobs), [jobs])
  function clearFilters() {
    const next = { q: '', location: '', mode: '', type: '', level: '', area: '', sort: 'recent' }
    setFilters(next)
    void loadJobs(next)
  }
  async function submitApplication(event: FormEvent) {
    event.preventDefault()
    if (!selectedJob) return
    setApplyPending(true)
    setApplyResult(null)
    try {
      const form = new FormData()
      form.append('vagaId', selectedJob.id)
      form.append('nome', applyData.nome)
      form.append('email', applyData.email)
      form.append('fone', applyData.fone)
      form.append('cidadeUf', applyData.cidadeUf)
      form.append('linkedin', applyData.linkedin)
      form.append('portfolio', applyData.portfolio)
      form.append('cargoAtual', applyData.cargoAtual)
      form.append('anosExperiencia', applyData.anosExperiencia)
      form.append('observacoes', applyData.observacoes)
      if (applyData.arquivo) {
        form.append('arquivo', applyData.arquivo)
      }
      await fetch(await buildApiUrl('/api/public/candidaturas', ctx.tenantId), {
        method: 'POST',
        headers: {
          'X-Tenant-Id': ctx.tenantId,
        },
        body: form,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiMessage(response))
        }
      })
      setApplyResult('Candidatura enviada com sucesso.')
      setSelectedJob(null)
    } catch (err) {
      setApplyResult(readError(err))
    } finally {
      setApplyPending(false)
    }
  }
  return (
    <>
      <section className="main-header">
        <div className="portal-container">
          <h1 className="display-hero">Transforme o Futuro da Alimentação</h1>
          <p className="lead-copy">Ambiente inovador, tecnologia de ponta e paixão por qualidade.</p>
        </div>
      </section>
      <div className="portal-container search-wrapper">
        <div className="search-box">
          <i className="fas fa-search" aria-hidden="true"></i>
          <input
            name="q"
            type="search"
            placeholder="Buscar por cargo, empresa, tecnologia..."
            autoComplete="off"
            value={filters.q}
            onChange={(e) => setFilters((v) => ({ ...v, q: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void loadJobs()
              }
            }}
          />
          <button className="btn-search" type="button" onClick={() => void loadJobs()}>Buscar</button>
          <button className="btn-clear" type="button" onClick={clearFilters}>Limpar</button>
        </div>
      </div>
      <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <i className="fas fa-arrow-up" aria-hidden="true"></i>
        <span>Topo</span>
      </button>
      <button className="filters-fab" type="button" onClick={() => setShowFilters((v) => !v)}>
        <i className="fas fa-sliders-h" aria-hidden="true"></i>
        <span>Filtros</span>
      </button>
      <main className="portal-container portal-main">
        <div className="results-toolbar">
          <div className="results-count">
            <span>{jobs.length}</span> vagas encontradas
          </div>
          <div className="results-actions">
            <button className="toolbar-btn toolbar-btn-primary" type="button" onClick={() => setShowFilters((v) => !v)}>
              Ajustar filtros
            </button>
            <select className="toolbar-select" value={filters.sort} onChange={(e) => setFilters((v) => ({ ...v, sort: e.target.value }))}>
              <option value="recent">Mais recentes</option>
              <option value="salaryDesc">Faixa salarial (maior primeiro)</option>
              <option value="companyAsc">Empresa (A-Z)</option>
            </select>
          </div>
        </div>
        {showFilters ? (
          <section className="react-filters-panel">
            <div className="react-filters-grid">
              <input placeholder="Cidade ou UF" value={filters.location} onChange={(e) => setFilters((v) => ({ ...v, location: e.target.value }))} />
              <input placeholder="Modalidade" value={filters.mode} onChange={(e) => setFilters((v) => ({ ...v, mode: e.target.value }))} />
              <input placeholder="Contrato" value={filters.type} onChange={(e) => setFilters((v) => ({ ...v, type: e.target.value }))} />
              <input placeholder="Senioridade" value={filters.level} onChange={(e) => setFilters((v) => ({ ...v, level: e.target.value }))} />
              <input placeholder="Área" value={filters.area} onChange={(e) => setFilters((v) => ({ ...v, area: e.target.value }))} />
            </div>
            <div className="react-filters-actions">
              <button className="toolbar-btn toolbar-btn-primary" type="button" onClick={() => void loadJobs()}>Aplicar filtros</button>
              <button className="toolbar-btn" type="button" onClick={clearFilters}>Limpar filtros</button>
            </div>
          </section>
        ) : null}
        {loading ? (
          <section className="jobs-loading-state">
            <div className="loader-ring" aria-hidden="true"></div>
            <p>{message}</p>
          </section>
        ) : null}
        {!loading && error ? (
          <section className="empty-state service-unavailable-state">
            <div className="service-unavailable-icon" aria-hidden="true">
              <i className="fas fa-cloud-slash"></i>
            </div>
            <h3>Portal temporariamente indisponível</h3>
            <p>{error}</p>
            <button className="toolbar-btn toolbar-btn-primary" type="button" onClick={() => void loadJobs()}>Tentar novamente</button>
          </section>
        ) : null}
        {!loading && !error && jobs.length === 0 ? (
          <section className="empty-state">
            <h3>Nenhuma vaga encontrada</h3>
            <p>Tente remover alguns filtros ou refinar o texto de busca.</p>
            <button className="toolbar-btn" type="button" onClick={clearFilters}>Limpar filtros</button>
          </section>
        ) : null}
        {!loading && !error ? (
          <section className="jobs-sections">
            {groupedJobs.map((group, groupIndex) => (
              <section className="job-section" key={group.title}>
                <div className="job-section-hero" style={{ backgroundImage: `url('${group.image}')` }}>
                  <div className="job-section-title">
                    <span>{group.title}</span>
                  </div>
                  <span className="job-section-count">{group.jobs.length} vagas</span>
                </div>
                <div className="job-grid">
                  {group.jobs.map((job, jobIndex) => {
                    const tags = buildJobTags(job)
                    const badges = buildJobBadgeValues(job)
                    return (
                      <article
                        className="job-card-react"
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedJob(job)
                          }
                        }}
                      >
                        <div className="job-hero" style={{ backgroundImage: getJobHeroBackground(groupIndex + jobIndex) }}>
                          <h3 className="job-title-on-hero">{job.titulo}</h3>
                          <div className="job-badge-row">
                            {badges.map((badge) => (
                              <span className="job-pill-badge" key={badge}>{badge}</span>
                            ))}
                          </div>
                        </div>
                        <div className="job-card-body">
                          <div className="job-company">{job.tenantName || 'Liotecnica'}</div>
                          <div className="job-meta">
                            <span>{formatJobLocation(job)}</span>
                            <span className="dot" aria-hidden="true"></span>
                            <span>{job.area || 'Área em definição'}</span>
                          </div>
                          <div className="job-tags-row">
                            {(tags.length ? tags : ['Perfil geral']).slice(0, 6).map((tag) => (
                              <span className="job-tag" key={tag}>{tag}</span>
                            ))}
                          </div>
                          <div className="job-salary-line">{formatSalary(job.salarioMinimo, job.salarioMaximo)}</div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </section>
        ) : null}
        {selectedJob ? (
          <div className="modal-backdrop" onClick={() => setSelectedJob(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="eyebrow">Candidatura rápida</div>
                  <h3>{selectedJob.titulo}</h3>
                </div>
                <button className="ghost-btn" type="button" onClick={() => setSelectedJob(null)}>Fechar</button>
              </div>
              <form className="stack-form" onSubmit={submitApplication}>
                <div className="grid two">
                  <label><span>Nome</span><input value={applyData.nome} onChange={(e) => setApplyData((v) => ({ ...v, nome: e.target.value }))} required /></label>
                  <label><span>E-mail</span><input type="email" value={applyData.email} onChange={(e) => setApplyData((v) => ({ ...v, email: e.target.value }))} required /></label>
                </div>
                <div className="grid two">
                  <label><span>Telefone</span><input value={applyData.fone} onChange={(e) => setApplyData((v) => ({ ...v, fone: e.target.value }))} /></label>
                  <label><span>Cidade / UF</span><input value={applyData.cidadeUf} onChange={(e) => setApplyData((v) => ({ ...v, cidadeUf: e.target.value }))} /></label>
                </div>
                <div className="grid two">
                  <label><span>LinkedIn</span><input value={applyData.linkedin} onChange={(e) => setApplyData((v) => ({ ...v, linkedin: e.target.value }))} /></label>
                  <label><span>Portfólio</span><input value={applyData.portfolio} onChange={(e) => setApplyData((v) => ({ ...v, portfolio: e.target.value }))} /></label>
                </div>
                <div className="grid two">
                  <label><span>Cargo atual</span><input value={applyData.cargoAtual} onChange={(e) => setApplyData((v) => ({ ...v, cargoAtual: e.target.value }))} /></label>
                  <label><span>Anos de experiência</span><input value={applyData.anosExperiencia} onChange={(e) => setApplyData((v) => ({ ...v, anosExperiencia: e.target.value }))} /></label>
                </div>
                <label><span>Observações</span><textarea rows={4} value={applyData.observacoes} onChange={(e) => setApplyData((v) => ({ ...v, observacoes: e.target.value }))} /></label>
                <label>
                  <span>Currículo (PDF, DOC ou DOCX)</span>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setApplyData((v) => ({ ...v, arquivo: e.target.files?.[0] ?? null }))} />
                </label>
                {applyResult ? <div className={`inline-alert ${applyResult.includes('sucesso') ? 'success' : 'error'}`}>{applyResult}</div> : null}
                <button className="primary-btn" type="submit" disabled={applyPending}>{applyPending ? 'Enviando...' : 'Enviar candidatura'}</button>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </>
  )
}

type CandidateProfileModalProps = {
  ctx: AuthContext
  onClose: () => void
}

function CandidateProfileModal({ ctx, onClose }: CandidateProfileModalProps) {
  const candidateId = ctx.session?.candidate.id ?? ''
  const authFetch = useMemo(() => createAuthorizedClient(ctx), [ctx])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<PortalProfile | null>(null)
  const [completion, setCompletion] = useState<PortalCompletion | null>(null)
  const [matchesCount, setMatchesCount] = useState(0)
  const [documentsCount, setDocumentsCount] = useState(0)
  const [referencesCount, setReferencesCount] = useState(0)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    fone: '',
    cidade: '',
    uf: '',
  })

  useEffect(() => {
    if (!candidateId) return
    let cancelled = false

    void (async () => {
      setLoading(true)
      setMessage(null)
      try {
        const [profileData, completionData, matchesData, documentsData, referencesData] = await Promise.all([
          authFetch<PortalProfile>(`/api/public/portal-candidates/${candidateId}`),
          authFetch<PortalCompletion>(`/api/public/portal-candidates/${candidateId}/profile-completion`),
          authFetch<{ matches: PortalMatchItem[] }>(`/api/public/portal-candidates/${candidateId}/job-matches`),
          authFetch<{ items: PortalDocument[] }>(`/api/public/portal-candidates/${candidateId}/documents`),
          authFetch<{ items: PortalReference[] }>(`/api/public/portal-candidates/${candidateId}/references`),
        ])

        if (cancelled) return

        setProfile(profileData)
        setCompletion(completionData)
        setMatchesCount(matchesData.matches?.length ?? 0)
        setDocumentsCount(documentsData.items?.length ?? 0)
        setReferencesCount(referencesData.items?.length ?? 0)
        setForm({
          nome: profileData.nome ?? '',
          email: profileData.email ?? '',
          fone: profileData.fone ?? '',
          cidade: profileData.cidade ?? '',
          uf: profileData.uf ?? '',
        })
      } catch (err) {
        if (!cancelled) setMessage(readError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authFetch, candidateId])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const result = await authFetch<PortalProfile>(`/api/public/portal-candidates/${candidateId}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: form.nome.trim(),
          fone: form.fone.trim(),
          cidade: form.cidade.trim(),
          uf: form.uf.trim().toUpperCase(),
          linkedinUrl: profile?.linkedinUrl ?? null,
          resumoProfissional: profile?.resumoProfissional ?? null,
        }),
      })
      setProfile(result)
      setForm((current) => ({
        ...current,
        nome: result.nome ?? current.nome,
        email: result.email ?? current.email,
        fone: result.fone ?? '',
        cidade: result.cidade ?? '',
        uf: result.uf ?? '',
      }))
      setMessage('Perfil atualizado com sucesso.')
    } catch (err) {
      setMessage(readError(err))
    } finally {
      setSaving(false)
    }
  }

  const sectionTiles = [
    { key: 'perfil', label: 'Perfil', icon: 'fa-user', value: completion?.sections?.perfil ?? completion?.overall ?? 0, kind: 'percent' as const },
    { key: 'testes', label: 'Testes', icon: 'fa-clipboard-check', value: completion?.sections?.testes ?? 0, kind: 'percent' as const },
    { key: 'comp', label: 'Competências & Portfólio', icon: 'fa-bolt', value: completion?.sections?.comp ?? 0, kind: 'percent' as const },
    { key: 'formacao', label: 'Formação & Educação', icon: 'fa-graduation-cap', value: completion?.sections?.formacao ?? 0, kind: 'percent' as const },
    { key: 'exp', label: 'Experiência & Projetos', icon: 'fa-briefcase', value: completion?.sections?.exp ?? 0, kind: 'percent' as const },
    { key: 'lgpd', label: 'Privacidade (LGPD)', icon: 'fa-shield-alt', value: completion?.sections?.lgpd ?? 0, kind: 'percent' as const },
    { key: 'pref', label: 'Preferências / Objetivos', icon: 'fa-bullseye', value: completion?.sections?.pref ?? 0, kind: 'percent' as const },
    { key: 'docs', label: 'Documentos & Anexos', icon: 'fa-paperclip', value: documentsCount, kind: 'count' as const },
    { key: 'refs', label: 'Referências', icon: 'fa-users', value: referencesCount, kind: 'count' as const },
    { key: 'acess', label: 'Acessibilidade & Inclusão', icon: 'fa-universal-access', value: completion?.sections?.acess ?? 0, kind: 'percent' as const },
    { key: 'agenda', label: 'Disponibilidade & Agenda', icon: 'fa-calendar-alt', value: completion?.sections?.agenda ?? 0, kind: 'percent' as const },
    { key: 'hist', label: 'Histórico de Candidaturas', icon: 'fa-history', value: completion?.sections?.hist ?? 0, kind: 'percent' as const },
    { key: 'notif', label: 'Notificações & Comunicação', icon: 'fa-bell', value: completion?.sections?.notif ?? 0, kind: 'percent' as const },
    { key: 'matches', label: 'Vagas sugeridas', icon: 'fa-star', value: matchesCount, kind: 'count' as const },
  ]

  return (
    <div className="modal-backdrop profile-modal-backdrop">
      <div className="profile-modal-card" onClick={(event) => event.stopPropagation()}>
        <form onSubmit={handleSave}>
          <div className="profile-modal-header">
            <div>
              <h2 className="profile-modal-title">Meu perfil</h2>
              <div className="profile-modal-subtitle">Atualize seus dados básicos e acompanhe o preenchimento das seções.</div>
            </div>
            <div className="profile-modal-header-actions">
              <button className="profile-modal-action secondary" type="button" onClick={() => void openResumeHtml(authFetch, candidateId)}>
                <i className="fas fa-eye" aria-hidden="true"></i>
                <span>Visualizar curriculo</span>
              </button>
              <button className="profile-modal-action primary" type="button" onClick={() => void downloadResumePdf(authFetch, candidateId)}>
                <i className="fas fa-file-pdf" aria-hidden="true"></i>
                <span>Baixar curriculo</span>
              </button>
              <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Fechar">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div className="profile-modal-body">
            {loading ? (
              <PageLoading label="Sincronizando seu perfil e suas preferências..." />
            ) : (
              <div className="profile-modal-grid">
                <section className="profile-left-panel">
                  <div className="profile-panel-title">Dados do candidato</div>

                  <label className="auth-field">
                    <span>Nome completo</span>
                    <input value={form.nome} onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))} required />
                  </label>

                  <label className="auth-field">
                    <span>E-mail</span>
                    <input value={form.email} readOnly />
                  </label>

                  <div className="profile-modal-two-columns">
                    <label className="auth-field">
                      <span>Telefone</span>
                      <input value={form.fone} onChange={(e) => setForm((current) => ({ ...current, fone: e.target.value }))} required />
                    </label>
                    <label className="auth-field">
                      <span>UF</span>
                      <input value={form.uf} onChange={(e) => setForm((current) => ({ ...current, uf: e.target.value }))} maxLength={2} required />
                    </label>
                  </div>

                  <label className="auth-field">
                    <span>Cidade</span>
                    <input value={form.cidade} onChange={(e) => setForm((current) => ({ ...current, cidade: e.target.value }))} required />
                  </label>

                  <div className="profile-panel-note">
                    <i className="fas fa-shield-alt" aria-hidden="true"></i>
                    <span>Seus dados são tratados de acordo com a LGPD.</span>
                  </div>
                </section>

                <section className="profile-right-panel">
                  <div className="profile-sections-grid">
                    {sectionTiles.map((tile) => (
                      <article className="profile-section-tile" key={tile.key}>
                        <div className="profile-section-badge">
                          {tile.kind === 'percent' ? `${tile.value}%` : tile.value}
                        </div>
                        <div className="profile-section-icon">
                          <i className={`fas ${tile.icon}`} aria-hidden="true"></i>
                        </div>
                        <div className="profile-section-label">{tile.label}</div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            )}
            {message ? <div className={`inline-alert ${message.includes('sucesso') ? 'success' : 'error'}`}>{message}</div> : null}
          </div>

          <div className="profile-modal-footer">
            <button className="profile-modal-footer-btn secondary" type="button" onClick={onClose}>Cancelar</button>
            <button className="profile-modal-footer-btn primary" type="submit" disabled={saving || loading}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CandidateWorkspace({ ctx }: { ctx: AuthContext }) {
  const navigate = useNavigate()
  const candidateId = ctx.session?.candidate.id ?? ''
  const [state, setState] = useState<WorkspaceState>({
    profile: null,
    completion: null,
    matches: [],
    portfolio: null,
    education: null,
    experience: null,
    preferences: null,
    accessibility: null,
    agenda: null,
    notifications: null,
    documents: [],
    references: [],
    lgpd: null,
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [resumeParsePreview, setResumeParsePreview] = useState<string>('')
  const authFetch = useMemo(() => createAuthorizedClient(ctx), [ctx])

  async function refreshWorkspace() {
    if (!candidateId) return

    setLoading(true)
    setMessage(null)

    try {
      const [profile, completion, matches, portfolio, education, experience, preferences, accessibility, agenda, notifications, documents, references, lgpd] = await Promise.all([
        authFetch<PortalProfile>(`/api/public/portal-candidates/${candidateId}`),
        authFetch<PortalCompletion>(`/api/public/portal-candidates/${candidateId}/profile-completion`),
        authFetch<{ matches: PortalMatchItem[] }>(`/api/public/portal-candidates/${candidateId}/job-matches`),
        authFetch<PortalPortfolio>(`/api/public/portal-candidates/${candidateId}/skills-portfolio`),
        authFetch<PortalEducation>(`/api/public/portal-candidates/${candidateId}/education`),
        authFetch<PortalExperienceProject>(`/api/public/portal-candidates/${candidateId}/experience-projects`),
        authFetch<PortalPreferences>(`/api/public/portal-candidates/${candidateId}/preferences`),
        authFetch<PortalAccessibility>(`/api/public/portal-candidates/${candidateId}/accessibility`),
        authFetch<PortalAgenda>(`/api/public/portal-candidates/${candidateId}/agenda`),
        authFetch<PortalNotifications>(`/api/public/portal-candidates/${candidateId}/notifications`),
        authFetch<{ items: PortalDocument[] }>(`/api/public/portal-candidates/${candidateId}/documents`),
        authFetch<{ items: PortalReference[] }>(`/api/public/portal-candidates/${candidateId}/references`),
        authFetch<PortalLgpd>(`/api/public/portal-candidates/${candidateId}/lgpd`),
      ])

      setState({
        profile,
        completion,
        matches: matches.matches ?? [],
        portfolio,
        education,
        experience,
        preferences,
        accessibility,
        agenda,
        notifications,
        documents: documents.items ?? [],
        references: references.items ?? [],
        lgpd,
      })

      try {
        const url = await fetchAuthorizedBlobUrl(ctx, `/api/public/portal-candidates/${candidateId}/avatar`)
        setAvatarPreview(url)
      } catch {
        setAvatarPreview(null)
      }
    } catch (err) {
      setMessage(readError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId])

  async function saveJson(path: string, payload: unknown, successText: string, method: 'PUT' | 'POST' = 'PUT') {
    try {
      await authFetch(path, {
        method,
        body: JSON.stringify(payload),
      })
      setMessage(successText)
      await refreshWorkspace()
    } catch (err) {
      setMessage(readError(err))
    }
  }

  async function removeItem(path: string, successText: string) {
    try {
      await authFetch(path, { method: 'DELETE' })
      setMessage(successText)
      await refreshWorkspace()
    } catch (err) {
      setMessage(readError(err))
    }
  }

  async function uploadFile(path: string, fieldName: string, file: File, successText: string) {
    const form = new FormData()
    form.append(fieldName, file)
    try {
      await authFetch(path, {
        method: 'POST',
        body: form,
      }, false)
      setMessage(successText)
      await refreshWorkspace()
    } catch (err) {
      setMessage(readError(err))
    }
  }

  async function handleLogout() {
    await signOutPortalSession(ctx)
    navigate(withTenant('/acesso', ctx.tenantId))
  }

  if (loading) {
    return <PageLoading label="Sincronizando seu perfil e suas preferências..." />
  }

  if (message && !state.profile) {
    return (
      <main className="page-shell">
        <section className="state-card unavailable">
          <h3>Não foi possível carregar seu espaço</h3>
          <p>{message}</p>
          <button className="primary-btn" type="button" onClick={() => void refreshWorkspace()}>Tentar novamente</button>
        </section>
      </main>
    )
  }

  return (
    <main className="workspace-shell">
      <section className="workspace-hero">
        <div>
          <div className="eyebrow">Workspace do candidato</div>
          <h2>{state.profile?.nome || ctx.session?.candidate.nome}</h2>
          <p>{ctx.session?.candidate.email}  tenant {ctx.tenantId}</p>
        </div>
        <div className="workspace-actions">
          <button className="secondary-btn" type="button" onClick={() => void refreshWorkspace()}>Atualizar tudo</button>
          <button className="ghost-btn" type="button" onClick={handleLogout}>Sair</button>
        </div>
      </section>

      {message ? <div className="toast-banner">{message}</div> : null}

      <section className="summary-grid">
        <SummaryCard title="Conclusão do perfil" value={`${state.completion?.overall ?? 0}%`} detail="Score consolidado pelo serviço de completion" />
        <SummaryCard title="Job matches" value={String(state.matches.length)} detail="Oportunidades mais aderentes ao seu perfil" />
        <SummaryCard title="Documentos" value={String(state.documents.length)} detail="Arquivos auxiliares além do currículo" />
        <SummaryCard title="Referências" value={String(state.references.length)} detail="Pessoas que podem endossar sua trajetória" />
      </section>

      <div className="content-grid">
        <section className="content-column">
          <WorkspaceSection title="Perfil e currículo" description="Dados pessoais, foto, resumo e documentos principais.">
            <div className="profile-shell">
              <div className="avatar-plate">
                {avatarPreview ? <img src={avatarPreview} alt={state.profile?.nome || 'Avatar do candidato'} /> : <span>{getInitials(state.profile?.nome || ctx.session?.candidate.nome || 'Candidato')}</span>}
              </div>
              <label className="upload-label">
                Alterar avatar
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadFile(`/api/public/portal-candidates/${candidateId}/avatar`, 'arquivo', file, 'Avatar atualizado.')
                }} />
              </label>
            </div>

            <RecordForm
              fields={[
                field('Nome', state.profile?.nome),
                field('Telefone', state.profile?.fone),
                field('Cidade', state.profile?.cidade),
                field('UF', state.profile?.uf),
                field('LinkedIn', state.profile?.linkedinUrl),
                field('Resumo', state.profile?.resumoProfissional, 'textarea'),
              ]}
              onSubmit={(values) => saveJson(`/api/public/portal-candidates/${candidateId}`, {
                nome: values.Nome,
                fone: values.Telefone,
                cidade: values.Cidade,
                uf: values.UF,
                linkedinUrl: values.LinkedIn,
                resumoProfissional: values.Resumo,
              }, 'Perfil atualizado.')}
            />

            <div className="toolbar-row">
              <label className="upload-label">
                Enviar currículo
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadFile(`/api/public/portal-candidates/${candidateId}/curriculos`, 'arquivo', file, 'Currículo enviado.')
                }} />
              </label>
              <label className="upload-label">
                Parsear currículo
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const form = new FormData()
                  form.append('arquivo', file)
                  void authFetch<Record<string, unknown>>(`/api/public/portal-candidates/${candidateId}/parse-resume`, { method: 'POST', body: form }, false)
                    .then((result) => setResumeParsePreview(JSON.stringify(result, null, 2)))
                    .catch((err) => setMessage(readError(err)))
                }} />
              </label>
              <button className="secondary-btn" type="button" onClick={() => void openResumeHtml(authFetch, candidateId)}>Abrir currículo HTML</button>
              <button className="secondary-btn" type="button" onClick={() => void downloadResumePdf(authFetch, candidateId)}>Baixar PDF gerado</button>
            </div>

            {resumeParsePreview ? <pre className="json-preview">{resumeParsePreview}</pre> : null}
          </WorkspaceSection>

          <WorkspaceSection title="Conclusão e aderência" description="Diagnóstico automático do perfil e vagas com maior match.">
            <div className="completion-shell">
              {Object.entries(state.completion?.sections ?? {}).map(([key, value]) => (
                <div key={key} className="metric-row">
                  <span>{key}</span>
                  <strong>{value}%</strong>
                </div>
              ))}
            </div>
            {(state.completion?.suggestions ?? []).map((suggestion) => (
              <article key={`${suggestion.section}-${suggestion.text}`} className="inline-card">
                <strong>{suggestion.section}</strong>
                <p>{suggestion.text}</p>
                <span>{suggestion.impact}</span>
              </article>
            ))}
            <div className="matches-grid">
              {state.matches.map((match) => (
                <article key={match.vagaId} className="inline-card">
                  <strong>{match.title || 'Vaga sem título'}</strong>
                  <p>{match.area || 'Área não informada'} • {match.city || 'Cidade'} {match.uf || ''}</p>
                  <span>Score {match.score}% • {match.mode || 'Formato flexível'}</span>
                  {match.reason ? <small>{match.reason}</small> : null}
                </article>
              ))}
            </div>
          </WorkspaceSection>

          <WorkspaceSection title="Skills, links e certificações" description="Competências, preferências rápidas e links do portfólio.">
            <RecordForm
              fields={[
                field('WorkModel', state.portfolio?.preferences.workModel),
                field('Availability', state.portfolio?.preferences.availability),
                field('Salary', state.portfolio?.preferences.salary),
                field('Shift', state.portfolio?.preferences.shift),
                field('Note', state.portfolio?.preferences.note),
                field('Linkedin', state.portfolio?.links.linkedin),
                field('Github', state.portfolio?.links.github),
                field('Portfolio', state.portfolio?.links.portfolio),
                field('Drive', state.portfolio?.links.drive),
                field('Tags', state.portfolio?.tags),
              ]}
              onSubmit={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/skills-portfolio`, values, 'Preferências e links salvos.')}
            />

            <RepeaterSection
              title="Skills"
              items={state.portfolio?.skills ?? []}
              describe={(item) => `${item.tipo}  ${item.nivel}${item.evidencia ? `  ${item.evidencia}` : ''}`}
              onAdd={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/skills-portfolio/skills`, values, 'Skill adicionada.', 'POST')}
              onDelete={(item) => removeItem(`/api/public/portal-candidates/${candidateId}/skills-portfolio/skills/${item.id}`, 'Skill removida.')}
              fields={[
                { name: 'tipo', label: 'Tipo' },
                { name: 'nome', label: 'Nome' },
                { name: 'nivel', label: 'Nível' },
                { name: 'evidencia', label: 'Evidência' },
              ]}
            />

            <RepeaterSection
              title="Certificações"
              items={state.portfolio?.certifications ?? []}
              describe={(item) => `${item.instituicao || 'Instituição livre'} ${item.ano ? `• ${item.ano}` : ''}`}
              onAdd={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/skills-portfolio/certifications`, values, 'Certificação adicionada.', 'POST')}
              onDelete={(item) => removeItem(`/api/public/portal-candidates/${candidateId}/skills-portfolio/certifications/${item.id}`, 'Certificação removida.')}
              fields={[
                { name: 'nome', label: 'Nome' },
                { name: 'instituicao', label: 'Instituição' },
                { name: 'ano', label: 'Ano' },
                { name: 'link', label: 'Link' },
              ]}
            />
          </WorkspaceSection>

          <WorkspaceSection title="Educação" description="Resumo da formação e histórico acadêmico detalhado.">
            <RecordForm
              fields={[
                field('nivel', state.education?.summary.nivel),
                field('areaPrincipal', state.education?.summary.areaPrincipal),
                field('situacao', state.education?.summary.situacao),
                field('destaques', state.education?.summary.destaques),
              ]}
              onSubmit={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/education`, values, 'Resumo educacional salvo.')}
            />
            <RepeaterSection
              title="Cursos e formações"
              items={state.education?.items ?? []}
              describe={(item) => `${item.instituicao || 'Instituição livre'} • ${item.status || 'Status aberto'}`}
              onAdd={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/education/items`, values, 'Formação adicionada.', 'POST')}
              onDelete={(item) => removeItem(`/api/public/portal-candidates/${candidateId}/education/items/${item.id}`, 'Formação removida.')}
              fields={[
                { name: 'curso', label: 'Curso' },
                { name: 'instituicao', label: 'Instituição' },
                { name: 'tipo', label: 'Tipo' },
                { name: 'status', label: 'Status' },
                { name: 'inicio', label: 'Início' },
                { name: 'fim', label: 'Fim' },
                { name: 'observacoes', label: 'Observações' },
                { name: 'link', label: 'Link' },
              ]}
            />
          </WorkspaceSection>
        </section>

        <section className="content-column">
          <WorkspaceSection title="Experiências e projetos" description="Linha do tempo profissional e cases de entrega.">
            <RepeaterSection
              title="Experiências"
              items={state.experience?.experiences ?? []}
              describe={(item) => `${item.cargo}  ${item.inicio || '?'} a ${item.fim || 'atual'}`}
              onAdd={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/experiences`, values, 'Experiência adicionada.', 'POST')}
              onDelete={(item) => removeItem(`/api/public/portal-candidates/${candidateId}/experiences/${item.id}`, 'Experiência removida.')}
              fields={[
                { name: 'empresa', label: 'Empresa' },
                { name: 'cargo', label: 'Cargo' },
                { name: 'inicio', label: 'Início' },
                { name: 'fim', label: 'Fim' },
                { name: 'local', label: 'Local / modelo' },
                { name: 'atividades', label: 'Atividades' },
              ]}
            />
            <RepeaterSection
              title="Projetos"
              items={state.experience?.projects ?? []}
              describe={(item) => `${item.periodo || 'Período livre'} • ${item.stack || 'Stack aberta'}`}
              onAdd={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/projects`, values, 'Projeto adicionado.', 'POST')}
              onDelete={(item) => removeItem(`/api/public/portal-candidates/${candidateId}/projects/${item.id}`, 'Projeto removido.')}
              fields={[
                { name: 'nome', label: 'Nome' },
                { name: 'periodo', label: 'Período' },
                { name: 'descricao', label: 'Descrição' },
                { name: 'link', label: 'Link' },
                { name: 'stack', label: 'Stack' },
                { name: 'destaques', label: 'Destaques' },
              ]}
            />
          </WorkspaceSection>

          <WorkspaceSection title="Preferências de vaga" description="Objetivo profissional, deslocamento, jornada e remuneração.">
            <RecordForm
              fields={[
                field('CargoAlvo', asString(state.preferences?.CargoAlvo)),
                field('Senioridade', asString(state.preferences?.Senioridade)),
                field('InicioDisponivel', asString(state.preferences?.InicioDisponivel)),
                field('Resumo', asString(state.preferences?.Resumo), 'textarea'),
                field('AreasInteresse', asString(state.preferences?.AreasInteresse)),
                field('ModeloTrabalho', asString(state.preferences?.ModeloTrabalho)),
                field('Jornada', asString(state.preferences?.Jornada)),
                field('TipoContrato', asString(state.preferences?.TipoContrato)),
                field('Viagens', asString(state.preferences?.Viagens)),
                field('Mudanca', asString(state.preferences?.Mudanca)),
                field('CidadePreferida', asString(state.preferences?.CidadePreferida)),
                field('DistanciaMaxKm', asString(state.preferences?.DistanciaMaxKm)),
                field('ObsDeslocamento', asString(state.preferences?.ObsDeslocamento)),
                field('PretensaoSalarial', asString(state.preferences?.PretensaoSalarial)),
                field('PretensaoNegociavel', asString(state.preferences?.PretensaoNegociavel)),
                field('BeneficiosDesejados', asString(state.preferences?.BeneficiosDesejados)),
                field('NaoAbreMaoDe', asString(state.preferences?.NaoAbreMaoDe)),
              ]}
              onSubmit={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/preferences`, values, 'Preferências salvas.')}
            />
          </WorkspaceSection>

          <WorkspaceSection title="Agenda e disponibilidade" description="Formato de entrevista, janelas preferidas e bloqueios.">
            <RecordForm
              fields={[
                field('formatoEntrevista', state.agenda?.preferences.formatoEntrevista),
                field('inicioDisponivel', state.agenda?.preferences.inicioDisponivel),
                field('avisoPrevio', state.agenda?.preferences.avisoPrevio),
                field('observacoes', state.agenda?.preferences.observacoes, 'textarea'),
                field('horarioPreferido', state.agenda?.preferences.horarioPreferido),
                field('fusoHorario', state.agenda?.preferences.fusoHorario),
              ]}
              checks={[
                check('diaSeg', state.agenda?.preferences.diaSeg),
                check('diaTer', state.agenda?.preferences.diaTer),
                check('diaQua', state.agenda?.preferences.diaQua),
                check('diaQui', state.agenda?.preferences.diaQui),
                check('diaSex', state.agenda?.preferences.diaSex),
                check('diaSab', state.agenda?.preferences.diaSab),
                check('diaDom', state.agenda?.preferences.diaDom),
                check('periodoManha', state.agenda?.preferences.periodoManha),
                check('periodoTarde', state.agenda?.preferences.periodoTarde),
                check('periodoNoite', state.agenda?.preferences.periodoNoite),
              ]}
              onSubmit={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/agenda`, values, 'Preferências de agenda salvas.')}
            />
            <RepeaterSection
              title="Bloqueios"
              items={state.agenda?.blocks ?? []}
              describe={(item) => `${item.data || 'Data'} • ${item.horario || 'Horário'} • ${item.observacoes || 'Sem observações'}`}
              onAdd={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/agenda/blocks`, values, 'Bloqueio adicionado.', 'POST')}
              onDelete={(item) => removeItem(`/api/public/portal-candidates/${candidateId}/agenda/blocks/${item.id}`, 'Bloqueio removido.')}
              fields={[
                { name: 'tipo', label: 'Tipo' },
                { name: 'titulo', label: 'Título' },
                { name: 'data', label: 'Data' },
                { name: 'horario', label: 'Horário' },
                { name: 'observacoes', label: 'Observações' },
              ]}
            />
          </WorkspaceSection>

          <WorkspaceSection title="Notificações e LGPD" description="Consentimentos, canais e prioridades de contato.">
            <RecordForm
              fields={[
                field('frequencia', state.notifications?.frequencia),
                field('idioma', state.notifications?.idioma),
                field('email', state.notifications?.email),
                field('telefone', state.notifications?.telefone),
                field('silencioAtivo', state.notifications?.silencioAtivo),
                field('silencioInicio', state.notifications?.silencioInicio),
                field('silencioFim', state.notifications?.silencioFim),
                field('silencioPrioridade', state.notifications?.silencioPrioridade),
                field('assinatura', state.notifications?.assinatura),
              ]}
              checks={[
                check('canalEmail', state.notifications?.canalEmail),
                check('canalWhatsapp', state.notifications?.canalWhatsapp),
                check('canalSms', state.notifications?.canalSms),
                check('canalPush', state.notifications?.canalPush),
                check('permiteContato', state.notifications?.permiteContato),
                check('alertaNovasVagas', state.notifications?.alertaNovasVagas),
                check('alertaAtualizacoes', state.notifications?.alertaAtualizacoes),
                check('alertaEntrevistas', state.notifications?.alertaEntrevistas),
                check('alertaMensagens', state.notifications?.alertaMensagens),
                check('alertaDocumentos', state.notifications?.alertaDocumentos),
                check('alertaLembretes', state.notifications?.alertaLembretes),
              ]}
              onSubmit={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/notifications`, values, 'Notificações atualizadas.')}
            />

            <RecordForm
              fields={[
                field('retencaoMeses', state.lgpd?.retencaoMeses?.toString() ?? ''),
                field('compartilhamento', state.lgpd?.compartilhamento),
              ]}
              checks={[
                check('processarCandidatura', state.lgpd?.processarCandidatura),
                check('permitirContato', state.lgpd?.permitirContato),
                check('bancoTalentos', state.lgpd?.bancoTalentos),
                check('dadosSensiveis', state.lgpd?.dadosSensiveis),
                check('comunicacoes', state.lgpd?.comunicacoes),
              ]}
              onSubmit={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/lgpd`, {
                ...values,
                retencaoMeses: values.retencaoMeses ? Number(values.retencaoMeses) : null,
              }, 'Preferências LGPD atualizadas.')}
            />
            <button className="secondary-btn" type="button" onClick={() => void openLgpdReceipt(authFetch, candidateId)}>Abrir comprovante LGPD</button>
          </WorkspaceSection>

          <WorkspaceSection title="Documentos, referências e acessibilidade" description="Toda a camada complementar do perfil do candidato.">
            <RepeaterSection
              title="Documentos"
              items={state.documents}
              describe={(item) => `${item.tipo}  ${item.data || 'Sem data'} ${item.fileName ? ` ${item.fileName}` : ''}`}
              onAdd={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/documents`, values, 'Documento salvo.', 'POST')}
              onDelete={(item) => removeItem(`/api/public/portal-candidates/${candidateId}/documents/${item.id}`, 'Documento removido.')}
              fields={[
                { name: 'tipo', label: 'Tipo' },
                { name: 'nome', label: 'Nome' },
                { name: 'link', label: 'Link' },
                { name: 'data', label: 'Data' },
                { name: 'observacoes', label: 'Observações' },
                { name: 'fileName', label: 'Nome do arquivo' },
              ]}
            />

            <RepeaterSection
              title="Referências"
              items={state.references}
              describe={(item) => `${item.relacao || 'Relação livre'} • ${item.contato || 'Contato não informado'}`}
              onAdd={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/references`, {
                ...values,
                podeContatar: Boolean(values.podeContatar),
              }, 'Referência salva.', 'POST')}
              onDelete={(item) => removeItem(`/api/public/portal-candidates/${candidateId}/references/${item.id}`, 'Referência removida.')}
              fields={[
                { name: 'nome', label: 'Nome' },
                { name: 'relacao', label: 'Relação' },
                { name: 'empresa', label: 'Empresa' },
                { name: 'cargo', label: 'Cargo' },
                { name: 'contato', label: 'Contato' },
                { name: 'periodo', label: 'Período' },
                { name: 'linkedin', label: 'LinkedIn' },
                { name: 'observacoes', label: 'Observações' },
                { name: 'podeContatar', label: 'Pode contatar? (true/false)' },
              ]}
            />

            <RecordForm
              fields={[
                field('idioma', state.accessibility?.idioma),
                field('canal', state.accessibility?.canal),
                field('melhorHorario', state.accessibility?.melhorHorario),
                field('observacoesComunicacao', state.accessibility?.observacoesComunicacao, 'textarea'),
                field('detalhesNecessidades', state.accessibility?.detalhesNecessidades, 'textarea'),
                field('pcdIdentificacao', state.accessibility?.pcdIdentificacao),
                field('pcdTipo', state.accessibility?.pcdTipo),
                field('pcdComprovacao', state.accessibility?.pcdComprovacao),
                field('pcdObservacoes', state.accessibility?.pcdObservacoes, 'textarea'),
              ]}
              checks={[
                check('precisaLegendas', state.accessibility?.precisaLegendas),
                check('precisaInterprete', state.accessibility?.precisaInterprete),
                check('precisaLeitorTela', state.accessibility?.precisaLeitorTela),
                check('precisaBaixaEstimulo', state.accessibility?.precisaBaixaEstimulo),
                check('precisaMobilidade', state.accessibility?.precisaMobilidade),
                check('precisaTempoExtra', state.accessibility?.precisaTempoExtra),
                check('consentimentoPcd', state.accessibility?.consentimentoPcd),
              ]}
              onSubmit={(values) => saveJson(`/api/public/portal-candidates/${candidateId}/accessibility`, values, 'Acessibilidade atualizada.')}
            />
          </WorkspaceSection>
        </section>
      </div>
    </main>
  )
}

type AuthContext = {
  tenantId: string
  session: AuthSession | null
  setSession: (session: AuthSession | null) => void
  notifyAuthError: (message: string | null) => void
}

function createAuthorizedClient(ctx: AuthContext) {
  return async function request<T>(path: string, init?: RequestInit, json = true): Promise<T> {
    if (!ctx.session) throw new Error('Sessão não encontrada.')

    const ensured = await ensureSession(ctx.session, ctx.tenantId)
    ctx.setSession(ensured)

    const response = await fetch(await buildApiUrl(path, ctx.tenantId), {
      ...init,
      headers: {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        'X-Tenant-Id': ctx.tenantId,
        Authorization: `Bearer ${ensured.accessToken}`,
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        ctx.notifyAuthError('Sua sessão expirou. Entre novamente.')
        ctx.setSession(null)
      }
      throw new Error(await readApiMessage(response))
    }

    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }
}

async function fetchAuthorizedBlobUrl(ctx: AuthContext, path: string) {
  if (!ctx.session) throw new Error('Sessão não encontrada.')
  const ensured = await ensureSession(ctx.session, ctx.tenantId)
  ctx.setSession(ensured)

  const response = await fetch(await buildApiUrl(path, ctx.tenantId), {
    headers: {
      'X-Tenant-Id': ctx.tenantId,
      Authorization: `Bearer ${ensured.accessToken}`,
    },
  })
  if (!response.ok) throw new Error(await readApiMessage(response))
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

async function ensureSession(session: AuthSession, tenantId: string) {
  const expiresAt = new Date(session.accessTokenExpiresAtUtc).getTime()
  if (expiresAt - Date.now() > 60_000) return session

  const refreshed = await portalRequest<AuthSession>(tenantId, '/api/public/portal-auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  })
  return refreshed
}

async function portalRequest<T>(tenantId: string, path: string, init?: RequestInit) {
  const response = await fetch(await buildApiUrl(path, tenantId), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    throw new Error(await readApiMessage(response))
  }

  return response.json() as Promise<T>
}

async function fetchJson<T>(url: string) {
  const response = await fetch(await buildApiUrl(url))
  if (!response.ok) {
    throw new Error(await readApiMessage(response))
  }

  return response.json() as Promise<T>
}

function SummaryCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <article className="summary-card">
      <div className="eyebrow">{title}</div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function WorkspaceSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="workspace-card">
      <div className="section-head">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="section-body">{children}</div>
    </section>
  )
}

function RecordForm({
  fields,
  checks,
  onSubmit,
}: {
  fields: { label: string; name: string; value?: string | null; kind?: 'input' | 'textarea' }[]
  checks?: { name: string; checked?: boolean }[]
  onSubmit: (values: Record<string, string | boolean>) => void
}) {
  const initial = useMemo(() => {
    const values: Record<string, string | boolean> = {}
    for (const fieldItem of fields) values[fieldItem.name] = fieldItem.value ?? ''
    for (const checkItem of checks ?? []) values[checkItem.name] = Boolean(checkItem.checked)
    return values
  }, [checks, fields])
  const [values, setValues] = useState(initial)

  useEffect(() => {
    setValues(initial)
  }, [initial])

  return (
    <form
      className="stack-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(values)
      }}
    >
      {fields.map((fieldItem) => (
        <label key={fieldItem.name}>
          <span>{fieldItem.label}</span>
          {fieldItem.kind === 'textarea' ? (
            <textarea rows={4} value={String(values[fieldItem.name] ?? '')} onChange={(e) => setValues((v) => ({ ...v, [fieldItem.name]: e.target.value }))} />
          ) : (
            <input value={String(values[fieldItem.name] ?? '')} onChange={(e) => setValues((v) => ({ ...v, [fieldItem.name]: e.target.value }))} />
          )}
        </label>
      ))}
      {checks?.length ? (
        <div className="checks-grid">
          {checks.map((checkItem) => (
            <label key={checkItem.name} className="check-row">
              <input
                type="checkbox"
                checked={Boolean(values[checkItem.name])}
                onChange={(e) => setValues((v) => ({ ...v, [checkItem.name]: e.target.checked }))}
              />
              <span>{checkItem.name}</span>
            </label>
          ))}
        </div>
      ) : null}
      <button className="primary-btn" type="submit">Salvar se??o</button>
    </form>
  )
}

function RepeaterSection<TItem extends { id: string }>({
  title,
  items,
  describe,
  fields,
  onAdd,
  onDelete,
}: {
  title: string
  items: TItem[]
  describe: (item: TItem) => string
  fields: { name: string; label: string }[]
  onAdd: (values: Record<string, string>) => void
  onDelete: (item: TItem) => void
}) {
  const [draft, setDraft] = useState<Record<string, string>>({})

  return (
    <div className="subsection-card">
      <div className="subsection-head">
        <strong>{title}</strong>
        <span>{items.length} item(ns)</span>
      </div>
      <div className="list-shell">
        {items.map((item) => (
          <article key={item.id} className="list-item">
            <div>
              <strong>{getRepeaterTitle(item)}</strong>
              <p>{describe(item)}</p>
            </div>
            <button className="ghost-btn" type="button" onClick={() => onDelete(item)}>Remover</button>
          </article>
        ))}
        {items.length === 0 ? <div className="empty-inline">Nenhum item registrado ainda.</div> : null}
      </div>
      <form
        className="grid-form"
        onSubmit={(event) => {
          event.preventDefault()
          onAdd(draft)
          setDraft({})
        }}
      >
        {fields.map((fieldItem) => (
          <label key={fieldItem.name}>
            <span>{fieldItem.label}</span>
            <input value={draft[fieldItem.name] ?? ''} onChange={(e) => setDraft((v) => ({ ...v, [fieldItem.name]: e.target.value }))} />
          </label>
        ))}
        <button className="secondary-btn" type="submit">Adicionar</button>
      </form>
    </div>
  )
}

function PageLoading({ label }: { label: string }) {
  return (
    <main className="page-shell">
      <section className="state-card loading">
        <div className="loader" />
        <p>{label}</p>
      </section>
    </main>
  )
}

function field(label: string, value?: string | null, kind: 'input' | 'textarea' = 'input') {
  return { label, name: label, value, kind }
}

function check(name: string, checked?: boolean) {
  return { name, checked }
}

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return 'Faixa a combinar'
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  if (min && max) return `${fmt.format(min)} - ${fmt.format(max)}`
  return fmt.format(min || max || 0)
}

const JOB_HERO_GRADIENTS = [
  'linear-gradient(135deg, #1e3a8a, #0ea5e9)',
  'linear-gradient(135deg, #0f766e, #22c55e)',
  'linear-gradient(135deg, #7c3aed, #ec4899)',
  'linear-gradient(135deg, #d97706, #f97316)',
  'linear-gradient(135deg, #1d4ed8, #38bdf8)',
  'linear-gradient(135deg, #4f46e5, #6366f1)',
]

const JOB_SECTION_IMAGES = [
  { match: 'industrial', title: 'Operações Industriais', image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&q=80&w=1600' },
  { match: 'qualidade', title: 'Qualidade & P&D', image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=80&w=1600' },
  { match: 'logistica', title: 'Logística & Supply', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1600' },
  { match: 'rh', title: 'Administrativo & RH', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1600' },
  { match: 'administrativo', title: 'Administrativo & RH', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1600' },
  { match: 'comercial', title: 'Vendas & Marketing', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1600' },
  { match: 'marketing', title: 'Vendas & Marketing', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1600' },
]

function parseJobTags(raw: string | null | undefined) {
  if (!raw) return []
  return raw
    .split(/[,;|]/g)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function buildJobTags(job: PortalJob) {
  return Array.from(
    new Set([
      ...parseJobTags(job.tagsKeywordsRaw),
      ...parseJobTags(job.tagsStackRaw),
      ...parseJobTags(job.tagsResponsabilidadesRaw),
    ]),
  )
}

function buildJobBadgeValues(job: PortalJob) {
  return [job.modalidade, job.tipoContratacao, job.senioridade].filter(Boolean) as string[]
}

function formatJobLocation(job: PortalJob) {
  const city = (job.cidade || '').trim()
  const uf = (job.uf || '').trim()
  if (city && uf) return `${city}, ${uf}`
  if (city) return city
  if (uf) return uf
  return job.modalidade || 'Não informado'
}

function normalizeAreaKey(value: string | null | undefined) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getJobSectionInfo(area: string | null | undefined) {
  const key = normalizeAreaKey(area)
  const match = JOB_SECTION_IMAGES.find((item) => key.includes(item.match))
  if (match) return match
  return {
    title: area || 'Vagas em destaque',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1600',
  }
}

function groupJobsByArea(jobs: PortalJob[]) {
  const groups = new Map<string, PortalJob[]>()
  for (const job of jobs) {
    const info = getJobSectionInfo(job.area)
    const key = `${info.title}|||${info.image}`
    const bucket = groups.get(key) ?? []
    bucket.push(job)
    groups.set(key, bucket)
  }

  return Array.from(groups.entries()).map(([key, items]) => {
    const [title, image] = key.split('|||')
    return { title, image, jobs: items }
  })
}

function getJobHeroBackground(index: number) {
  return JOB_HERO_GRADIENTS[index % JOB_HERO_GRADIENTS.length]
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return (parts[0]?.slice(0, 1) || 'U').toUpperCase()
}

function getRepeaterTitle(item: Record<string, unknown>) {
  const keys = ['nome', 'curso', 'empresa', 'titulo', 'title']
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return 'Item'
}

function withTenant(path: string, tenantId: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${TENANT_QUERY_KEY}=${encodeURIComponent(tenantId)}`
}

function loadStoredSession(storageKey: string) {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

function persistSession(storageKey: string, session: AuthSession) {
  localStorage.setItem(storageKey, JSON.stringify(session))
}

function clearSession(storageKey: string) {
  localStorage.removeItem(storageKey)
}

async function signOutPortalSession(ctx: AuthContext) {
  if (ctx.session) {
    try {
      await fetch(await buildApiUrl('/api/public/portal-auth/logout', ctx.tenantId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': ctx.tenantId,
          Authorization: `Bearer ${ctx.session.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: ctx.session.refreshToken }),
      })
    } catch {
      // best effort
    }
  }

  ctx.setSession(null)
}

async function buildApiUrl(path: string, tenantId?: string) {
  const baseUrl = await resolveApiBaseUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`
  const url = new URL(baseUrl ? `${baseUrl}${normalized}` : normalized, window.location.origin)
  if (tenantId) {
    url.searchParams.set(TENANT_QUERY_KEY, tenantId)
  }
  return url.toString()
}

async function resolveApiBaseUrl() {
  if (resolvedApiBaseUrl) return resolvedApiBaseUrl

  if (import.meta.env.DEV) {
    resolvedApiBaseUrl = DEV_PROXY_BASE_URL
    return resolvedApiBaseUrl
  }

  resolvedApiBaseUrl = API_BASE_URL
  return resolvedApiBaseUrl
}

async function readApiMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string }
    return data.message || `Falha HTTP ${response.status}`
  } catch {
    return `Falha HTTP ${response.status}`
  }
}

function readError(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Ocorreu uma falha inesperada.'
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function asString(value: string | null | undefined) {
  return value ?? ''
}

async function openResumeHtml(authFetch: ReturnType<typeof createAuthorizedClient>, candidateId: string) {
  const data = await authFetch<{ fileName: string; html: string }>(`/api/public/portal-candidates/${candidateId}/resume-html`)
  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) return
  win.document.write(data.html)
  win.document.title = data.fileName
}

async function downloadResumePdf(authFetch: ReturnType<typeof createAuthorizedClient>, candidateId: string) {
  const data = await authFetch<{ fileName: string; contentType: string; base64: string }>(`/api/public/portal-candidates/${candidateId}/resume-pdf`)
  const bytes = Uint8Array.from(atob(data.base64), (char) => char.charCodeAt(0))
  const blob = new Blob([bytes], { type: data.contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = data.fileName
  link.click()
  URL.revokeObjectURL(url)
}

async function openLgpdReceipt(authFetch: ReturnType<typeof createAuthorizedClient>, candidateId: string) {
  const data = await authFetch<{ html: string }>(`/api/public/portal-candidates/${candidateId}/lgpd/receipt`)
  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) return
  win.document.write(data.html)
}

export default App



