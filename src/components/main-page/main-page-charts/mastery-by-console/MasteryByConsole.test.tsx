import { render, screen } from '@testing-library/react'
import MasteryByConsole, { awardsByConsole } from './MasteryByConsole'
import { en } from '@/translations/en'

const award = (id: number, consoleName: string, type = 'Mastery/Completion') => ({
  AwardedAt: '2024-01-01T00:00:00Z', AwardType: type, AwardData: id, AwardDataExtra: 1, Title: `G${id}`, ConsoleName: consoleName, ImageIcon: '',
})

test('counts each game once per console, beaten and mastered alike, most first', () => {
  expect(awardsByConsole([award(1, 'SNES'), award(1, 'SNES', 'Game Beaten'), award(2, 'SNES', 'Game Beaten'), award(3, 'Nintendo DS')])).toEqual([
    { console: 'SNES', count: 2 },
    { console: 'Nintendo DS', count: 1 },
  ])
})

test('ignores awards that are not about finishing a game', () => {
  expect(awardsByConsole([award(1, 'SNES', 'Event')])).toEqual([])
})

test('nothing finished, nothing shown', () => {
  const { container } = render(<MasteryByConsole awards={[]} />)
  expect(container).toBeEmptyDOMElement()
})

test('shows the label and a row per console', () => {
  render(<MasteryByConsole awards={[award(1, 'SNES'), award(2, 'Nintendo DS')]} />)
  expect(screen.getByText(en.cards.awardsByConsole)).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})
