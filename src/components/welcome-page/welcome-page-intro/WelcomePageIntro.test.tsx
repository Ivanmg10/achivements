import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import WelcomePageIntro from './WelcomePageIntro'

const t = en.welcome.intro
const W = en.welcome

function renderIntro() {
  const onNext = jest.fn()
  render(<WelcomePageIntro onNext={onNext} direction="none" focusTitle={false} />)
  return onNext
}

const card = (i: number) => screen.getByRole('button', { name: new RegExp(t.perks[i].title) })
const opened = () => screen.getByRole('heading', { level: 2 })

test('thanks the person for choosing CheevoVault, and lists the five points', () => {
  renderIntro()
  expect(screen.getByText(t.body)).toBeInTheDocument()
  expect(t.body).toMatch(/CheevoVault/)
  for (const perk of t.perks) expect(screen.getByText(perk.title)).toBeInTheDocument()
})

test('a point opens over the whole step, with its full explanation and highlights', () => {
  renderIntro()
  fireEvent.click(card(2))
  expect(opened()).toHaveTextContent(t.perks[2].title)
  expect(opened()).toHaveFocus()
  expect(screen.getByText(t.perks[2].detail)).toBeInTheDocument()
  for (const line of t.perks[2].highlights) expect(screen.getByText(line)).toBeInTheDocument()
  expect(screen.getByText(W.pointCount.replace('{n}', '3').replace('{total}', '5'))).toBeInTheDocument()
  expect(screen.getByText(W.artNote)).toBeInTheDocument()
  // The step's own title and the other cards give way to it.
  expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
})

test('the arrows go through the points, and stop at the ends', () => {
  renderIntro()
  fireEvent.click(card(0))
  expect(screen.getByRole('button', { name: W.prevPoint })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: W.nextPoint }))
  expect(opened()).toHaveTextContent(t.perks[1].title)
  for (let i = 1; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: W.nextPoint }))
  expect(opened()).toHaveTextContent(t.perks[4].title)
  expect(screen.getByRole('button', { name: W.nextPoint })).toBeDisabled()
})

test('back, or Escape, shrinks it into its card again, which takes the focus', () => {
  renderIntro()
  fireEvent.click(card(3))
  fireEvent.click(screen.getByRole('button', { name: W.back }))
  expect(screen.getByRole('heading', { level: 1, name: t.title })).toBeInTheDocument()
  expect(card(3)).toHaveFocus()

  fireEvent.click(card(1))
  fireEvent.keyDown(opened(), { key: 'Escape' })
  expect(card(1)).toHaveFocus()
})

test('start goes on, from the list or from an opened point', () => {
  const onNext = renderIntro()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${W.start}`) }))
  fireEvent.click(card(0))
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${W.start}`) }))
  expect(onNext).toHaveBeenCalledTimes(2)
})

test('every point has its sketch', () => {
  renderIntro()
  for (let i = 0; i < t.perks.length; i++) {
    if (i === 0) fireEvent.click(card(0))
    else fireEvent.click(screen.getByRole('button', { name: W.nextPoint }))
    const sketch = document.querySelector('figure [aria-hidden="true"]')
    expect(sketch?.childElementCount).toBe(1)
  }
})
