import { render, screen, fireEvent } from '@testing-library/react'
import GamePickerChip from './GamePickerChip'
import type { GameCandidate } from '@/utils/gameCandidates'

const C: GameCandidate = {
  key: 'steam:620', source: 'steam', id: 620, title: 'Portal 2', subtitle: 'Steam', imageRef: 'https://x/620.jpg',
  pctWon: 0, numAwarded: 0, maxPossible: 0, status: null,
}

test('shows the picked game and removes it on request', () => {
  const onRemove = jest.fn()
  const { container } = render(<GamePickerChip candidate={C} removeLabel="Remove Portal 2" onRemove={onRemove} />)

  expect(screen.getByText('Portal 2')).toBeInTheDocument()
  expect(container.querySelector('img')?.getAttribute('src')).toBe('https://x/620.jpg')
  fireEvent.click(screen.getByRole('button', { name: 'Remove Portal 2' }))
  expect(onRemove).toHaveBeenCalledTimes(1)
})

test('omits the icon when there is none', () => {
  const { container } = render(<GamePickerChip candidate={{ ...C, imageRef: '' }} removeLabel="x" onRemove={jest.fn()} />)
  expect(container.querySelector('img')).toBeNull()
})
