import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import GenderModal from './GenderModal'
import { en } from '@/translations/en'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

beforeEach(() => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null, update: jest.fn() })
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
})

const sent = () => JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)

test('offers male, female, neutral and not set, with the current one checked', () => {
  render(<GenderModal isOpen onClose={jest.fn()} current="neutral" />)
  expect(screen.getByRole('radio', { name: en.userData.genderNeutral })).toBeChecked()
  expect(screen.getByRole('radio', { name: en.userData.genderMale })).not.toBeChecked()
  expect(screen.getByRole('radio', { name: en.userData.notSet })).toBeInTheDocument()
})

test('choosing one saves it and closes', async () => {
  const onClose = jest.fn()
  render(<GenderModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: en.userData.genderFemale }))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(sent()).toEqual({ field: 'gender', value: 'female' })
})

test('not set clears it', async () => {
  render(<GenderModal isOpen onClose={jest.fn()} current="male" />)
  fireEvent.click(screen.getByRole('radio', { name: en.userData.notSet }))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(sent()).toEqual({ field: 'gender', value: '' })
})

test('a failed save keeps the modal open and says why', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'Invalid gender' }) })
  const onClose = jest.fn()
  render(<GenderModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: en.userData.genderMale }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid gender')
  expect(onClose).not.toHaveBeenCalled()
})
