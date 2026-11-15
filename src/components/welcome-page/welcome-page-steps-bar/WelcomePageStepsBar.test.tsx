import { fireEvent, render, screen, within } from '@testing-library/react'
import { en } from '@/translations/en'
import WelcomePageStepsBar, { type WelcomeStepState } from './WelcomePageStepsBar'

const T = en.welcome
const STATES: WelcomeStepState[] = ['done', 'linked', 'later', 'current', 'pending', 'pending', 'pending']

function renderBar() {
  const props = { onGo: jest.fn(), onBack: jest.fn(), onSkipAll: jest.fn() }
  render(<WelcomePageStepsBar index={3} seen={3} states={STATES} {...props} />)
  return props
}

test('each pill says its step and how it is, not by colour alone', () => {
  renderBar()
  const nav = screen.getByRole('navigation', { name: T.stepsLabel })
  expect(within(nav).getByRole('button', { name: `${T.steps.intro}, ${T.state.done}` })).toBeEnabled()
  expect(within(nav).getByRole('button', { name: `${T.steps.ra}, ${T.state.linked}` })).toBeEnabled()
  expect(within(nav).getByRole('button', { name: `${T.steps.steam}, ${T.state.later}` })).toBeEnabled()
  expect(within(nav).getByRole('button', { name: `${T.steps.psn}, ${T.state.current}` })).toHaveAttribute('aria-current', 'step')
  expect(within(nav).getByRole('button', { name: `${T.steps.profile}, ${T.state.pending}` })).toBeDisabled()
})

test('a pill goes to its step; skip all and back are there on a phone too', () => {
  const { onGo, onBack, onSkipAll } = renderBar()
  fireEvent.click(screen.getByRole('button', { name: `${T.steps.ra}, ${T.state.linked}` }))
  expect(onGo).toHaveBeenCalledWith(1)
  fireEvent.click(screen.getByRole('button', { name: T.back }))
  expect(onBack).toHaveBeenCalled()
  fireEvent.click(screen.getAllByRole('button', { name: T.skipAll })[0])
  expect(onSkipAll).toHaveBeenCalled()
})

test('announces the step once', () => {
  renderBar()
  expect(screen.getByRole('status')).toHaveTextContent(`Step 4 of 8 · ${T.steps.psn}`)
})

test('the phone progress has a segment per step, however many there are (C-13)', () => {
  const { container } = render(<WelcomePageStepsBar index={0} seen={0} states={STATES} onGo={jest.fn()} onBack={jest.fn()} onSkipAll={jest.fn()} />)
  const strip = container.querySelector('ol[aria-hidden="true"]')!
  expect(strip.className).not.toMatch(/grid-cols-\d/)
  expect(strip.children.length).toBeGreaterThan(0)
  for (const segment of Array.from(strip.children)) expect(segment.className).toContain('flex-1')
})
