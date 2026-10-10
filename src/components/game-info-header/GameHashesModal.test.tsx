import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import GameHashesModal from './GameHashesModal'

const HASHES = [
  { MD5: 'aaaa1111', Name: 'Sonic (USA).md', Labels: ['nointro'], PatchUrl: null },
  { MD5: 'bbbb2222', Name: 'Sonic (EU).md', Labels: [], PatchUrl: null },
]

const answer = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) })

function setup(props: Partial<React.ComponentProps<typeof GameHashesModal>> = {}) {
  const onClose = jest.fn()
  const utils = render(<GameHashesModal isOpen onClose={onClose} gameId={7} gameTitle="Sonic" {...props} />)
  return { onClose, ...utils }
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue(answer({ Results: HASHES }))
})

test('asks nothing while closed', () => {
  setup({ isOpen: false })
  expect(fetch).not.toHaveBeenCalled()
})

test('opening it asks for the game hashes and lists them', async () => {
  setup()
  expect(fetch).toHaveBeenCalledWith('/api/getGameHashes?gameId=7')
  expect(await screen.findByText('Sonic (USA).md')).toBeInTheDocument()
  expect(screen.getByText('Sonic (EU).md')).toBeInTheDocument()
  expect(screen.getByText(/2 hashes registrados/)).toBeInTheDocument()
})

test('says when the game has none', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({ Results: [] }))
  setup()
  expect(await screen.findByText('Sin hashes registrados')).toBeInTheDocument()
})

test('says so when the request fails, and shows no stale list', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({}, false))
  setup()
  expect(await screen.findByRole('alert')).toHaveTextContent('Error al cargar hashes')
})

test('a network failure is the same message, not a crash', async () => {
  ;(fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  setup()
  expect(await screen.findByRole('alert')).toBeInTheDocument()
})

test('shows loading until the answer is in', async () => {
  let resolve!: (v: unknown) => void
  ;(fetch as jest.Mock).mockReturnValue(new Promise((r) => { resolve = r }))
  setup()
  expect(screen.queryByText('Sonic (USA).md')).not.toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  await act(async () => { resolve(answer({ Results: HASHES })) })
  expect(await screen.findByText('Sonic (USA).md')).toBeInTheDocument()
})

test('another game asks again', async () => {
  const { rerender, onClose } = setup()
  await screen.findByText('Sonic (USA).md')
  ;(fetch as jest.Mock).mockResolvedValue(answer({ Results: [HASHES[1]] }))
  rerender(<GameHashesModal isOpen onClose={onClose} gameId={8} gameTitle="Other" />)
  expect(fetch).toHaveBeenLastCalledWith('/api/getGameHashes?gameId=8')
  await waitFor(() => expect(screen.queryByText('Sonic (USA).md')).not.toBeInTheDocument())
})

test('an answer for a game that was closed in the meantime does not land', async () => {
  let resolve!: (v: unknown) => void
  ;(fetch as jest.Mock).mockReturnValue(new Promise((r) => { resolve = r }))
  const { rerender, onClose } = setup()
  rerender(<GameHashesModal isOpen={false} onClose={onClose} gameId={7} gameTitle="Sonic" />)
  await act(async () => { resolve(answer({ Results: HASHES })) })
  expect(screen.queryByText('Sonic (USA).md')).not.toBeInTheDocument()
})

test('closing with the X or the backdrop', async () => {
  const { onClose } = setup()
  await screen.findByText('Sonic (USA).md')
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }))
  expect(onClose).toHaveBeenCalledTimes(2)
})
