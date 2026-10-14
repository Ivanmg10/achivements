import { render, screen, fireEvent } from '@testing-library/react'
import PublicUserActivity from './PublicUserActivity'
import { useMainPlatform } from '@/context/MainPlatformContext'
import { en } from '@/translations/en'

jest.mock('@/context/MainPlatformContext', () => ({ useMainPlatform: jest.fn() }))
jest.mock('@/components/main-page/main-page-charts/MainPageCharts', () => ({ __esModule: true, default: () => <div data-testid="charts" /> }))

const setPlatform = jest.fn()

test('with several platforms, a switch for the stats that follow one, tied to its panel', () => {
  ;(useMainPlatform as jest.Mock).mockReturnValue({ platform: 'ra', setPlatform, linked: ['ra', 'psn'] })
  render(<PublicUserActivity />)
  expect(screen.getByRole('tablist', { name: en.userProfile.statsPlatform })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('tab', { name: 'PlayStation' }))
  expect(setPlatform).toHaveBeenCalledWith('psn')
  expect(screen.getByRole('tabpanel')).toContainElement(screen.getByTestId('charts'))
})

test('with one, just the stats', () => {
  ;(useMainPlatform as jest.Mock).mockReturnValue({ platform: 'steam', setPlatform, linked: ['steam'] })
  render(<PublicUserActivity />)
  expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
  expect(screen.getByTestId('charts')).toBeInTheDocument()
})
