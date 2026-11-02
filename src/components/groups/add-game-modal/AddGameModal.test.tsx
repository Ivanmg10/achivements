import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddGameModal from './AddGameModal'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { fetchRaCandidateById } from '@/utils/apiCallsUtils'
import { en } from '@/translations/en'
import type { GameCandidate } from '@/utils/gameCandidates'

jest.mock('@/hooks/useGameCandidates', () => ({ useGameCandidates: jest.fn() }))
jest.mock('@/utils/apiCallsUtils', () => ({ fetchRaCandidateById: jest.fn() }))
jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

function candidate(source: 'ra' | 'steam', id: number, title: string): GameCandidate {
  return {
    key: `${source}:${id}`, source, id, title, subtitle: source === 'ra' ? 'SNES' : 'Steam',
    imageRef: source === 'ra' ? '/Images/1.png' : 'https://cdn/icon.jpg',
    pctWon: 0.5, numAwarded: 5, maxPossible: 10, status: 'in-progress',
  }
}

const ZELDA = candidate('ra', 620, 'Zelda')
const PORTAL = candidate('steam', 620, 'Portal 2')

function renderModal(props: Partial<React.ComponentProps<typeof AddGameModal>> = {}) {
  const onAdded = jest.fn()
  const onClose = jest.fn()
  render(
    <AddGameModal isOpen onClose={onClose} groupId={3} existingKeys={new Set()} onAdded={onAdded} {...props} />,
  )
  return { onAdded, onClose }
}

function ok(body: unknown) {
  return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(body) })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useGameCandidates as jest.Mock).mockReturnValue([ZELDA, PORTAL])
  global.fetch = jest.fn()
})

test('renders nothing when closed', () => {
  const { container } = render(
    <AddGameModal isOpen={false} onClose={jest.fn()} groupId={1} existingKeys={new Set()} onAdded={jest.fn()} />,
  )
  expect(container.innerHTML).toBe('')
})

test('has a labelled search box and a close button', () => {
  const { onClose } = renderModal()
  expect(screen.getByRole('textbox', { name: en.groups.searchGames })).toBeInTheDocument()
  fireEvent.click(screen.getByLabelText('Close'))
  expect(onClose).toHaveBeenCalled()
})

test('finds RA and Steam games, even with the same id', () => {
  renderModal()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } })
  expect(screen.getByRole('button', { name: /Zelda/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Portal 2/ })).toBeInTheDocument()
})

test('does not offer games already in the group', () => {
  renderModal({ existingKeys: new Set(['steam:620']) })
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } })
  expect(screen.getByRole('button', { name: /Zelda/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Portal 2/ })).not.toBeInTheDocument()
})

test('adds a Steam game with its platform, then closes', async () => {
  const item = { id: 9, source: 'steam', game_id: 620, title: 'Portal 2' }
  ;(global.fetch as jest.Mock).mockReturnValue(ok(item))
  const { onAdded, onClose } = renderModal()

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'portal' } })
  fireEvent.click(screen.getByRole('button', { name: /^Portal 2/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Add 1 game' }))

  await waitFor(() => expect(onClose).toHaveBeenCalled())
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/groups/3/games')
  expect(JSON.parse(init.body)).toMatchObject({ source: 'steam', game_id: 620, title: 'Portal 2', console_name: 'Steam' })
  expect(onAdded).toHaveBeenCalledWith([item])
})

test('keeps failed games selected and says so', async () => {
  ;(global.fetch as jest.Mock).mockImplementation((_url: string, init: { body: string }) =>
    JSON.parse(init.body).source === 'ra'
      ? ok({ id: 1, source: 'ra', game_id: 620 })
      : Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }),
  )
  const { onAdded, onClose } = renderModal()

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } })
  fireEvent.click(screen.getByRole('button', { name: /^Zelda/ }))
  fireEvent.click(screen.getByRole('button', { name: /^Portal 2/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Add 2 games' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(en.groups.addError)
  expect(onAdded).toHaveBeenCalledWith([{ id: 1, source: 'ra', game_id: 620 }])
  expect(onClose).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Add 1 game' })).toBeInTheDocument()
})

test('treats a network error like a failed add', async () => {
  ;(global.fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const { onAdded } = renderModal()

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zelda' } })
  fireEvent.click(screen.getByRole('button', { name: /^Zelda/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Add 1 game' }))

  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(onAdded).not.toHaveBeenCalled()
})

test('a pasted RA id offers that RA game', async () => {
  ;(fetchRaCandidateById as jest.Mock).mockResolvedValue(candidate('ra', 1234, 'Metroid'))
  renderModal()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '1234' } })
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`${en.search.openById} #1234`) }))
  expect(await screen.findByText('Metroid')).toBeInTheDocument()
  expect(fetchRaCandidateById).toHaveBeenCalledWith(1234)
})

test('opening it again starts over: no search and nothing selected from last time', () => {
  const props = { onClose: jest.fn(), groupId: 3, existingKeys: new Set<string>(), onAdded: jest.fn() }
  const { rerender } = render(<AddGameModal isOpen {...props} />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zel' } })
  fireEvent.click(screen.getByRole('button', { name: /^Zelda/ }))
  expect(screen.getByText('Add 1 game')).toBeInTheDocument()

  rerender(<AddGameModal isOpen={false} {...props} />)
  rerender(<AddGameModal isOpen {...props} />)
  expect(screen.getByRole('textbox')).toHaveValue('')
  expect(screen.queryByText('Add 1 game')).not.toBeInTheDocument()
})

test('opens on suggestions: games being played first, nothing typed', () => {
  const WANTED = { ...candidate('ra', 7, 'Metroid'), status: 'want-to-play' as const, pctWon: 0 }
  ;(useGameCandidates as jest.Mock).mockReturnValue([WANTED, ZELDA])
  renderModal({ groupTitle: 'October' })
  expect(screen.getByRole('dialog', { name: en.groups.addGames })).toBeInTheDocument()
  expect(screen.getByText('Add to “October”')).toBeInTheDocument()
  expect(screen.getByText(en.groups.suggestions)).toBeInTheDocument()
  const names = screen.getAllByRole('button', { pressed: false }).map((b) => b.textContent)
  expect(names.findIndex((n) => n?.startsWith('Zelda'))).toBeLessThan(names.findIndex((n) => n?.startsWith('Metroid')))
})

test('narrows to one platform', () => {
  renderModal()
  fireEvent.click(screen.getByRole('button', { name: /^Steam$/ }))
  expect(screen.queryByRole('button', { name: /^Zelda/ })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^Portal 2/ })).toBeInTheDocument()
})

test('says when nothing matches, and the add button waits for a pick', () => {
  renderModal()
  expect(screen.getByRole('button', { name: en.groups.addGames })).toBeDisabled()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'xyz' } })
  expect(screen.getByText('No games match “xyz”')).toBeInTheDocument()
})
