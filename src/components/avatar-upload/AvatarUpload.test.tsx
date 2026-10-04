import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AvatarUpload from './AvatarUpload'
import { en } from '@/translations/en'
import { useSession } from 'next-auth/react'
import { notify } from '@/lib/notify'
import { AvatarReadError, resizeToAvatar } from '@/lib/resizeAvatar'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/lib/resizeAvatar', () => {
  class AvatarReadError extends Error {}
  return { AvatarReadError, resizeToAvatar: jest.fn() }
})

const update = jest.fn()
const fetchMock = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { id: '7' } }, update })
  global.fetch = fetchMock as unknown as typeof fetch
  URL.createObjectURL = jest.fn(() => 'blob:preview')
  URL.revokeObjectURL = jest.fn()
  ;(resizeToAvatar as jest.Mock).mockResolvedValue(new Blob(['x'], { type: 'image/webp' }))
})

const pick = () =>
  fireEvent.change(screen.getByLabelText(en.editProfileModal.uploadButton), {
    target: { files: [new File(['raw'], 'me.png', { type: 'image/png' })] },
  })

test('picking a picture shows it as it will look, and offers to use it', async () => {
  render(<AvatarUpload onDone={jest.fn()} />)
  pick()
  expect(await screen.findByAltText(en.editProfileModal.avatarPreview)).toHaveAttribute('src', 'blob:preview')
  expect(screen.getByRole('button', { name: en.editProfileModal.uploadSave })).toBeInTheDocument()
})

test('using it uploads the resized picture, refreshes the session, says so and closes', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ avatar: '/api/avatar/7-1' }) })
  const onDone = jest.fn()
  render(<AvatarUpload onDone={onDone} />)
  pick()
  fireEvent.click(await screen.findByRole('button', { name: en.editProfileModal.uploadSave }))
  await waitFor(() => expect(onDone).toHaveBeenCalled())
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('/api/avatar')
  expect(init.method).toBe('POST')
  expect(init.body).toBeInstanceOf(FormData)
  expect(update).toHaveBeenCalledWith()
  expect(notify.success).toHaveBeenCalledWith(en.toast.saved)
})

test('a file that is not an image is explained in place', async () => {
  ;(resizeToAvatar as jest.Mock).mockRejectedValue(new AvatarReadError('nope'))
  render(<AvatarUpload onDone={jest.fn()} />)
  pick()
  expect(await screen.findByRole('alert')).toHaveTextContent(en.editProfileModal.errorNotImage)
  expect(screen.queryByRole('button', { name: en.editProfileModal.uploadSave })).not.toBeInTheDocument()
})

test('server refusals become plain words, and the modal stays open', async () => {
  const onDone = jest.fn()
  render(<AvatarUpload onDone={onDone} />)
  pick()
  for (const [code, text] of [
    ['too-many-attempts', en.editProfileModal.errorTooMany],
    ['too-large', en.editProfileModal.errorTooLarge],
    ['not-an-image', en.editProfileModal.errorNotImage],
    ['whatever', en.editProfileModal.errorGeneric],
  ]) {
    fetchMock.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: code }) })
    fireEvent.click(await screen.findByRole('button', { name: en.editProfileModal.uploadSave }))
    expect(await screen.findByRole('alert')).toHaveTextContent(text)
  }
  expect(onDone).not.toHaveBeenCalled()
  expect(notify.success).not.toHaveBeenCalled()
})

test('a network failure is shown too', async () => {
  fetchMock.mockRejectedValue(new Error('offline'))
  render(<AvatarUpload onDone={jest.fn()} />)
  pick()
  fireEvent.click(await screen.findByRole('button', { name: en.editProfileModal.uploadSave }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.editProfileModal.errorGeneric)
})
