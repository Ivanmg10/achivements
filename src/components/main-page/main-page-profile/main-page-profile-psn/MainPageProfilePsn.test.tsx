jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/hooks/usePsnSummary', () => ({ usePsnSummary: jest.fn(() => ({ summary: null, isLoading: false, error: null, retry: jest.fn() })) }))
jest.mock('./main-page-profile-psn-linked/MainPageProfilePsnLinked', () => ({
  __esModule: true,
  default: () => <div data-testid="linked" />,
}))

import { render, screen } from '@testing-library/react'
import MainPageProfilePsn from './MainPageProfilePsn'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { en } from '@/translations/en'

test('unlinked: points to the account page', () => {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ isLinked: false })
  render(<MainPageProfilePsn />)
  expect(screen.getByRole('link', { name: en.psn.connect })).toHaveAttribute('href', '/user')
})

test('linked: the PSN profile', () => {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ isLinked: true })
  render(<MainPageProfilePsn />)
  expect(screen.getByTestId('linked')).toBeInTheDocument()
})
