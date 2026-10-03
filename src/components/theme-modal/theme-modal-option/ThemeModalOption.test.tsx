import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import ThemeModalOption from './ThemeModalOption'

test('names the theme, reports whether it is current and picks it on click', () => {
  const onSelect = jest.fn()
  render(<ThemeModalOption theme="clank" checked={false} onSelect={onSelect} />)
  const radio = screen.getByRole('radio', { name: en.userTheme.name_clank })
  expect(radio).toHaveAttribute('aria-checked', 'false')
  fireEvent.click(radio)
  expect(onSelect).toHaveBeenCalledWith('clank')
})

test('the current theme is ticked, not told by colour alone', () => {
  const { container } = render(<ThemeModalOption theme="daxter" checked onSelect={jest.fn()} />)
  expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true')
  expect(container.querySelector('svg')).not.toBeNull()
})
