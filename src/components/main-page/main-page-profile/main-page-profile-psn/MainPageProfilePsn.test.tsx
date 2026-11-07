jest.mock('@/hooks/usePsnSummary', () => ({ usePsnSummary: jest.fn(() => ({ summary: null, isLoading: false, error: null, retry: jest.fn() })) }))
jest.mock('./main-page-profile-psn-linked/MainPageProfilePsnLinked', () => ({
  __esModule: true,
  default: () => <div data-testid="linked" />,
}))

import { render, screen } from '@testing-library/react'
import MainPageProfilePsn from './MainPageProfilePsn'

test('the PSN profile', () => {
  render(<MainPageProfilePsn />)
  expect(screen.getByTestId('linked')).toBeInTheDocument()
})
