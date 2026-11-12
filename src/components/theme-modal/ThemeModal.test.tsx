import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { en } from '@/translations/en'
import ThemeModal from './ThemeModal'

jest.mock('@/context/ThemeContext', () => ({ useTheme: jest.fn() }))

const setTheme = jest.fn()
const update = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  ;(useTheme as jest.Mock).mockReturnValue({ theme: 'dark', setTheme })
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, update })
  update.mockResolvedValue(null)
})

const on = (theme: string) => (useTheme as jest.Mock).mockReturnValue({ theme, setTheme })
const group = (name: string) => within(screen.getByRole('group', { name }))
const t = en.userTheme

test('saves the theme, says so and stays open to try another', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true })
  const onClose = jest.fn()
  const { rerender } = render(<ThemeModal isOpen onClose={onClose} />)
  fireEvent.click(group(t.accent).getByRole('radio', { name: t.accent_blue }))
  expect(setTheme).toHaveBeenCalledWith('dark-blue')
  // The theme was saved first; update() only asks the server to re-read it.
  await waitFor(() => expect(update).toHaveBeenCalledWith())
  on('dark-blue')
  rerender(<ThemeModal isOpen onClose={onClose} />)
  expect(await screen.findByRole('status')).toHaveTextContent(`${t['name_dark-blue']} · ${en.toast.saved}`)
  expect(onClose).not.toHaveBeenCalled()
})

test('says which theme is on, its base and accent marked on opening; picking it again does nothing', () => {
  on('light-blue')
  render(<ThemeModal isOpen onClose={jest.fn()} />)
  expect(screen.getByRole('status')).toHaveTextContent(t['name_light-blue'])
  expect(group(t.base).getByRole('radio', { name: t.base_light })).toBeChecked()
  expect(group(t.accent).getByRole('radio', { name: t.accent_blue })).toBeChecked()
  expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(2)
  fireEvent.click(group(t.base).getByRole('radio', { name: t.base_light }))
  expect(fetch).not.toHaveBeenCalled()
})

test('a base keeps the accent on; the fifth accent is white on dark and black on light', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
  on('dark-red')
  render(<ThemeModal isOpen onClose={jest.fn()} />)
  expect(group(t.accent).getByRole('radio', { name: t.accent_white })).toBeEnabled()
  fireEvent.click(group(t.base).getByRole('radio', { name: t.base_light }))
  expect(setTheme).toHaveBeenCalledWith('light-red')
  await waitFor(() => expect(update).toHaveBeenCalled())
})

test('a pair with no theme is shown but not offered, and a base without the accent falls back to violet', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
  on('red')
  const { unmount } = render(<ThemeModal isOpen onClose={jest.fn()} />)
  expect(group(t.base).getByRole('radio', { name: t.base_tinted })).toBeChecked()
  const white = group(t.accent).getByRole('radio', { name: new RegExp(t.accent_white) })
  expect(white).toBeDisabled()
  expect(white).toHaveAccessibleName(new RegExp(t.noPair))
  unmount()
  on('dark-white')
  render(<ThemeModal isOpen onClose={jest.fn()} />)
  fireEvent.click(group(t.base).getByRole('radio', { name: t.base_tinted }))
  expect(setTheme).toHaveBeenCalledWith('purple')
  await waitFor(() => expect(update).toHaveBeenCalled())
})

test('a named theme is whole: it is checked alone, and picking one sets its own id', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
  on('venom')
  render(<ThemeModal isOpen onClose={jest.fn()} />)
  expect(group(t.named).getByRole('radio', { name: new RegExp(t.name_venom) })).toBeChecked()
  expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1)
  fireEvent.click(group(t.named).getByRole('radio', { name: new RegExp(t.name_sakura) }))
  expect(setTheme).toHaveBeenCalledWith('sakura')
  // With a named theme on, an accent goes on the dark base.
  fireEvent.click(group(t.accent).getByRole('radio', { name: t.accent_green }))
  expect(setTheme).toHaveBeenLastCalledWith('dark-green')
  await waitFor(() => expect(update).toHaveBeenCalledTimes(2))
})

test('puts the old theme back and says so when saving fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
  const onClose = jest.fn()
  render(<ThemeModal isOpen onClose={onClose} />)
  fireEvent.click(group(t.accent).getByRole('radio', { name: t.accent_blue }))
  expect(await screen.findByRole('alert')).toHaveTextContent(t.saveError)
  expect(setTheme).toHaveBeenLastCalledWith('dark')
  expect(update).not.toHaveBeenCalled()
  expect(onClose).not.toHaveBeenCalled()
})

test('every option is a small screen in the colours of the theme it lands on, the one on saying so', () => {
  const { container } = render(<ThemeModal isOpen onClose={jest.fn()} />)
  const doc = container.ownerDocument
  expect(screen.getAllByRole('radio')).toHaveLength(3 + 5 + 8)
  for (const id of ['dark', 'purple', 'light', 'dark-red', 'dark-white', 'sakura', 'venom']) expect(doc.querySelector(`[data-theme="${id}"]`)).not.toBeNull()
  // The dark base and the violet accent are both the theme on.
  expect(screen.getAllByText(t.on)).toHaveLength(2)
})
