import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import RegisterUserFormRa from './RegisterUserFormRa'
import { useRaSignupCheck } from '@/hooks/useRaSignupCheck'
import { en } from '@/translations/en'

jest.mock('@/hooks/useRaSignupCheck', () => ({ useRaSignupCheck: jest.fn() }))

const check = jest.fn()
const ACCOUNT = { username: 'palmeramiami', apiKey: 'key', user: 'PalmeraMiami', avatar: 'https://media.retroachievements.org/UserPic/PalmeraMiami.png' }

function setup(account: typeof ACCOUNT | null = null, hook: Record<string, unknown> = {}) {
  ;(useRaSignupCheck as jest.Mock).mockReturnValue({ check, checking: false, error: null, clearError: jest.fn(), ...hook })
  const onChange = jest.fn()
  const onClose = jest.fn()
  render(<RegisterUserFormRa account={account} onChange={onChange} onClose={onClose} disabled={false} />)
  return { onChange, onClose }
}

beforeEach(() => jest.clearAllMocks())

test('asks for the RA username and key, says where the key is, and checks it', async () => {
  check.mockResolvedValue(ACCOUNT)
  const { onChange } = setup()

  expect(screen.getByRole('heading', { name: en.registerForm.raTitle })).toBeInTheDocument()
  expect(screen.getByText(en.welcome.ra.guide[1])).toBeInTheDocument()
  expect(screen.getByRole('link', { name: new RegExp(en.welcome.ra.openRa) })).toHaveAttribute('href', 'https://retroachievements.org/settings')

  const button = screen.getByRole('button', { name: en.registerForm.raCheck })
  expect(button).toBeDisabled()
  fireEvent.change(screen.getByLabelText(en.registerForm.raUsername), { target: { value: ' palmeramiami ' } })
  fireEvent.change(screen.getByLabelText(en.registerForm.raKey), { target: { value: 'key' } })
  fireEvent.click(button)

  await waitFor(() => expect(onChange).toHaveBeenCalledWith(ACCOUNT))
  expect(check).toHaveBeenCalledWith('palmeramiami', 'key')
})

test('a refusal shows by the fields and nothing is linked', () => {
  const { onChange } = setup(null, { error: en.raLoginModal.invalid })
  expect(screen.getByRole('alert')).toHaveTextContent(en.raLoginModal.invalid)
  expect(onChange).not.toHaveBeenCalled()
})

test('checked: the RA account it will link, a way to change it and a way out', () => {
  const { onChange, onClose } = setup(ACCOUNT)
  expect(screen.getByText('PalmeraMiami')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent(en.registerForm.raReady)
  expect(screen.queryByLabelText(en.registerForm.raKey)).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: en.registerForm.raChange }))
  expect(onChange).toHaveBeenCalledWith(null)
  fireEvent.click(screen.getByRole('button', { name: en.registerForm.raOff }))
  expect(onClose).toHaveBeenCalled()
})
