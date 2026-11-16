import type { BlockManifest, PageDetail, PageRevisionDetail, ProjectSummary } from '@crito/contract'

// Демонстрационные данные намеренно не связаны с рабочей базой и не содержат реальных заявок.
const STORAGE_KEY = 'cms-panel-demo-v1'
const date = '2026-10-20T10:00:00.000Z'
const author = { name: 'Демо', email: 'demo@example.com' }
const schema = {
  type: 'object',
  properties: {
    title: { type: 'string', title: 'Заголовок' },
    text: { type: 'string', title: 'Описание' },
    button: { type: 'string', title: 'Текст кнопки' }
  }
}
const manifest: BlockManifest = {
  project: 'rucode', version: 'demo', blocks: [
    { type: 'demo.hero', title: 'Главный экран', category: 'hero', schemaVersion: 1, readonly: false, aliases: [], schema },
    { type: 'demo.info', title: 'Информационный блок', category: 'content', schemaVersion: 1, readonly: false, aliases: [], schema },
    { type: 'demo.events', title: 'Мероприятия', category: 'cards', schemaVersion: 1, readonly: false, aliases: [], schema }
  ]
}

function makePage(id: string, slug: string, title: string): PageDetail {
  return {
    id, slug, version: 1, updatedAt: date, meta: { title, description: 'Демонстрационная страница проекта RuCode.' },
    blocks: [
      { id: `${id}-hero`, type: 'demo.hero', order: 10, enabled: true, data: { title, text: 'Мероприятия, обучение и соревнования для участников фестиваля.', button: 'Узнать больше' } },
      { id: `${id}-info`, type: 'demo.info', order: 20, enabled: true, data: { title: 'О проекте', text: 'Этот текст можно изменить в демонстрационном редакторе.' } },
      { id: `${id}-events`, type: 'demo.events', order: 30, enabled: true, data: { title: 'Мероприятия', text: 'Выберите интересующее направление.' } }
    ],
    header: null, footer: null, noFooterSpacing: false, deletedAt: null, draft: null
  }
}

interface DemoState {
  pages: PageDetail[]
  revisions: Record<string, PageRevisionDetail[]>
}

function initialState(): DemoState {
  const pages = [makePage('home', '/index', 'Главная'), makePage('champ', '/champ', 'Алгоритмическое программирование'), makePage('award', '/award2026', 'Премия 2026'), makePage('ai', '/ai_champ', 'Чемпионат по ИИ'), makePage('testing', '/aitesting', 'Тестирование')]
  return { pages, revisions: Object.fromEntries(pages.map(page => [page.id, [revision(page)]])) }
}

function revision(page: PageDetail): PageRevisionDetail {
  return { version: page.version, createdAt: page.updatedAt, author, blocks: page.blocks, meta: page.meta, header: page.header, footer: page.footer, noFooterSpacing: page.noFooterSpacing }
}

let memory: DemoState | undefined
function load(): DemoState {
  if (memory) return memory
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return (memory = JSON.parse(saved) as DemoState)
  } catch { /* Хранилище может быть недоступно. */ }
  return (memory = initialState())
}
function save(state: DemoState) {
  memory = state
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* Демо продолжает работать в памяти вкладки. */ }
}
function clone<T>(value: T): T { return structuredClone(value) }
function failure(message: string): never { throw new Error(message) }

export async function demoApi(path: string, options: { method?: string, body?: unknown } = {}): Promise<unknown> {
  const state = load()
  const method = (options.method ?? 'GET').toUpperCase()
  const parts = path.split('?')[0]!.split('/').filter(Boolean)
  const body = (options.body ?? {}) as Record<string, unknown>
  const active = state.pages.filter(page => !page.deletedAt)
  const project: ProjectSummary = {
    id: 'rucode', slug: 'rucode', name: 'RuCode', defaultLocale: 'ru', revalidateUrl: null, siteUrl: null,
    repositoryUrl: null, metrikaCounterId: null, manifestHash: 'demo', createdAt: date,
    fullAccess: true, requestsAccess: false, pagesCount: active.length, lastChangedAt: active[0]?.updatedAt ?? null
  }
  if (path === '/me') return { id: 'demo', ...author, isSuperAdmin: false, viaLms: true }
  if (parts[0] === 'dictionaries' && parts[1] === 'regions' && method === 'GET') return [
    { id: '1', value: 'moscow', label: 'Москва', sortOrder: 10 },
    { id: '2', value: 'saint-petersburg', label: 'Санкт-Петербург', sortOrder: 20 }
  ]
  if (parts[0] !== 'projects') return failure('Эта функция недоступна в демо')
  if (parts.length === 1 && method === 'GET') return [project]
  if (parts[1] !== 'rucode') return failure('Проект не найден')
  if (parts.length === 2 && method === 'GET') return project
  if (parts[2] === 'manifest' && method === 'GET') return clone(manifest)
  if (parts[2] === 'media' && method === 'GET') return []
  if (parts[2] !== 'pages') return failure('Эта функция недоступна в демо')
  if (parts.length === 3 && method === 'GET') return clone(active)
  if (parts[3] === 'trash' && method === 'GET') return clone(state.pages.filter(page => page.deletedAt).map(page => ({ ...page, deletedBy: author })))
  if (parts.length === 3 && method === 'POST') {
    const slug = `/${String(body.slug ?? '').replace(/^\/+/, '')}`
    if (state.pages.some(page => page.slug === slug)) return failure('Страница с таким адресом уже существует')
    const page = makePage(crypto.randomUUID(), slug, String((body.meta as { title?: string } | undefined)?.title ?? 'Новая страница'))
    page.blocks = []
    page.updatedAt = new Date().toISOString()
    state.pages.push(page)
    state.revisions[page.id] = [revision(page)]
    save(state)
    return clone(page)
  }
  const page = state.pages.find(item => item.id === parts[3])
  if (!page) return failure('Страница не найдена')
  if (parts.length === 4 && method === 'GET') return clone(page)
  if (parts.length === 4 && method === 'PUT') {
    if (body.version !== page.version) return failure('Версия страницы изменилась')
    page.draft = { blocks: (body.blocks ?? []) as PageDetail['blocks'], meta: (body.meta ?? null) as PageDetail['meta'], header: (body.header ?? null) as PageDetail['header'], footer: (body.footer ?? null) as PageDetail['footer'], noFooterSpacing: Boolean(body.noFooterSpacing), updatedAt: new Date().toISOString(), author }
    save(state)
    return clone(page)
  }
  if (parts[4] === 'publish' && method === 'POST') {
    if (!page.draft || body.version !== page.version) return failure('Нет черновика или версия изменилась')
    Object.assign(page, { blocks: page.draft.blocks, meta: page.draft.meta, header: page.draft.header, footer: page.draft.footer, noFooterSpacing: page.draft.noFooterSpacing, updatedAt: new Date().toISOString(), version: page.version + 1, draft: null })
    ;(state.revisions[page.id] ??= []).unshift(revision(page))
    save(state)
    return clone(page)
  }
  if (parts[4] === 'draft' && method === 'DELETE') { page.draft = null; save(state); return clone(page) }
  if (parts[4] === 'revisions' && method === 'GET') {
    const revisions = state.revisions[page.id] ?? []
    return clone(parts[5] ? revisions.find(item => item.version === Number(parts[5])) ?? failure('Версия не найдена') : revisions)
  }
  if (parts.length === 4 && method === 'DELETE') { page.deletedAt = new Date().toISOString(); save(state); return null }
  if (parts[4] === 'restore' && method === 'POST') { page.deletedAt = null; save(state); return clone(page) }
  if (parts[4] === 'purge' && method === 'DELETE') { state.pages = state.pages.filter(item => item.id !== page.id); delete state.revisions[page.id]; save(state); return null }
  return failure('Эта функция недоступна в демо')
}
