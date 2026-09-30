import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import './App.css'

const API_URL = 'https://jsonplaceholder.typicode.com'
const DEMO_PASSWORD = 'Caderno#2026'
const SAVED_POSTS_KEY = 'caderno-posts'
const SESSION_AUTHOR_KEY = 'caderno-author-id'

type Post = {
  userId: number
  id: number
  title: string
  body: string
}

type User = {
  id: number
  name: string
  email: string
  company: { name: string }
}

type Comment = {
  postId: number
  id: number
  name: string
  email: string
  body: string
}

type BlogData = {
  posts: Post[]
  users: User[]
}

function App() {
  const [blogData, setBlogData] = useState<BlogData>({ posts: [], users: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authorId, setAuthorId] = useState<number | null>(() => {
    const savedId = Number(sessionStorage.getItem(SESSION_AUTHOR_KEY))
    return Number.isInteger(savedId) && savedId > 0 ? savedId : null
  })

  useEffect(() => {
    async function loadBlogData() {
      try {
        const [postsResponse, usersResponse] = await Promise.all([
          fetch(`${API_URL}/posts`),
          fetch(`${API_URL}/users`),
        ])

        if (!postsResponse.ok || !usersResponse.ok) {
          throw new Error('Não foi possível carregar os dados do blog.')
        }

        const [posts, users] = await Promise.all([
          postsResponse.json() as Promise<Post[]>,
          usersResponse.json() as Promise<User[]>,
        ])
        setBlogData({ posts: readSavedPosts() ?? posts, users })
      } catch {
        setError('Não foi possível conectar ao blog. Verifique sua conexão e tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    void loadBlogData()
  }, [])

  function savePosts(posts: Post[]) {
    setBlogData((current) => ({ ...current, posts }))
    try {
      localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(posts))
    } catch {
      // As alterações continuam disponíveis na tela atual mesmo se o armazenamento estiver indisponível.
    }
  }

  function logIn(user: User) {
    sessionStorage.setItem(SESSION_AUTHOR_KEY, String(user.id))
    setAuthorId(user.id)
  }

  function logOut() {
    sessionStorage.removeItem(SESSION_AUTHOR_KEY)
    setAuthorId(null)
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Caderno, página inicial">
            <span className="brand-mark" aria-hidden="true">c.</span>
            <span>caderno<span className="brand-period">.</span></span>
          </Link>
          <nav className="main-nav" aria-label="Navegação principal">
            <Link to="/">Início</Link>
            <Link to={authorId ? '/painel' : '/autor/login'}>{authorId ? 'Meu painel' : 'Área do autor'}</Link>
            <a href="https://jsonplaceholder.typicode.com/posts" target="_blank" rel="noreferrer">API aberta <span aria-hidden="true">↗</span></a>
          </nav>
          <span className="header-note"><span className="status-dot" /> Leituras para ir mais longe</span>
        </div>
      </header>

      <main>
        <Routes>
          <Route
            path="/"
            element={<HomePage posts={blogData.posts} users={blogData.users} loading={loading} error={error} />}
          />
          <Route
            path="/posts/:postId"
            element={<PostPage posts={blogData.posts} users={blogData.users} loading={loading} error={error} />}
          />
          <Route
            path="/autores/:authorId"
            element={<AuthorPage posts={blogData.posts} users={blogData.users} loading={loading} error={error} />}
          />
          <Route path="/autor/login" element={<AuthorLoginPage users={blogData.users} loading={loading} onLogin={logIn} />} />
          <Route path="/painel" element={<AuthorDashboard authorId={authorId} posts={blogData.posts} users={blogData.users} loading={loading} onSavePosts={savePosts} onLogOut={logOut} />} />
          <Route path="/painel/novo" element={<PostEditorPage mode="create" authorId={authorId} posts={blogData.posts} users={blogData.users} loading={loading} onSavePosts={savePosts} />} />
          <Route path="/painel/posts/:postId/editar" element={<PostEditorPage mode="edit" authorId={authorId} posts={blogData.posts} users={blogData.users} loading={loading} onSavePosts={savePosts} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <Link className="footer-brand" to="/">caderno.</Link>
        <span>Ideias, histórias e conversas.</span>
        <span>Feito para leitores curiosos <span aria-hidden="true">✳</span></span>
      </footer>
    </div>
  )
}

function HomePage({ posts, users, loading, error }: BlogData & { loading: boolean; error: string }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> UM ESPAÇO PARA BOAS IDEIAS</p>
          <h1>Histórias que<br /><span>merecem ser lidas.</span></h1>
          <p className="hero-description">Perspectivas, descobertas e conversas para inspirar o seu próximo pensamento.</p>
          <a className="hero-link" href="#ultimas-leituras">Explore as leituras <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-paper art-paper-back" />
          <div className="art-paper art-paper-front">
            <span className="paper-kicker">NOTAS DE HOJE</span>
            <span className="paper-line paper-line-long" />
            <span className="paper-line paper-line-short" />
            <span className="paper-scribble">ideias<br />em movimento<span>.</span></span>
            <span className="paper-star">✳</span>
          </div>
          <span className="art-orbit art-orbit-one" />
          <span className="art-orbit art-orbit-two" />
        </div>
        <div className="hero-caption"><span>01 — 03</span><span>Um convite à leitura</span><span>✳</span></div>
      </section>

      <section className="content-section" id="ultimas-leituras">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DO NOSSO CADERNO</p>
            <h2>Últimas leituras<span>.</span></h2>
          </div>
          {!loading && !error && <span className="post-count">{posts.length} histórias</span>}
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="post-grid">
            {posts.map((post, index) => {
              const author = users.find((user) => user.id === post.userId)
              return (
                <article className={`post-card post-card-${(index % 3) + 1}`} key={post.id}>
                  <div className="card-topline">
                    <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="card-decoration" aria-hidden="true">✳</span>
                  </div>
                  <h3><Link to={`/posts/${post.id}`}>{capitalize(post.title)}</Link></h3>
                  <p className="card-excerpt">{makeExcerpt(post.body)}</p>
                  <div className="card-footer">
                    {author ? <Link className="author-link" to={`/autores/${author.id}`}><span className="avatar">{getInitials(author.name)}</span><span>{author.name}</span></Link> : <span className="author-link">Autor convidado</span>}
                    <Link className="read-link" to={`/posts/${post.id}`} aria-label={`Ler ${post.title}`}>↗</Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

function PostPage({ posts, users, loading, error }: BlogData & { loading: boolean; error: string }) {
  const { postId } = useParams()
  const post = posts.find((item) => item.id === Number(postId))
  const author = post ? users.find((user) => user.id === post.userId) : undefined

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!post) return <NotFoundPage />

  return (
    <article className="article-page">
      <Link className="back-link" to="/">← Todas as histórias</Link>
      <div className="article-heading">
        <p className="eyebrow">CADERNO DE IDEIAS <span>·</span> LEITURA</p>
        <h1>{capitalize(post.title)}</h1>
        <div className="article-byline">
          {author ? <Link className="author-link" to={`/autores/${author.id}`}><span className="avatar">{getInitials(author.name)}</span><span>Por <strong>{author.name}</strong></span></Link> : <span>Autor convidado</span>}
          <span className="byline-divider" />
          <span>Post #{post.id}</span>
        </div>
      </div>
      <div className="article-cover"><span>✳</span><span>uma ideia<br />de cada vez.</span><span>caderno — {String(post.id).padStart(2, '0')}</span></div>
      <div className="article-body"><p className="dropcap">{capitalize(post.body)}</p></div>
      <CommentsSection postId={post.id} />
    </article>
  )
}

function CommentsSection({ postId }: { postId: number }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    async function loadComments() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`)
        if (!response.ok) throw new Error('Falha ao carregar comentários.')
        const data = await response.json() as Comment[]
        if (active) setComments(data)
      } catch {
        if (active) setError('Não foi possível carregar os comentários. Tente novamente mais tarde.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadComments()
    return () => { active = false }
  }, [postId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setNotice('')
    const form = event.currentTarget
    const formData = new FormData(form)
    const newComment = {
      postId,
      name: String(formData.get('name')).trim(),
      email: String(formData.get('email')).trim(),
      body: String(formData.get('comment')).trim(),
      approved: false,
    }

    try {
      const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(newComment),
      })
      if (!response.ok) throw new Error('Falha ao enviar comentário.')
      setNotice('Obrigado por participar! Seu comentário foi enviado para aprovação.')
      form.reset()
    } catch {
      setNotice('Não foi possível enviar seu comentário. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comments-section" aria-labelledby="comments-title">
      <div className="comments-heading">
        <div><p className="eyebrow">A CONVERSA CONTINUA</p><h2 id="comments-title">Comentários<span>.</span></h2></div>
        {!loading && !error && <span className="post-count">{comments.length} publicados</span>}
      </div>
      {loading ? <p className="muted-message">Carregando comentários…</p> : error ? <p className="error-message">{error}</p> : comments.length ? (
        <div className="comment-list">
          {comments.map((comment) => (
            <article className="comment" key={comment.id}>
              <span className="comment-avatar">{getInitials(comment.name)}</span>
              <div><h3>{comment.name}</h3><p>{comment.body}</p></div>
            </article>
          ))}
        </div>
      ) : <p className="muted-message">Ainda não há comentários. Que tal começar a conversa?</p>}

      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="form-heading"><h3>Deixe sua marca</h3><p>Seu comentário será revisado antes de aparecer.</p></div>
        <div className="form-row">
          <label>Seu nome<input name="name" type="text" placeholder="Como podemos chamar você?" autoComplete="name" required maxLength={80} /></label>
          <label>Seu e-mail<input name="email" type="email" placeholder="voce@exemplo.com" autoComplete="email" required maxLength={120} /></label>
        </div>
        <label>Comentário<textarea name="comment" placeholder="Compartilhe o que você pensou…" rows={4} required maxLength={1000} /></label>
        <div className="form-bottom"><span>Seu e-mail não será exibido.</span><button type="submit" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar comentário'} <span aria-hidden="true">↗</span></button></div>
        {notice && <p className={notice.startsWith('Não foi') ? 'error-message form-notice' : 'success-message form-notice'} role="status">{notice}</p>}
      </form>
    </section>
  )
}

function AuthorPage({ posts, users, loading, error }: BlogData & { loading: boolean; error: string }) {
  const { authorId } = useParams()
  const author = users.find((user) => user.id === Number(authorId))
  const authorPosts = posts.filter((post) => post.userId === Number(authorId))

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!author) return <NotFoundPage />

  return (
    <section className="author-page">
      <Link className="back-link" to="/">← Todas as histórias</Link>
      <div className="author-profile">
        <span className="author-avatar-large">{getInitials(author.name)}</span>
        <div><p className="eyebrow">QUEM ESCREVE</p><h1>{author.name}<span>.</span></h1><p>{author.company.name}</p></div>
      </div>
      <div className="section-heading author-section-heading"><div><p className="eyebrow">NA PÁGINA DE {author.name.toLocaleUpperCase('pt-BR')}</p><h2>Suas histórias<span>.</span></h2></div><span className="post-count">{authorPosts.length} histórias</span></div>
      {authorPosts.length ? <div className="post-grid">{authorPosts.map((post, index) => <article className={`post-card post-card-${(index % 3) + 1}`} key={post.id}><div className="card-topline"><span className="card-number">{String(index + 1).padStart(2, '0')}</span><span className="card-decoration" aria-hidden="true">✳</span></div><h3><Link to={`/posts/${post.id}`}>{capitalize(post.title)}</Link></h3><p className="card-excerpt">{makeExcerpt(post.body)}</p><div className="card-footer"><span className="author-link"><span className="avatar">{getInitials(author.name)}</span><span>{author.name}</span></span><Link className="read-link" to={`/posts/${post.id}`} aria-label={`Ler ${post.title}`}>↗</Link></div></article>)}</div> : <p className="muted-message">Este autor ainda não publicou histórias.</p>}
    </section>
  )
}

function AuthorLoginPage({ users, loading, onLogin }: { users: User[]; loading: boolean; onLogin: (user: User) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email')).trim().toLocaleLowerCase('pt-BR')
    const password = String(formData.get('password'))
    const user = users.find((item) => item.email.toLocaleLowerCase('pt-BR') === email)

    if (!user || password !== DEMO_PASSWORD) {
      setError('E-mail ou senha incorretos. Confira os dados de demonstração abaixo.')
      return
    }

    onLogin(user)
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/painel'
    navigate(redirectTo, { replace: true })
  }

  return (
    <section className="auth-page">
      <Link className="back-link" to="/">← Voltar ao blog</Link>
      <div className="auth-card">
        <span className="auth-icon" aria-hidden="true">c.</span>
        <p className="eyebrow">ESPAÇO DE AUTOR</p>
        <h1>Bom ter você<br />de volta<span>.</span></h1>
        <p className="auth-description">Entre para organizar suas histórias e continuar escrevendo.</p>
        <form className="author-form" onSubmit={handleSubmit}>
          <label>E-mail<input name="email" type="email" placeholder="seu@email.com" autoComplete="username" required /></label>
          <label>Senha<input name="password" type="password" placeholder="Digite sua senha" autoComplete="current-password" required /></label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Carregando autores…' : 'Entrar no painel'} <span aria-hidden="true">↗</span></button>
        </form>
        <aside className="demo-credentials"><strong>Acesso de demonstração</strong><span>Use o e-mail de qualquer autor listado no blog e a senha <b>{DEMO_PASSWORD}</b>.</span></aside>
        <p className="security-notice">Esta versão é demonstrativa: a API não oferece autenticação. Em produção, login e autorização precisam ser validados por um servidor seguro.</p>
      </div>
    </section>
  )
}

function AuthorDashboard({ authorId, posts, users, loading, onSavePosts, onLogOut }: {
  authorId: number | null
  posts: Post[]
  users: User[]
  loading: boolean
  onSavePosts: (posts: Post[]) => void
  onLogOut: () => void
}) {
  const navigate = useNavigate()
  const author = users.find((user) => user.id === authorId)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  if (!authorId) return <Navigate to="/autor/login" replace />
  if (loading) return <LoadingState />
  if (!author) return <Navigate to="/autor/login" replace />

  const authorPosts = posts.filter((post) => post.userId === author.id)

  async function handleDelete(post: Post) {
    if (!window.confirm(`Excluir “${capitalize(post.title)}”? Esta ação não pode ser desfeita.`)) return
    setDeletingId(post.id)
    setError('')
    try {
      const response = await fetch(`${API_URL}/posts/${post.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Falha ao excluir post.')
      onSavePosts(posts.filter((item) => item.id !== post.id))
    } catch {
      setError('Não foi possível excluir este post. Tente novamente.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleLogOut() {
    onLogOut()
    navigate('/', { replace: true })
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-topline"><Link className="back-link" to="/">← Voltar ao blog</Link><button className="text-button" onClick={handleLogOut}>Sair da conta ↗</button></div>
      <div className="dashboard-heading">
        <div><p className="eyebrow">PAINEL DE AUTOR</p><h1>Olá, {author.name.split(' ')[0]}<span>.</span></h1><p>Aqui estão suas histórias publicadas e em edição.</p></div>
        <Link className="primary-button new-post-button" to="/painel/novo"><span aria-hidden="true">＋</span> Escrever um post</Link>
      </div>
      <div className="dashboard-notice"><span aria-hidden="true">i</span><p>Ambiente de demonstração: criação, edição e exclusão são simuladas pela API e mantidas neste navegador.</p></div>
      {error && <p className="error-message dashboard-error" role="alert">{error}</p>}
      <div className="dashboard-list-heading"><div><p className="eyebrow">SEU CADERNO</p><h2>Meus posts<span>.</span></h2></div><span className="post-count">{authorPosts.length} {authorPosts.length === 1 ? 'post' : 'posts'}</span></div>
      {authorPosts.length ? (
        <div className="managed-post-list">
          {authorPosts.map((post, index) => (
            <article className="managed-post" key={post.id}>
              <span className="managed-post-number">{String(index + 1).padStart(2, '0')}</span>
              <div className="managed-post-copy"><h3><Link to={`/posts/${post.id}`}>{capitalize(post.title)}</Link></h3><p>{makeExcerpt(post.body)}</p></div>
              <div className="managed-post-actions"><Link to={`/painel/posts/${post.id}/editar`} aria-label={`Editar ${post.title}`}>Editar</Link><button onClick={() => void handleDelete(post)} disabled={deletingId === post.id}>{deletingId === post.id ? 'Excluindo…' : 'Excluir'}</button></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-posts"><span aria-hidden="true">✳</span><h3>Seu caderno ainda está em branco.</h3><p>Escreva seu primeiro post e compartilhe uma ideia com o mundo.</p><Link className="primary-button" to="/painel/novo">Criar primeiro post <span aria-hidden="true">↗</span></Link></div>
      )}
    </section>
  )
}

function PostEditorPage({ mode, authorId, posts, users, loading, onSavePosts }: {
  mode: 'create' | 'edit'
  authorId: number | null
  posts: Post[]
  users: User[]
  loading: boolean
  onSavePosts: (posts: Post[]) => void
}) {
  const { postId } = useParams()
  const author = users.find((user) => user.id === authorId)
  const existingPost = posts.find((post) => post.id === Number(postId))

  if (!authorId) return <Navigate to="/autor/login" replace />
  if (loading) return <LoadingState />
  if (!author) return <Navigate to="/autor/login" replace />
  if (mode === 'edit' && (!existingPost || existingPost.userId !== author.id)) return <NotFoundPage />

  return <PostEditorForm key={`${mode}-${existingPost?.id ?? 'novo'}`} mode={mode} author={author} existingPost={existingPost} posts={posts} onSavePosts={onSavePosts} />
}

function PostEditorForm({ mode, author, existingPost, posts, onSavePosts }: {
  mode: 'create' | 'edit'
  author: User
  existingPost: Post | undefined
  posts: Post[]
  onSavePosts: (posts: Post[]) => void
}) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(existingPost?.title ?? '')
  const [body, setBody] = useState(existingPost?.body ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const isEditing = mode === 'edit' && existingPost !== undefined
    const url = isEditing ? `${API_URL}/posts/${existingPost.id}` : `${API_URL}/posts`

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ userId: author.id, title: title.trim(), body: body.trim() }),
      })
      if (!response.ok) throw new Error('Falha ao salvar post.')
      const savedPost: Post = isEditing && existingPost
        ? { ...existingPost, title: title.trim(), body: body.trim() }
        : { userId: author.id, id: Math.max(0, ...posts.map((post) => post.id)) + 1, title: title.trim(), body: body.trim() }
      const nextPosts = isEditing && existingPost
        ? posts.map((post) => post.id === savedPost.id ? savedPost : post)
        : [savedPost, ...posts]
      onSavePosts(nextPosts)
      navigate('/painel', { replace: true })
    } catch {
      setError('Não foi possível salvar seu post. Verifique a conexão e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="editor-page">
      <Link className="back-link" to="/painel">← Voltar aos meus posts</Link>
      <div className="editor-heading"><p className="eyebrow">{mode === 'edit' ? 'REVISÃO DE HISTÓRIA' : 'UMA NOVA HISTÓRIA'}</p><h1>{mode === 'edit' ? 'Editar post' : 'Escrever um post'}<span>.</span></h1><p>Escolha um título marcante e conte sua ideia com suas palavras.</p></div>
      <form className="post-editor-form" onSubmit={(event) => void handleSubmit(event)}>
        <label htmlFor="post-title">Título<span>{title.length}/120</span></label>
        <input id="post-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dê um título à sua história" maxLength={120} required />
        <label htmlFor="post-body">Conteúdo<span>{body.length}/5000</span></label>
        <textarea id="post-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Comece a escrever aqui…" rows={12} maxLength={5000} required />
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="editor-actions"><button className="secondary-button" type="button" onClick={() => navigate('/painel')}>Cancelar</button><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Salvando…' : mode === 'edit' ? 'Salvar alterações' : 'Publicar post'} <span aria-hidden="true">↗</span></button></div>
      </form>
      <p className="editor-footnote">Ao salvar, a API JSONPlaceholder recebe uma requisição simulada. Suas alterações ficam guardadas localmente neste navegador.</p>
    </section>
  )
}

function readSavedPosts(): Post[] | null {
  try {
    const saved = localStorage.getItem(SAVED_POSTS_KEY)
    if (!saved) return null
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((item): item is Post =>
      typeof item === 'object' && item !== null &&
      typeof item.id === 'number' && typeof item.userId === 'number' &&
      typeof item.title === 'string' && typeof item.body === 'string',
    )
  } catch {
    return null
  }
}

function LoadingState() {
  return <div className="state-message" role="status"><span className="loading-spinner" /><p>Preparando boas leituras…</p></div>
}

function ErrorState({ message }: { message: string }) {
  return <div className="state-message error-state"><span aria-hidden="true">!</span><p>{message}</p><button onClick={() => window.location.reload()}>Tentar novamente</button></div>
}

function NotFoundPage() {
  return <div className="state-message not-found"><p className="eyebrow">PÁGINA NÃO ENCONTRADA</p><h1>Esta história ainda não foi escrita<span>.</span></h1><Link className="primary-link" to="/">Voltar ao início <span aria-hidden="true">↗</span></Link></div>
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1)
}

function makeExcerpt(value: string) {
  const excerpt = capitalize(value)
  return excerpt.length > 118 ? `${excerpt.slice(0, 118).trimEnd()}…` : excerpt
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR')
}

export default App
