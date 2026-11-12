import { fireEvent, render, screen } from '@testing-library/react'
import PlatformUnlinkDialog from './PlatformUnlinkDialog'
import { en } from '@/translations/en'

const open = (props: Partial<React.ComponentProps<typeof PlatformUnlinkDialog>> = {}) =>
  render(<PlatformUnlinkDialog isOpen onClose={jest.fn()} onConfirm={jest.fn()} name="Steam" busy={false} {...props} />)

test('is a danger dialog that names the platform and says what happens', () => {
  open()
  const dialog = screen.getByRole('alertdialog', { name: en.userData.disconnectTitle.replace('{name}', 'Steam') })
  expect(dialog).toHaveAccessibleDescription(en.userData.disconnectText)
})

test('confirming asks the card to disconnect; cancelling does not', () => {
  const onConfirm = jest.fn()
  const onClose = jest.fn()
  open({ onConfirm, onClose })
  fireEvent.click(screen.getByRole('button', { name: en.editProfileModal.cancel }))
  expect(onClose).toHaveBeenCalled()
  expect(onConfirm).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: en.userData.disconnect }))
  expect(onConfirm).toHaveBeenCalledTimes(1)
})

test("while it runs it shows the platform's own progress word and cannot be dismissed", () => {
  const onClose = jest.fn()
  open({ busy: true, busyLabel: 'Disconnecting Steam…', onClose })
  expect(screen.getByRole('button', { name: 'Disconnecting Steam…' })).toBeDisabled()
  expect(screen.getByRole('button', { name: en.editProfileModal.cancel })).toBeDisabled()
  fireEvent.keyDown(document, { key: 'Escape' })
  fireEvent.click(screen.getByRole('button', { name: en.cards.close }))
  expect(onClose).not.toHaveBeenCalled()
})
