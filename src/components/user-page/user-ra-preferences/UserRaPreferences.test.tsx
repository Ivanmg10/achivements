jest.mock('@/context/GamesDataContext', () => ({ useGamesData: jest.fn() }))

import { render, screen } from '@testing-library/react'
import UserRaPreferences from './UserRaPreferences'
import { useGamesData } from '@/context/GamesDataContext'
import { en } from '@/translations/en'

test('lists the consoles of the library', () => {
  ;(useGamesData as jest.Mock).mockReturnValue({ consoles: [{ name: 'SNES', count: 4 }, { name: 'GameCube', count: 2 }] })
  render(<UserRaPreferences />)
  expect(screen.getByRole('group', { name: en.userData.consoles })).toBeInTheDocument()
  expect(screen.getByLabelText(/SNES/)).toBeChecked()
})

test('nothing with one console or none', () => {
  ;(useGamesData as jest.Mock).mockReturnValue({ consoles: [{ name: 'SNES', count: 4 }] })
  const { container } = render(<UserRaPreferences />)
  expect(container).toBeEmptyDOMElement()
})
