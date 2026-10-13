import { render, screen } from '@testing-library/react'
import GameCompareTableSummary from './GameCompareTableSummary'
import { en } from '@/translations/en'

const SUMMARY = { all: 4, both: 1, onlyThem: 1, onlyMe: 1, neither: 1, theirs: 4, mine: 2 }

test('each of you as count and share; the finished one in the done colour', () => {
  render(<GameCompareTableSummary summary={SUMMARY} username="ivan" comparing />)
  expect(screen.getByText('4/4 · 100%')).toHaveClass('text-success')
  expect(screen.getByText('2/4 · 50%')).not.toHaveClass('text-success')
  expect(screen.getByText(en.userGame.inCommon.replace('{n}', '1'))).toBeInTheDocument()
})

test('alone, only theirs; an empty game is 0%', () => {
  render(<GameCompareTableSummary summary={{ ...SUMMARY, all: 0, theirs: 0 }} username="ivan" comparing={false} />)
  expect(screen.getByText('0/0 · 0%')).toBeInTheDocument()
  expect(screen.queryByText(en.userProfile.you)).not.toBeInTheDocument()
})
