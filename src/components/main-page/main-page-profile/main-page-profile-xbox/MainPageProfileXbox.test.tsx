jest.mock('@/hooks/useXboxSummary', () => ({ useXboxSummary: jest.fn(() => ({ summary: null, isLoading: false, error: null, retry: jest.fn() })) }))
jest.mock('./main-page-profile-xbox-linked/MainPageProfileXboxLinked', () => ({
  __esModule: true,
  default: () => <div data-testid="linked" />,
}))

import { render, screen } from '@testing-library/react'
import MainPageProfileXbox from './MainPageProfileXbox'

test('the Xbox profile', () => {
  render(<MainPageProfileXbox />)
  expect(screen.getByTestId('linked')).toBeInTheDocument()
})
