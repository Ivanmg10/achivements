import { render, screen } from '@testing-library/react'
import StatusPageHeader from './StatusPageHeader'

test('the title, the category chip for a console, and how many games', () => {
  render(<StatusPageHeader category="playing" consoleName="SNES" gameCount={3} />)
  expect(screen.getByRole('heading', { name: 'SNES' })).toBeInTheDocument()
  expect(screen.getByText('In progress')).toBeInTheDocument()
  expect(screen.getByText('3 games')).toBeInTheDocument()
})

test('what is given goes beside the title', () => {
  render(
    <StatusPageHeader category="completed" gameCount={1}>
      <span data-testid="beside">tabs</span>
    </StatusPageHeader>,
  )
  const title = screen.getByRole('heading')
  expect(title.parentElement).toContainElement(screen.getByTestId('beside'))
})
