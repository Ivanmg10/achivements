import { fireEvent, render, screen } from '@testing-library/react'
import DesignCatalogEntrances from './DesignCatalogEntrances'

test('shows each family on real pieces', () => {
  const { container } = render(<DesignCatalogEntrances />)
  for (const cls of ['.enter-rows', '.enter-cards', '.enter-rise', '.enter-grow-y']) {
    expect(container.querySelector(cls)).not.toBeNull()
  }
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
})

test('"Play again" mounts them anew, so they play', () => {
  const { container } = render(<DesignCatalogEntrances />)
  const before = container.querySelector('.enter-rows')
  fireEvent.click(screen.getByRole('button', { name: 'Play again' }))
  expect(container.querySelector('.enter-rows')).not.toBe(before)
})
