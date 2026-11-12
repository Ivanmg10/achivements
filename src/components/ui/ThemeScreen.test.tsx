import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import { themeCovers } from '@/utils/themeGames'
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

test('a tribute shows its own games; any other theme those of the art wall', () => {
  const { container, rerender } = render(<ThemeScreen theme="black-ops-2" />)
  const srcs = () => [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'))
  expect(srcs()).toEqual(themeCovers('black-ops-2'))
  rerender(<ThemeScreen theme="sakura" />)
  expect(srcs()).toEqual(themeCovers('dark'))
})
