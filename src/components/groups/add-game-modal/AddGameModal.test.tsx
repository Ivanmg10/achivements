import { render, screen, fireEvent } from '@testing-library/react'
import AddGameModal from './AddGameModal'

jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({
    T: {
      groups: { searchGames: 'Search games', addGame: 'Add game' },
      search: { openById: 'Open by ID' },
    },
  }),
}))

jest.mock('@/context/GamesDataContext', () => ({
  useGamesData: () => ({ all: [] }),
}))

jest.mock('@/hooks/useRecentlyPlayedGames', () => ({
  useRecentlyPlayedGames: () => [],
}))

jest.mock('next/image', () => ({ src, alt, ...props }: any) => (
  <img src={src} alt={alt} {...props} />
))

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
  })
) as jest.Mock

describe('AddGameModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when not open', () => {
    const { container } = render(
      <AddGameModal
        isOpen={false}
        onClose={jest.fn()}
        groupId={1}
        existingIds={new Set()}
        onAdded={jest.fn()}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders search input when open', () => {
    render(
      <AddGameModal
        isOpen={true}
        onClose={jest.fn()}
        groupId={1}
        existingIds={new Set()}
        onAdded={jest.fn()}
      />
    )
    expect(screen.getByPlaceholderText('Search games')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <AddGameModal
        isOpen={true}
        onClose={onClose}
        groupId={1}
        existingIds={new Set()}
        onAdded={jest.fn()}
      />
    )
    const closeBtn = screen.getByLabelText('Close')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows hint text when no query entered', () => {
    render(
      <AddGameModal
        isOpen={true}
        onClose={jest.fn()}
        groupId={1}
        existingIds={new Set()}
        onAdded={jest.fn()}
      />
    )
    expect(screen.getByText('Search games')).toBeInTheDocument()
  })
})
