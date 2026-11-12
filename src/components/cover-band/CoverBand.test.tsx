import { render } from '@testing-library/react'
import CoverBand from './CoverBand'

jest.mock('@/components/auth-collage-panel/AuthCollagePanel', () => ({ __esModule: true, default: () => <div data-testid="wall" /> }))

test('is a decoration (hidden, never in the way) around the art wall, sized by its caller', () => {
  const { container, getByTestId } = render(<CoverBand className="h-32" />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(container.firstElementChild).toHaveClass('h-32', 'pointer-events-none')
  expect(getByTestId('wall')).toBeInTheDocument()
})
