import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import ThemeScreen from './ThemeScreen'

test('draws in the theme it shows, scoped to itself and out of the accessibility tree', () => {
  const { container } = render(<ThemeScreen theme="snake-eater" />)
  const root = container.firstElementChild!
  expect(root).toHaveAttribute('data-theme', 'snake-eater')
  expect(root).toHaveAttribute('aria-hidden', 'true')
  expect(screen.queryByText(en.userTheme.on)).not.toBeInTheDocument()
})

test('the theme in use says so in a word and a tick, not by colour alone', () => {
  const { container } = render(<ThemeScreen theme="dark" on />)
  expect(screen.getByText(en.userTheme.on)).toBeInTheDocument()
  expect(container.querySelector('[data-testid="IconCheck"]')).not.toBeNull()
})
