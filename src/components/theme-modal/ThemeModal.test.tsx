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

test('says which theme is on, its base and option checked on opening; picking it again does nothing', () => {
  on('light-blue')
  render(<ThemeModal isOpen onClose={jest.fn()} />)
  expect(screen.getByRole('status')).toHaveTextContent(t['name_light-blue'])
  expect(group(t.base).getByRole('radio', { name: t.base_light })).toBeChecked()
  expect(group(t.accent).getByRole('radio', { name: t.accent_blue })).toBeChecked()
  expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(2)
  fireEvent.click(group(t.base).getByRole('radio', { name: t.base_light }))
  expect(fetch).not.toHaveBeenCalled()
})

test('a base keeps the same option when it has it, else takes its first', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
  on('dark-white')
  render(<ThemeModal isOpen onClose={jest.fn()} />)
  fireEvent.click(group(t.base).getByRole('radio', { name: t.base_light }))
  expect(setTheme).toHaveBeenCalledWith('light-black')
  fireEvent.click(group(t.base).getByRole('radio', { name: t.base_tinted }))
  expect(setTheme).toHaveBeenLastCalledWith('purple')
  await waitFor(() => expect(update).toHaveBeenCalledTimes(2))
})

test('each base shows its own options: the palettes beside the accents of their ground', () => {
  on('sakura')
  render(<ThemeModal isOpen onClose={jest.fn()} />)
  expect(group(t.base).getByRole('radio', { name: t.base_light })).toBeChecked()
  const accents = group(t.accent)
  expect(accents.getByRole('radio', { name: t.name_sakura })).toBeChecked()
  const names = [t.accent_violet, t.accent_red, t.accent_green, t.accent_blue, t.accent_black, t.name_sakura, t.name_arctic]
  accents.getAllByRole('radio').forEach((radio, i) => expect(radio).toHaveAccessibleName(names[i]))
})

test('the special base offers the tributes by name, under "Theme"', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
  on('venom')
  render(<ThemeModal isOpen onClose={jest.fn()} />)
  expect(group(t.base).getByRole('radio', { name: t.base_special })).toBeChecked()
  const themes = group(t.theme)
  expect(themes.getAllByRole('radio')).toHaveLength(4)
  expect(themes.getByRole('radio', { name: t.name_venom })).toBeChecked()
  fireEvent.click(themes.getByRole('radio', { name: t['name_snake-eater'] }))
  expect(setTheme).toHaveBeenCalledWith('snake-eater')
  await waitFor(() => expect(update).toHaveBeenCalled())
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
  expect(screen.getAllByRole('radio')).toHaveLength(4 + 5)
  for (const id of ['dark', 'purple', 'light', 'black-ops-2', 'dark-red', 'dark-white']) expect(doc.querySelector(`[data-theme="${id}"]`)).not.toBeNull()
  // The dark base and the violet accent are both the theme on.
  expect(screen.getAllByText(t.on)).toHaveLength(2)
})
