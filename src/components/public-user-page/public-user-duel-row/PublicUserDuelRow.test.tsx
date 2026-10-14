import { render, screen } from '@testing-library/react'
import PublicUserDuelRow from './PublicUserDuelRow'

const leadText = (side: 'them' | 'me') => (side === 'them' ? 'ivan leads' : 'You lead')
const renderRow = (theirs: number, mine: number, format?: (n: number) => string) =>
  render(
    <ul>
      <PublicUserDuelRow label="This month" theirs={theirs} mine={mine} leadText={leadText} format={format} />
    </ul>,
  )

test('both numbers, and who leads said in words', () => {
  renderRow(30, 10)
  expect(screen.getByText('30')).toBeInTheDocument()
  expect(screen.getByText('10')).toBeInTheDocument()
  expect(screen.getByText(/ivan leads/)).toHaveClass('sr-only')
})

test('the other side can lead too, and a tie names nobody', () => {
  const { unmount } = renderRow(1, 2)
  expect(screen.getByText(/You lead/)).toBeInTheDocument()
  unmount()
  renderRow(0, 0, (n) => `${n}%`)
  expect(screen.getAllByText('0%')).toHaveLength(2)
  expect(screen.queryByText(/lead/)).not.toBeInTheDocument()
})
