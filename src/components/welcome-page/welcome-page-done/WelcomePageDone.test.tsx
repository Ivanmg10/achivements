import { fireEvent, render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'
import WelcomePageDone from './WelcomePageDone'

jest.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ theme: 'gruvbox', setTheme: jest.fn() }) }))

const T = en.welcome

function renderDone(linked = { ra: true, steam: false, psn: true }, user: Record<string, unknown> = {}) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, update: jest.fn() })
  const props = { onGoTo: jest.fn(), onFinish: jest.fn(), onBack: jest.fn() }
  render(<WelcomePageDone linked={linked} {...props} direction="forward" focusTitle={false} />)
  return props
}

test('with something linked: ready, what is linked, and a way back to what is not', () => {
  const { onGoTo } = renderDone()
  expect(screen.getByRole('heading', { level: 1, name: T.done.title })).toBeInTheDocument()
  expect(screen.getAllByText(T.done.linked)).toHaveLength(2)
  expect(screen.queryByRole('button', { name: `${T.done.connect}: ${T.steps.ra}` })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: `${T.done.connect}: ${T.steps.steam}` }))
  expect(onGoTo).toHaveBeenCalledWith(2)
})

test('the profile and preferences say how they were left, and can be edited', () => {
  const { onGoTo } = renderDone(undefined, { description: 'hi' })
  expect(screen.getByText(T.done.profileDone)).toBeInTheDocument()
  expect(screen.getByText(`English · ${en.userTheme.name_gruvbox}`)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: `${T.done.edit}: ${T.steps.prefs}` }))
  expect(onGoTo).toHaveBeenCalledWith(5)
})

test('with nothing linked it says it can wait; the button goes in', () => {
  const { onFinish } = renderDone({ ra: false, steam: false, psn: false })
  expect(screen.getByRole('heading', { level: 1, name: T.done.titleNone })).toBeInTheDocument()
  expect(screen.getByText(T.done.profileEmpty)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(T.goToVault) }))
  expect(onFinish).toHaveBeenCalled()
})
