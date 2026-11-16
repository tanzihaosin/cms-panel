import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageDetail, PageRevisionDetail } from '@crito/contract'

describe('демонстрационный API', () => {
  beforeEach(() => {
    vi.resetModules()
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    })
  })

  it('сохраняет черновик, публикует его и восстанавливает данные после перезагрузки', async () => {
    let { demoApi } = await import('../app/utils/demoApi')
    const original = await demoApi('/projects/rucode/pages/home') as PageDetail
    const saved = await demoApi('/projects/rucode/pages/home', { method: 'PUT', body: { version: original.version, blocks: original.blocks, meta: { title: 'Новый заголовок' } } }) as PageDetail
    expect(saved.meta?.title).toBe('Главная')
    expect(saved.draft?.meta?.title).toBe('Новый заголовок')
    const published = await demoApi('/projects/rucode/pages/home/publish', { method: 'POST', body: { version: original.version } }) as PageDetail
    expect(published.version).toBe(original.version + 1)
    expect(published.draft).toBeNull()
    vi.resetModules()
    ;({ demoApi } = await import('../app/utils/demoApi'))
    const restored = await demoApi('/projects/rucode/pages/home') as PageDetail
    expect(restored.meta?.title).toBe('Новый заголовок')
    const history = await demoApi('/projects/rucode/pages/home/revisions') as PageRevisionDetail[]
    expect(history.map(item => item.version)).toEqual([2, 1])
  })

  it('перемещает страницу в корзину и возвращает её', async () => {
    const { demoApi } = await import('../app/utils/demoApi')
    await demoApi('/projects/rucode/pages/home', { method: 'DELETE' })
    expect((await demoApi('/projects/rucode/pages') as PageDetail[]).some(page => page.id === 'home')).toBe(false)
    expect((await demoApi('/projects/rucode/pages/trash') as PageDetail[]).some(page => page.id === 'home')).toBe(true)
    await demoApi('/projects/rucode/pages/home/restore', { method: 'POST' })
    expect((await demoApi('/projects/rucode/pages') as PageDetail[]).some(page => page.id === 'home')).toBe(true)
  })
})
