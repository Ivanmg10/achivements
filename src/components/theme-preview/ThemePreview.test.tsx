import { render } from '@testing-library/react'
import ThemePreview from './ThemePreview'

test('scopes the theme tokens to itself and stays out of the accessibility tree', () => {
  const { container } = render(<ThemePreview theme="green" />)
  const root = container.firstElementChild!
  expect(root).toHaveAttribute('data-theme', 'green')
  expect(root).toHaveAttribute('aria-hidden', 'true')
})
