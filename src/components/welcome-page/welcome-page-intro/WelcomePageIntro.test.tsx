import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import WelcomePageIntro from './WelcomePageIntro'

const t = en.welcome.intro

function renderIntro() {
  const onNext = jest.fn()
  render(<WelcomePageIntro onNext={onNext} direction="none" focusTitle={false} />)
  return onNext
}

const head = (i: number) => screen.getByRole('button', { name: new RegExp(t.perks[i].title) })

test('thanks the person for choosing CheevoVault', () => {
  renderIntro()
  expect(screen.getByText(t.body)).toBeInTheDocument()
  expect(t.body).toMatch(/CheevoVault/)
})

test('each point opens to say more, one at a time', () => {
  renderIntro()
  expect(head(0)).toHaveAttribute('aria-expanded', 'false')
  // Closed, the detail is out of reach of the keyboard and screen readers.
  expect(screen.getByText(t.perks[0].detail).closest('[inert]')).not.toBeNull()

  fireEvent.click(head(0))
  expect(head(0)).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText(t.perks[0].detail).closest('[inert]')).toBeNull()

  fireEvent.click(head(3))
  expect(head(3)).toHaveAttribute('aria-expanded', 'true')
  expect(head(0)).toHaveAttribute('aria-expanded', 'false')

  fireEvent.click(head(3))
  expect(head(3)).toHaveAttribute('aria-expanded', 'false')
})

test('start goes on', () => {
  const onNext = renderIntro()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.welcome.start) }))
  expect(onNext).toHaveBeenCalled()
})
