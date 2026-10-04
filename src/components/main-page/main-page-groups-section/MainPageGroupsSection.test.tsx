import { fireEvent, render, screen } from '@testing-library/react'
import MainPageGroupsSection from './MainPageGroupsSection'
import { useGroups } from '@/hooks/useGroups'

jest.mock('@/hooks/useGroups', () => ({ useGroups: jest.fn() }))
jest.mock('@/components/main-page/main-page-group-feature/MainPageGroupFeature', () => ({
  __esModule: true,
  default: ({ group }: { group: { title: string } }) => <div data-testid="feature">{group.title}</div>,
}))
jest.mock('@/components/main-page/main-page-charts/MainPageGroups', () => ({
  __esModule: true,
  default: ({ onSelect, selectedId }: { onSelect: (id: number) => void; selectedId: number | null }) => (
    <div>
      <span data-testid="selected">{String(selectedId)}</span>
      <button onClick={() => onSelect(2)}>pick 2</button>
    </div>
  ),
}))

const groups = [
  { id: 1, title: 'Pokémon' },
  { id: 2, title: 'Pendientes' },
]

test('opens on the first group, in the user’s order', () => {
  ;(useGroups as jest.Mock).mockReturnValue({ groups })
  render(<MainPageGroupsSection />)
  expect(screen.getByTestId('feature')).toHaveTextContent('Pokémon')
  expect(screen.getByTestId('selected')).toHaveTextContent('1')
})

test('picking another group in the list shows it in full', () => {
  ;(useGroups as jest.Mock).mockReturnValue({ groups })
  render(<MainPageGroupsSection />)
  fireEvent.click(screen.getByRole('button', { name: 'pick 2' }))
  expect(screen.getByTestId('feature')).toHaveTextContent('Pendientes')
  expect(screen.getByTestId('selected')).toHaveTextContent('2')
})

test('no groups: only the list, to create the first one', () => {
  ;(useGroups as jest.Mock).mockReturnValue({ groups: [] })
  render(<MainPageGroupsSection />)
  expect(screen.queryByTestId('feature')).not.toBeInTheDocument()
  expect(screen.getByTestId('selected')).toHaveTextContent('null')
})
