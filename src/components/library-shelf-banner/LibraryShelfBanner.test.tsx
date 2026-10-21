import { render, waitFor } from '@testing-library/react'
import LibraryShelfBanner from './LibraryShelfBanner'
import { fetchShared } from '@/lib/fetchShared'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import type { LibraryEntry } from '@/utils/libraryInsights'

jest.mock('@/lib/fetchShared', () => ({ fetchShared: jest.fn() }))

const mockFetch = fetchShared as jest.Mock
const HERO = 'https://images.igdb.com/igdb/image/upload/t_1080p/hero.jpg'

const xboxEntry = () => {
  const game = xboxGameFixture()
  return { kind: 'xbox', game, key: `xbox:${game.id}`, title: game.title } as unknown as LibraryEntry
}

const img = (container: HTMLElement) => container.querySelector('img')!

describe('LibraryShelfBanner (Xbox)', () => {
  beforeEach(() => mockFetch.mockReset())

  it('shows IGDB wide art sharp once it arrives', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ heroUrl: HERO }) })
    const { container } = render(<LibraryShelfBanner entry={xboxEntry()} />)
    await waitFor(() => expect(img(container)).toHaveAttribute('src', HERO))
    expect(img(container).className).not.toMatch(/blur/)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/xbox/details?id='))
  })

  it('keeps the blurred tile when IGDB has no match', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })
    const { container } = render(<LibraryShelfBanner entry={xboxEntry()} />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(img(container).getAttribute('src')).toBe(xboxGameFixture().imageIcon)
    expect(img(container).className).toMatch(/blur/)
  })
})
