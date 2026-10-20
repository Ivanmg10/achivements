import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import RankingsPageDelta from './RankingsPageDelta'

test('says up, down, same and new in words, not only colour', () => {
  const { rerender } = render(<RankingsPageDelta delta={3} />)
  expect(screen.getByText(en.rankings.up.replace('{n}', '3'))).toBeInTheDocument()
  rerender(<RankingsPageDelta delta={-2} />)
  expect(screen.getByText(en.rankings.down.replace('{n}', '2'))).toBeInTheDocument()
  rerender(<RankingsPageDelta delta={0} />)
  expect(screen.getByLabelText(en.rankings.same)).toBeInTheDocument()
  rerender(<RankingsPageDelta delta={null} />)
  expect(screen.getByText(en.rankings.isNew)).toBeInTheDocument()
})
