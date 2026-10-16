jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@/hooks/useXboxSummary', () => ({ useXboxSummary: jest.fn(() => ({ summary: null, isLoading: false, error: null, retry: jest.fn() })) }))
jest.mock('./main-page-profile-xbox-linked/MainPageProfileXboxLinked', () => ({
  __esModule: true,
  default: () => <div data-testid="linked" />,
}))

import { render, screen } from '@testing-library/react'
import MainPageProfileXbox from './MainPageProfileXbox'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { en } from '@/translations/en'

test('unlinked: points to the account page', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ isLinked: false })
  render(<MainPageProfileXbox />)
  expect(screen.getByRole('link', { name: en.xbox.connect })).toHaveAttribute('href', '/user')
})

test('linked: the Xbox profile', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ isLinked: true })
  render(<MainPageProfileXbox />)
  expect(screen.getByTestId('linked')).toBeInTheDocument()
})
