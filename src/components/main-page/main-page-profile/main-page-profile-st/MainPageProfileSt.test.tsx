import { render, screen } from '@testing-library/react'
import MainPageProfileSt from './MainPageProfileSt'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamProfile } from '@/hooks/useSteamProfile'

jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/hooks/useSteamProfile', () => ({ useSteamProfile: jest.fn() }))
jest.mock('./main-page-profile-st-linked/MainPageProfileStLinked', () => ({
  __esModule: true,
  default: (props: { isLoading: boolean; error: string | null; profile: { personaname: string } | null }) => (
    <div data-testid="linked">
      {props.profile?.personaname} {String(props.isLoading)} {props.error}
    </div>
  ),
}))

const retry = jest.fn()

function setup(isLinked: boolean) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked })
  ;(useSteamProfile as jest.Mock).mockReturnValue({
    profile: isLinked ? { personaname: 'Ivan' } : null,
    isLoading: false,
    error: null,
    retry,
  })
}

describe('when Steam is not linked', () => {
  beforeEach(() => setup(false))

  test('renders the Steam section', () => {
    render(<MainPageProfileSt />)
    expect(screen.getByText('Steam')).toBeInTheDocument()
  })

  test('links to the settings page to connect', () => {
    render(<MainPageProfileSt />)
    const link = screen.getByRole('link', { name: 'Sign in with Steam' })
    expect(link.getAttribute('href')).toBe('/user')
  })
})

test('shows the linked profile once Steam is connected', () => {
  setup(true)
  render(<MainPageProfileSt />)

  expect(screen.getByTestId('linked')).toHaveTextContent('Ivan false')
  expect(screen.queryByRole('link', { name: 'Sign in with Steam' })).not.toBeInTheDocument()
})
