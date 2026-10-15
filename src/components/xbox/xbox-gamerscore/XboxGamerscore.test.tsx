import { render, screen } from '@testing-library/react'
import XboxGamerscore from './XboxGamerscore'
import { en } from '@/translations/en'

test('earned of total, with the G named for assistive tech', () => {
  render(<XboxGamerscore earned={1250} total={5000} />)
  expect(screen.getByText('1,250')).toBeInTheDocument()
  expect(screen.getByText('/5,000')).toBeInTheDocument()
  expect(screen.getByText(en.xbox.gamerscore)).toHaveClass('sr-only')
  expect(screen.getByTitle(en.xbox.gamerscore)).toBeInTheDocument()
})

test('without a total, just what is earned', () => {
  const { container } = render(<XboxGamerscore earned={0} />)
  expect(container.textContent).toContain('0')
  expect(container.textContent).not.toContain('/')
})
