import { render } from '@testing-library/react'
import ChangePasswordModal from '@/components/change-password-modal/ChangePasswordModal'
import DeleteAccountModal from '@/components/delete-account-modal/DeleteAccountModal'
import HiddenGamesModal from '@/components/hidden-games-modal/HiddenGamesModal'
import PlatformUnlinkDialog from '@/components/user-page/platform-unlink-dialog/PlatformUnlinkDialog'

jest.mock('@/context/HiddenGamesContext', () => ({ useHiddenGames: () => ({ hidden: [], showGame: jest.fn() }) }))

const MD = 'sm:max-w-[33.75rem]'
const LG = 'sm:max-w-[47.5rem]'

// The account page's dialogs are not the library's narrowest (27.5rem): a form of a few fields or a
// confirmation is medium, a list is large (#132). The default of Modal is unchanged.
test.each([
  ['change password', <ChangePasswordModal key="a" isOpen onClose={jest.fn()} />, MD],
  ['delete account', <DeleteAccountModal key="b" isOpen onClose={jest.fn()} />, MD],
  ['disconnect a platform', <PlatformUnlinkDialog key="c" isOpen onClose={jest.fn()} onConfirm={jest.fn()} name="Steam" busy={false} />, MD],
  ['hidden games', <HiddenGamesModal key="d" isOpen onClose={jest.fn()} />, LG],
])('%s is as wide as its content asks', (_name, dialog, width) => {
  render(dialog)
  expect(document.querySelector('[role$="dialog"]')).toHaveClass(width)
})
