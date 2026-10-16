import { render, screen, fireEvent } from '@testing-library/react'
import UserConsolesPreference from './UserConsolesPreference'
import { en } from '@/translations/en'

const CONSOLES = [
  { name: 'Xbox 360', count: 12 },
  { name: 'Xbox Series', count: 30 },
]

beforeEach(() => window.localStorage.clear())

test('a tick per console with its games, all ticked at first', () => {
  render(<UserConsolesPreference source="xbox" consoles={CONSOLES} />)
  expect(screen.getByLabelText(/Xbox 360/)).toBeChecked()
  expect(screen.getByLabelText(/Xbox Series/)).toBeChecked()
  expect(screen.getByText('12')).toBeInTheDocument()
  expect(screen.getByText('2 of 2 shown')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: en.userData.consolesAll })).not.toBeInTheDocument()
})

test('unticking one saves it for that platform and counts it out; show all brings it back', () => {
  render(<UserConsolesPreference source="xbox" consoles={CONSOLES} />)
  fireEvent.click(screen.getByLabelText(/Xbox 360/))
  expect(screen.getByLabelText(/Xbox 360/)).not.toBeChecked()
  expect(window.localStorage.getItem('hidden-consoles:xbox')).toBe('["Xbox 360"]')
  expect(screen.getByText('1 of 2 shown')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.userData.consolesAll }))
  expect(screen.getByLabelText(/Xbox 360/)).toBeChecked()
  expect(window.localStorage.getItem('hidden-consoles:xbox')).toBeNull()
})

test('with fewer than two consoles there is nothing to choose', () => {
  const { container } = render(<UserConsolesPreference source="psn" consoles={[{ name: 'PS5', count: 3 }]} />)
  expect(container).toBeEmptyDOMElement()
})
