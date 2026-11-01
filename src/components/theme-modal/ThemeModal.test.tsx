import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { THEMES } from '@/types/types'
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

test('saves the theme, says so and stays open to try another', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true })
  const onClose = jest.fn()
  const { rerender } = render(<ThemeModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: en.userTheme.name_blue }))
  expect(setTheme).toHaveBeenCalledWith('blue')
  // The theme was saved first; update() only asks the server to re-read it.
  await waitFor(() => expect(update).toHaveBeenCalledWith())
  ;(useTheme as jest.Mock).mockReturnValue({ theme: 'blue', setTheme })
  rerender(<ThemeModal isOpen onClose={onClose} />)
  expect(await screen.findByRole('status')).toHaveTextContent(`${en.userTheme.name_blue} · ${en.toast.saved}`)
  expect(onClose).not.toHaveBeenCalled()
})

test('says which theme is on; picking it again does nothing', () => {
  render(<ThemeModal isOpen onClose={jest.fn()} />)
  expect(screen.getByRole('status')).toHaveTextContent(en.userTheme.name_dark)
  fireEvent.click(screen.getByRole('radio', { name: en.userTheme.name_dark }))
  expect(fetch).not.toHaveBeenCalled()
})

test('puts the old theme back and says so when saving fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
  const onClose = jest.fn()
  render(<ThemeModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: en.userTheme.name_blue }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.userTheme.saveError)
  expect(setTheme).toHaveBeenLastCalledWith('dark')
  expect(update).not.toHaveBeenCalled()
  expect(onClose).not.toHaveBeenCalled()
})

test('offers every theme, the current one checked, each drawn in its own colours', () => {
  const { container } = render(<ThemeModal isOpen onClose={jest.fn()} />)
  const radios = screen.getAllByRole('radio')
  expect(radios).toHaveLength(THEMES.length)
  expect(screen.getByRole('radio', { name: en.userTheme.name_dark })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('radio', { name: en.userTheme.name_sakura })).toHaveAttribute('aria-checked', 'false')
  expect(container.ownerDocument.querySelector('[data-theme="sakura"]')).not.toBeNull()
})
