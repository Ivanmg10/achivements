import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'
import EditProfileModal from './EditProfileModal'

const update = jest.fn()
const label = (field: 'name' | 'email' | 'avatar') => en.editProfileModal.fields[field]

function fill(field: 'name' | 'email' | 'avatar', value: string) {
  fireEvent.change(screen.getByLabelText(`${en.editProfileModal.newLabel} ${label(field)}`), { target: { value } })
  fireEvent.change(screen.getByLabelText(`${en.editProfileModal.confirmLabel} ${label(field)}`), { target: { value } })
}

const saveButton = () => screen.getByRole('button', { name: en.editProfileModal.save })

beforeEach(() => {
  jest.clearAllMocks()
  update.mockResolvedValue(null)
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, update })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) })
})

describe('email', () => {
  test('asks for the current password, and cannot be saved without it', () => {
    render(<EditProfileModal isOpen onClose={jest.fn()} field="email" currentValue="old@test.com" />)
    fill('email', 'new@test.com')
    expect(screen.getByLabelText(en.changePassword.current)).toHaveAttribute('type', 'password')
    expect(saveButton()).toBeDisabled()
  })

  test('sends the password with the new address, then re-reads the session', async () => {
    render(<EditProfileModal isOpen onClose={jest.fn()} field="email" currentValue="old@test.com" />)
    fill('email', 'new@test.com')
    fireEvent.change(screen.getByLabelText(en.changePassword.current), { target: { value: 'pass' } })
    fireEvent.click(saveButton())

    await waitFor(() => expect(update).toHaveBeenCalledWith())
    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(JSON.parse(init.body)).toEqual({ field: 'email', value: 'new@test.com', currentPassword: 'pass' })
  })

  test('a wrong password is explained and nothing is refreshed', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'wrong-password' }) })
    render(<EditProfileModal isOpen onClose={jest.fn()} field="email" currentValue="old@test.com" />)
    fill('email', 'new@test.com')
    fireEvent.change(screen.getByLabelText(en.changePassword.current), { target: { value: 'nope' } })
    fireEvent.click(saveButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(en.changePassword.wrongPassword)
    expect(update).not.toHaveBeenCalled()
  })
})

test('other fields do not ask for a password or send one', async () => {
  render(<EditProfileModal isOpen onClose={jest.fn()} field="name" currentValue="ivan" />)
  expect(screen.queryByLabelText(en.changePassword.current)).toBeNull()
  fill('name', 'ivan2')
  fireEvent.click(saveButton())

  await waitFor(() => expect(update).toHaveBeenCalledWith())
  const [, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(JSON.parse(init.body)).toEqual({ field: 'username', value: 'ivan2' })
})

test('an http avatar gets no preview; only https ones do', () => {
  render(<EditProfileModal isOpen onClose={jest.fn()} field="avatar" currentValue="" />)
  fill('avatar', 'http://x.test/a.png')
  expect(screen.queryByAltText(en.editProfileModal.avatarPreview)).toBeNull()
  fill('avatar', 'https://x.test/a.png')
  expect(screen.getByAltText(en.editProfileModal.avatarPreview)).toBeInTheDocument()
})
