import { render, screen, fireEvent } from '@testing-library/react'
import SearchModal from './SearchModal'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { useRaLinked } from '@/hooks/useRaLinked'
import { en } from '@/translations/en'
import type { GameCandidate } from '@/utils/gameCandidates'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('@/hooks/useGameCandidates', () => ({ useGameCandidates: jest.fn() }))
jest.mock('@/hooks/useRaLinked', () => ({ useRaLinked: jest.fn() }))
jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

function candidate(source: 'ra' | 'steam' | 'psn', id: number, title: string): GameCandidate {
  return {
    key: `${source}:${id}`, source, id, title, subtitle: source === 'ra' ? 'SNES' : source === 'steam' ? 'Steam' : 'PlayStation',
    imageRef: '', pctWon: 0, numAwarded: 0, maxPossible: 0, status: 'in-progress',
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useGameCandidates as jest.Mock).mockReturnValue([candidate('ra', 620, 'Zelda'), candidate('steam', 620, 'Portal 2')])
  ;(useRaLinked as jest.Mock).mockReturnValue(true)
})

function type(value: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value } })
}

test('renders nothing when closed, and loads candidates only when open', () => {
  const { container } = render(<SearchModal isOpen={false} onClose={jest.fn()} />)
  expect(container.innerHTML).toBe('')
  expect(useGameCandidates).toHaveBeenCalledWith(false)
})

test('shows the hint until something is typed', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  expect(screen.getByText(en.search.hint)).toBeInTheDocument()
})

test('finds RA and Steam games alike', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('a')
  expect(screen.getByRole('button', { name: /Zelda/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Portal 2/ })).toBeInTheDocument()
})

test('a Steam result opens the Steam game page', () => {
  const onClose = jest.fn()
  render(<SearchModal isOpen onClose={onClose} />)
  type('portal')
  fireEvent.click(screen.getByRole('button', { name: /Portal 2/ }))
  expect(mockPush).toHaveBeenCalledWith('/steamGame/620')
  expect(onClose).toHaveBeenCalled()
})

test('an RA result opens the RA game page', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('zelda')
  fireEvent.click(screen.getByRole('button', { name: /Zelda/ }))
  expect(mockPush).toHaveBeenCalledWith('/gameInfo/620')
})

test('a pasted id opens that RA game', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('1234')
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.search.openById) }))
  expect(mockPush).toHaveBeenCalledWith('/gameInfo/1234')
})

test('says so when nothing matches', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('xyz')
  expect(screen.getByText(en.search.noResults)).toBeInTheDocument()
})

test('filters results by platform, and resets the filter on close/reopen', () => {
  const { rerender } = render(<SearchModal isOpen onClose={jest.fn()} />)
  type('a')
  fireEvent.click(screen.getByRole('button', { name: en.search.platformSteam }))
  expect(screen.queryByRole('button', { name: /Zelda/ })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Portal 2/ })).toBeInTheDocument()

  rerender(<SearchModal isOpen={false} onClose={jest.fn()} />)
  rerender(<SearchModal isOpen onClose={jest.fn()} />)
  type('a')
  expect(screen.getByRole('button', { name: /Zelda/ })).toBeInTheDocument()
})

test('hides the platform filter when the library has only one platform', () => {
  ;(useGameCandidates as jest.Mock).mockReturnValue([candidate('ra', 620, 'Zelda')])
  render(<SearchModal isOpen onClose={jest.fn()} />)
  expect(screen.queryByRole('button', { name: en.search.platformSteam })).not.toBeInTheDocument()
})

test('the selected tab is announced', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  expect(screen.getByRole('button', { name: en.publicProfile.gamesTab }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: en.publicProfile.userTab }))
  expect(screen.getByRole('button', { name: en.publicProfile.userTab }).getAttribute('aria-pressed')).toBe('true')
})

test('with no RA account there is no users tab and no RA lookup by id', () => {
  ;(useRaLinked as jest.Mock).mockReturnValue(false)
  render(<SearchModal isOpen onClose={jest.fn()} />)
  expect(screen.queryByRole('button', { name: en.publicProfile.userTab })).not.toBeInTheDocument()

  type('620')
  expect(screen.queryByText(en.search.openById)).not.toBeInTheDocument()
})

test('a PlayStation filter shows up once PSN games are in the results, opening their PSN page', () => {
  ;(useGameCandidates as jest.Mock).mockReturnValue([candidate('ra', 620, 'Zelda'), candidate('psn', 2018800, 'Astro Bot')])
  const onClose = jest.fn()
  render(<SearchModal isOpen onClose={onClose} />)
  type('a')
  // Only the platforms in the results get a chip: no Steam here.
  expect(screen.queryByRole('button', { name: en.search.platformSteam })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'PlayStation' }))
  expect(screen.queryByRole('button', { name: /Zelda/ })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Astro Bot/ }))
  expect(onClose).toHaveBeenCalled()
})
