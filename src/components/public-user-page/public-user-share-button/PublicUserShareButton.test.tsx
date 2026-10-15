import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PublicUserShareButton from './PublicUserShareButton'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const writeText = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  Object.assign(navigator, { clipboard: { writeText } })
})

test('copies the profile address without its tab, and says so', async () => {
  window.location.hash = '#games'
  writeText.mockResolvedValue(undefined)
  render(<PublicUserShareButton />)
  fireEvent.click(screen.getByRole('button', { name: en.userProfile.copyLink }))
  await waitFor(() => expect(notify.success).toHaveBeenCalledWith(en.toast.profileLinkCopied))
  expect(writeText.mock.calls[0][0]).not.toContain('#')
  window.location.hash = ''
})

test('a refused clipboard is told, not swallowed', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  writeText.mockRejectedValue(new Error('denied'))
  render(<PublicUserShareButton />)
  fireEvent.click(screen.getByRole('button'))
  await waitFor(() => expect(notify.error).toHaveBeenCalledWith(en.toast.profileLinkFailed))
})
