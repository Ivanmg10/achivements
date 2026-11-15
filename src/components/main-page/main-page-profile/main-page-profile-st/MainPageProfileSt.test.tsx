import { render, screen } from '@testing-library/react'
import MainPageProfileSt from './MainPageProfileSt'
import { useSteamProfile } from '@/hooks/useSteamProfile'

jest.mock('@/hooks/useSteamProfile', () => ({ useSteamProfile: jest.fn() }))
jest.mock('./main-page-profile-st-linked/MainPageProfileStLinked', () => ({
  __esModule: true,
  default: (props: { isLoading: boolean; error: string | null; profile: { personaname: string } | null }) => (
    <div data-testid="linked">
      {props.profile?.personaname} {String(props.isLoading)} {props.error}
    </div>
  ),
}))

test('the Steam profile', () => {
  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: { personaname: 'Ivan' }, isLoading: false, error: null, retry: jest.fn() })
  render(<MainPageProfileSt />)
  expect(screen.getByTestId('linked')).toHaveTextContent('Ivan false')
})
