import { render, screen, fireEvent, within } from '@testing-library/react'
import AchievementDetailModal from './AchievementDetailModal'
import { en } from '@/translations/en'

const BASE = {
  title: 'Old Fashioned',
  description: 'Find the bayonet',
  iconUrl: 'https://i.png',
  earned: false,
  earnedAt: null,
  rarity: 4.25,
  guides: [{ kind: 'youtube' as const, href: 'https://www.youtube.com/results?search_query=x' }],
}

test('a locked one: its text, rarity, "not earned yet" and the guide links, opening apart', () => {
  render(<AchievementDetailModal {...BASE} onClose={jest.fn()} />)
  const dialog = screen.getByRole('dialog', { name: 'Old Fashioned' })
  expect(dialog).toHaveAttribute('aria-modal', 'true')
  expect(within(dialog).getByText('Find the bayonet')).toBeInTheDocument()
  expect(within(dialog).getByText('4.3%')).toBeInTheDocument()
  expect(within(dialog).getByText(en.achievementDetail.notEarned)).toBeInTheDocument()
  const link = within(dialog).getByRole('link', { name: en.achievementDetail.youtube })
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

test('an earned one says so, with its date', () => {
  render(<AchievementDetailModal {...BASE} earned earnedAt="2026-01-02T10:00:00Z" onClose={jest.fn()} />)
  expect(screen.getByText(en.achievementDetail.earned)).toBeInTheDocument()
  expect(screen.getByText(/2026/)).toBeInTheDocument()
})

test('no guide section without links, and tags when given', () => {
  render(<AchievementDetailModal {...BASE} guides={[]} tags={<span>Gold</span>} onClose={jest.fn()} />)
  expect(screen.queryByText(en.achievementDetail.findGuide)).toBeNull()
  expect(screen.getByText('Gold')).toBeInTheDocument()
})

test('closes with its button, Escape and the backdrop, but not a click inside', () => {
  const onClose = jest.fn()
  render(<AchievementDetailModal {...BASE} onClose={onClose} />)
  fireEvent.click(screen.getByText('Find the bayonet'))
  expect(onClose).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: en.achievementDetail.close }))
  fireEvent.keyDown(document, { key: 'Escape' })
  fireEvent.click(screen.getByRole('dialog').parentElement!)
  expect(onClose).toHaveBeenCalledTimes(3)
})

test('takes focus when it opens', () => {
  render(<AchievementDetailModal {...BASE} onClose={jest.fn()} />)
  expect(screen.getByRole('dialog')).toHaveFocus()
})

test('pins from inside when the viewer can, and not otherwise', () => {
  const onTogglePin = jest.fn()
  const { rerender } = render(<AchievementDetailModal {...BASE} pinned={false} onTogglePin={onTogglePin} onClose={jest.fn()} />)
  fireEvent.click(screen.getByRole('button', { pressed: false }))
  expect(onTogglePin).toHaveBeenCalled()
  rerender(<AchievementDetailModal {...BASE} onClose={jest.fn()} />)
  expect(screen.queryByRole('button', { pressed: false })).toBeNull()
})

test('opens in the body, out of any section that could cover it', () => {
  const host = document.body.appendChild(document.createElement('div'))
  render(<AchievementDetailModal {...BASE} onClose={jest.fn()} />, { container: host })
  expect(host).not.toContainElement(screen.getByRole('dialog'))
  expect(screen.getByRole('dialog').closest('.fixed')?.parentElement).toBe(document.body)
})
