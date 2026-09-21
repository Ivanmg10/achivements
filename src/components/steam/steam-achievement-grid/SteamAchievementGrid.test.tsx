import { render, screen, fireEvent, act } from '@testing-library/react'
import { SteamAchievementGrid, achievementAnchor } from './SteamAchievementGrid'
import { en } from '@/translations/en'
import type { SteamAchievementUnified } from '@/types/steam'

function ach(overrides: Partial<SteamAchievementUnified> = {}): SteamAchievementUnified {
  return {
    _source: 'steam',
    id: 'WIN',
    apiname: 'WIN',
    title: 'Win a Match',
    description: 'Win your first match',
    earned: false,
    dateEarned: null,
    badgeUrl: 'icon.jpg',
    displayOrder: 0,
    hidden: false,
    globalPct: null,
    ...overrides,
  }
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

test('each badge links to its achievement on the game page', () => {
  render(<SteamAchievementGrid appId={620} achievements={[ach()]} />)
  const link = screen.getByRole('link')
  expect(link.getAttribute('href')).toBe(`/steamGame/620#${achievementAnchor('WIN')}`)
  expect(achievementAnchor('WIN')).toBe('ach-WIN')
})

test('an earned badge is in colour with a ring, and says so in its name', () => {
  const { container } = render(<SteamAchievementGrid appId={620} achievements={[ach({ earned: true })]} />)
  const link = screen.getByRole('link', { name: `Win a Match — ${en.steam.earned}` })
  expect(link.className).toContain('ring-2')
  expect(container.querySelector('img')?.className).not.toContain('grayscale')
})

test('a locked badge is the colour badge greyed out, RA style, and says so in its name', () => {
  const { container } = render(<SteamAchievementGrid appId={620} achievements={[ach()]} />)
  const link = screen.getByRole('link', { name: `Win a Match — ${en.steam.locked}` })
  expect(link.className).not.toContain('ring-2 ring-')
  const img = container.querySelector('img')!
  expect(img.getAttribute('src')).toBe('icon.jpg')
  expect(img.className).toContain('grayscale')
  expect(img.className).toContain('opacity-40')
  // Decorative: the link carries the name.
  expect(img.getAttribute('alt')).toBe('')
})

test('falls back to a placeholder when a badge has no image', () => {
  const { container } = render(<SteamAchievementGrid appId={620} achievements={[ach({ badgeUrl: '' })]} />)
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('div[aria-hidden="true"]')).not.toBeNull()
})

test('supports the smaller 40px size', () => {
  const { container } = render(<SteamAchievementGrid appId={620} achievements={[ach()]} badgeSize={40} />)
  expect(container.querySelector('img')?.className).toContain('w-10')
})

describe('tooltip', () => {
  test('appears after a short hover delay with the details', () => {
    render(
      <SteamAchievementGrid
        appId={620}
        achievements={[ach({ earned: true, dateEarned: '2024-01-15T12:00:00.000Z', globalPct: 12.34 })]}
      />,
    )
    fireEvent.mouseEnter(screen.getByRole('link'), { clientX: 10, clientY: 10 })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    act(() => { jest.advanceTimersByTime(450) })
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('Win a Match')
    expect(tip).toHaveTextContent('Win your first match')
    expect(tip).toHaveTextContent(`12.3${en.achievement.haveIt}`)
    expect(tip).toHaveTextContent(en.steam.earned)
    expect(tip).toHaveTextContent('15 Jan 2024')
  })

  test('says not earned, and omits rarity when Steam gave none', () => {
    render(<SteamAchievementGrid appId={620} achievements={[ach()]} />)
    fireEvent.mouseEnter(screen.getByRole('link'), { clientX: 0, clientY: 0 })
    act(() => { jest.advanceTimersByTime(450) })

    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent(en.achievement.notEarned)
    expect(tip).not.toHaveTextContent(en.achievement.haveIt)
  })

  test('shows at once on keyboard focus and hides on blur', () => {
    render(<SteamAchievementGrid appId={620} achievements={[ach()]} />)
    const link = screen.getByRole('link')

    act(() => { link.focus() })
    act(() => { jest.advanceTimersByTime(0) })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    act(() => { link.blur() })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('hides on mouse leave, including before the delay elapses', () => {
    render(<SteamAchievementGrid appId={620} achievements={[ach()]} />)
    const link = screen.getByRole('link')

    fireEvent.mouseEnter(link, { clientX: 0, clientY: 0 })
    fireEvent.mouseLeave(link)
    act(() => { jest.advanceTimersByTime(1000) })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('hidden achievements', () => {
  test('keep their text concealed until earned — in the name and the tooltip', () => {
    render(<SteamAchievementGrid appId={620} achievements={[ach({ hidden: true, title: 'Spoiler', description: 'The ending' })]} />)
    const link = screen.getByRole('link', { name: `${en.steam.hiddenAchievement} — ${en.steam.locked}` })

    fireEvent.mouseEnter(link, { clientX: 0, clientY: 0 })
    act(() => { jest.advanceTimersByTime(450) })
    const tip = screen.getByRole('tooltip')
    expect(tip).not.toHaveTextContent('Spoiler')
    expect(tip).not.toHaveTextContent('The ending')
    expect(tip).toHaveTextContent(en.steam.hiddenAchievementDesc)
  })

  test('are revealed once earned', () => {
    render(<SteamAchievementGrid appId={620} achievements={[ach({ hidden: true, title: 'Spoiler', earned: true })]} />)
    expect(screen.getByRole('link', { name: `Spoiler — ${en.steam.earned}` })).toBeInTheDocument()
  })
})
