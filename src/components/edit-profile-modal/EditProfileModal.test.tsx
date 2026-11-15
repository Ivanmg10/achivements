import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'
import EditProfileModal from './EditProfileModal'
import { notify } from '@/lib/notify'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const update = jest.fn()
function fill(field: 'name' | 'email', value: string) {
  const texts = en.editProfileModal.fields[field]
  fireEvent.change(screen.getByLabelText(texts.newLabel), { target: { value } })
  if ('confirmLabel' in texts) fireEvent.change(screen.getByLabelText(texts.confirmLabel), { target: { value } })
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


test('the title is the field own sentence, not a verb glued to a noun', () => {
  render(<EditProfileModal isOpen onClose={jest.fn()} field="name" currentValue="ivan" />)
  expect(screen.getByRole('dialog', { name: en.editProfileModal.fields.name.title })).toBeInTheDocument()
})

test('only the email is asked twice, never the username', () => {
  const { unmount } = render(<EditProfileModal isOpen onClose={jest.fn()} field="name" currentValue="ivan" />)
  expect(screen.getAllByRole('textbox')).toHaveLength(1)
  unmount()
  render(<EditProfileModal isOpen onClose={jest.fn()} field="email" currentValue="a@b.c" />)
  expect(screen.getAllByRole('textbox')).toHaveLength(2)
})

test('saving toasts and closes at once, with no timer left behind', async () => {
  const onClose = jest.fn()
  render(<EditProfileModal isOpen onClose={onClose} field="name" currentValue="ivan" />)
  fill('name', 'ivan2')
  fireEvent.click(saveButton())
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  expect(notify.success).toHaveBeenCalledWith(en.toast.saved)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('a mismatch of the two addresses blocks saving', () => {
  render(<EditProfileModal isOpen onClose={jest.fn()} field="email" currentValue="a@b.c" />)
  fireEvent.change(screen.getByLabelText(en.editProfileModal.fields.email.newLabel), { target: { value: 'x@y.z' } })
  fireEvent.change(screen.getByLabelText(en.editProfileModal.fields.email.confirmLabel), { target: { value: 'x@y.q' } })
  fireEvent.change(screen.getByLabelText(en.changePassword.current), { target: { value: 'pass' } })
  expect(screen.getByText(en.editProfileModal.mismatch)).toBeInTheDocument()
  expect(saveButton()).toBeDisabled()
})
