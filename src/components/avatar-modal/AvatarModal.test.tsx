import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'
import { notify } from '@/lib/notify'
import { AvatarReadError, resizeToAvatar } from '@/lib/resizeAvatar'
import AvatarModal from './AvatarModal'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/lib/resizeAvatar', () => {
  class AvatarReadError extends Error {}
  return { AvatarReadError, resizeToAvatar: jest.fn() }
})

const t = en.editProfileModal
const update = jest.fn()
const fetchMock = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { id: '7' } }, update })
  update.mockResolvedValue(null)
  global.fetch = fetchMock as unknown as typeof fetch
  URL.createObjectURL = jest.fn(() => 'blob:preview')
  URL.revokeObjectURL = jest.fn()
  ;(resizeToAvatar as jest.Mock).mockResolvedValue(new Blob(['x'], { type: 'image/webp' }))
})

const file = () => new File(['raw'], 'me.png', { type: 'image/png' })
const pick = () => fireEvent.change(screen.getByLabelText(new RegExp(t.uploadButton)), { target: { files: [file()] } })

function renderModal(current: string | null = 'https://x.test/me.png') {
  const onClose = jest.fn()
  render(<AvatarModal isOpen onClose={onClose} current={current} />)
  return onClose
}

test('shows the picture there is now, big, and the way to upload one', () => {
  renderModal()
  expect(screen.getByRole('heading', { name: t.avatarTitle })).toBeInTheDocument()
  expect(screen.getByAltText(t.avatarPreview)).toHaveAttribute('src', 'https://x.test/me.png')
  expect(screen.getByText(t.uploadHint)).toBeInTheDocument()
})

test('a picked picture shows as it will look; using it uploads, toasts and closes', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ avatar: '/api/avatar/7-1' }) })
  const onClose = renderModal()
  pick()
  await waitFor(() => expect(screen.getByAltText(t.avatarPreview)).toHaveAttribute('src', 'blob:preview'))
  fireEvent.click(screen.getByRole('button', { name: t.uploadSave }))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(fetchMock.mock.calls[0][0]).toBe('/api/avatar')
  expect(fetchMock.mock.calls[0][1].body).toBeInstanceOf(FormData)
  expect(notify.success).toHaveBeenCalledWith(en.toast.saved)
})

test('a picture can be dropped on it, and a pick can be undone', async () => {
  renderModal(null)
  const zone = screen.getByLabelText(new RegExp(t.uploadButton))
    .closest('label') as HTMLElement
  fireEvent.dragOver(zone)
  expect(screen.getByText(t.avatarDrop)).toBeInTheDocument()
  fireEvent.drop(zone, { dataTransfer: { files: [file()] } })
  expect(await screen.findByRole('button', { name: t.uploadSave })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: t.cancel }))
  expect(screen.queryByRole('button', { name: t.uploadSave })).toBeNull()
})

test('a file that is not an image, and a refusal, are said in place', async () => {
  ;(resizeToAvatar as jest.Mock).mockRejectedValueOnce(new AvatarReadError('nope'))
  const onClose = renderModal()
  pick()
  expect(await screen.findByRole('alert')).toHaveTextContent(t.errorNotImage)

  fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'too-large' }) })
  pick()
  fireEvent.click(await screen.findByRole('button', { name: t.uploadSave }))
  expect(await screen.findByRole('alert')).toHaveTextContent(t.errorTooLarge)
  expect(onClose).not.toHaveBeenCalled()
})

test('a link, folded away: only https, previewed, then saved', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
  const onClose = renderModal(null)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(t.uploadOr) }))
  const input = screen.getByLabelText(t.avatarLinkLabel)
  const save = screen.getByRole('button', { name: t.avatarLinkSave })

  fireEvent.change(input, { target: { value: 'http://x.test/a.png' } })
  expect(save).toBeDisabled()
  fireEvent.change(input, { target: { value: 'https://x.test/a.png' } })
  expect(screen.getByAltText(t.avatarPreview)).toHaveAttribute('src', 'https://x.test/a.png')

  fireEvent.click(save)
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ field: 'avatar', value: 'https://x.test/a.png' })
})

test('a link that does not load is said, and cannot be saved', () => {
  renderModal(null)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(t.uploadOr) }))
  fireEvent.change(screen.getByLabelText(t.avatarLinkLabel), { target: { value: 'https://x.test/broken.png' } })
  fireEvent.error(screen.getByAltText(t.avatarPreview))
  expect(screen.getByRole('alert')).toHaveTextContent(t.errorAvatarLoad)
  expect(screen.getByRole('button', { name: t.avatarLinkSave })).toBeDisabled()
})

test('the close button closes', () => {
  const onClose = renderModal()
  fireEvent.click(screen.getByRole('button', { name: t.close }))
  expect(onClose).toHaveBeenCalled()
})
