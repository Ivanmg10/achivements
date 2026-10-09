import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import UserDescriptionField from './UserDescriptionField'
import { en } from '@/translations/en'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

beforeEach(() => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { description: 'Hello' } }, update: jest.fn() })
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
})

test('shows the saved text and no save button until it changes', () => {
  render(<UserDescriptionField />)
  expect(screen.getByLabelText(en.userData.description)).toHaveValue('Hello')
  expect(screen.queryByRole('button', { name: en.editProfileModal.save })).not.toBeInTheDocument()
})

test('editing reveals save, which posts the new text', async () => {
  render(<UserDescriptionField />)
  fireEvent.change(screen.getByLabelText(en.userData.description), { target: { value: 'Hi there' } })
  fireEvent.click(screen.getByRole('button', { name: en.editProfileModal.save }))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({ field: 'description', value: 'Hi there' })
})

test('a failed save shows the error inline', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'Nope' }) })
  render(<UserDescriptionField />)
  fireEvent.change(screen.getByLabelText(en.userData.description), { target: { value: 'x' } })
  fireEvent.click(screen.getByRole('button', { name: en.editProfileModal.save }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Nope')
})
