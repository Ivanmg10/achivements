import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

test('saves the theme and closes', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true })
  const onClose = jest.fn()
  render(<ThemeModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: /Blue/ }))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(setTheme).toHaveBeenCalledWith('blue')
  expect(update).toHaveBeenCalledWith({ theme: 'blue' })
})

test('puts the old theme back and says so when saving fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
  const onClose = jest.fn()
  render(<ThemeModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: /Blue/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.userTheme.saveError)
  expect(setTheme).toHaveBeenLastCalledWith('dark')
  expect(update).not.toHaveBeenCalled()
  expect(onClose).not.toHaveBeenCalled()
})
