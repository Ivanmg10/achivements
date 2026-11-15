import { fireEvent, render, screen, within } from '@testing-library/react'
import AchievementModal from '@/components/achievement-modal/AchievementModal'
import AchievementDetailModal from '@/components/achievement-detail-modal/AchievementDetailModal'
import type { RetroAchievement } from '@/types/types'
import { en } from '@/translations/en'

// One window for every platform: RA's AchievementModal and the detail window Steam, PSN and Xbox share are adapters
// of the same shell. Each builder renders its adapter from the same platform-neutral spec; the suite tests what a
// person sees and does.
type Spec = { title: string; description: string; earnedAt: string | null; rarity: number }

const SPEC: Spec = { title: 'First Blood', description: 'Kill an enemy', earnedAt: null, rarity: 25 }
const EARNED = '2025-01-02 10:00:00'

const detail = (tags: React.ReactNode) => (spec: Spec, onClose: () => void) => (
  <AchievementDetailModal
    title={spec.title}
    description={spec.description}
    iconUrl="https://cdn.test/badge.jpg"
    earned={!!spec.earnedAt}
    earnedAt={spec.earnedAt}
    rarity={spec.rarity}
    tags={tags}
    guides={[{ kind: 'youtube', href: 'https://www.youtube.com/results?search_query=x' }]}
    onClose={onClose}
  />
)

const PLATFORMS: { name: string; build: (spec: Spec, onClose: () => void) => React.ReactElement }[] = [
  {
    name: 'ra',
    build: (spec, onClose) => (
      <AchievementModal
        achievement={
          {
            ID: 7, Title: spec.title, Description: spec.description, BadgeName: 'b1', Points: 10, TrueRatio: 15,
            NumAwarded: spec.rarity * 10, NumAwardedHardcore: 1, DateEarned: spec.earnedAt, DateEarnedHardcore: null,
            Author: 'someone', DisplayOrder: 1, Type: null,
          } as RetroAchievement
        }
        numDistinctPlayers={1000}
        onClose={onClose}
      />
    ),
  },
  { name: 'steam', build: detail(<span>Online</span>) },
  { name: 'psn', build: detail(<span>Gold</span>) },
  { name: 'xbox', build: detail(<span>50 G</span>) },
]

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
})

describe.each(PLATFORMS)('the achievement window ($name)', ({ build }) => {
  test('is a dialog named by the achievement, its description as the hint, with the focus inside', () => {
    render(build(SPEC, jest.fn()))
    const dialog = screen.getByRole('dialog', { name: 'First Blood' })
    expect(dialog).toHaveAccessibleDescription('Kill an enemy')
    expect(dialog).toHaveFocus()
  })

  test('has the Modal\'s head only: one title, no second head drawn inside the body', () => {
    render(build(SPEC, jest.fn()))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getAllByRole('heading', { level: 2 })).toHaveLength(1)
  })

  test('shows how rare it is as a figure with its label', () => {
    render(build(SPEC, jest.fn()))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(en.achievement.rarity)).toBeInTheDocument()
    expect(within(dialog).getByText(/^25(\.0)?%$/)).toBeInTheDocument()
  })

  test('says when it was earned once it is', () => {
    render(build({ ...SPEC, earnedAt: EARNED }, jest.fn()))
    // A past year, so the one date format shows it every year.
    expect(screen.getByText(/Jan 2, 2025/)).toBeInTheDocument()
  })

  test('closes with its corner button, Escape and the backdrop, not with a click inside', () => {
    const onClose = jest.fn()
    render(build(SPEC, onClose))
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})

describe.each(PLATFORMS.filter((p) => p.name !== 'ra'))('the detail window ($name)', ({ build }) => {
  test('guide links are library buttons that open apart', () => {
    render(build(SPEC, jest.fn()))
    const link = screen.getByRole('link', { name: en.achievementDetail.youtube })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('a rarity nobody can tell is left out, not shown as a dash', () => {
    render(
      <AchievementDetailModal
        title="Secret" description="" iconUrl={null} earned={false} earnedAt={null} rarity={null} guides={[]} onClose={jest.fn()}
      />,
    )
    const dialog = screen.getByRole('dialog', { name: 'Secret' })
    expect(within(dialog).queryByText(en.achievementDetail.rarity)).not.toBeInTheDocument()
    expect(within(dialog).getByText(en.achievementDetail.notEarned)).toBeInTheDocument()
  })
})
