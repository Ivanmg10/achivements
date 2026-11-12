import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import RankingsPageRank from './RankingsPageRank'

test('a place held alone is the bare number', () => {
  const { container } = render(<RankingsPageRank rank={5} />)
  expect(container).toHaveTextContent(/^5$/)
})

test('a shared place reads "3=" and says it is tied to a screen reader', () => {
  const { container } = render(<RankingsPageRank rank={3} tied />)
  expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('=')
  expect(screen.getByText(en.rankings.tied)).toHaveClass('sr-only')
})
