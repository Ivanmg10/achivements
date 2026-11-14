import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import GameHashesModal from './GameHashesModal'
import { en } from '@/translations/en'

const HASHES = [
  { MD5: 'aaaa1111', Name: 'Sonic (USA).md', Labels: ['nointro'], PatchUrl: null },
  { MD5: 'bbbb2222', Name: 'Sonic (EU).md', Labels: [], PatchUrl: null },
]

// A 4xx is final (asking again will not fix it): the error shows at once. A 5xx or a lost network is retried first.
const answer = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 404, json: () => Promise.resolve(body) })

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
  expect(fetch).toHaveBeenCalledWith('/api/getGameHashes?gameId=7', expect.anything())
  expect(await screen.findByText('Sonic (USA).md')).toBeInTheDocument()
  expect(screen.getByText('Sonic (EU).md')).toBeInTheDocument()
  expect(screen.getByText('2 registered hashes')).toBeInTheDocument()
})

test('says when the game has none', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({ Results: [] }))
  setup()
  expect(await screen.findByText(en.gameInfoPage.hashesNone)).toBeInTheDocument()
})

test('says so when the request fails, and shows no stale list', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({}, false))
  setup()
  expect(await screen.findByRole('alert')).toHaveTextContent(en.gameInfoPage.hashesLoadError)
})

test('a lost network is retried in the background, then says so with a way to ask again', async () => {
  jest.useFakeTimers()
  try {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(fetch as jest.Mock).mockRejectedValue(new Error('offline'))
    setup()
    await act(async () => { await jest.advanceTimersByTimeAsync(10 * 60_000) })
    expect(screen.getByRole('alert')).toHaveTextContent(en.gameInfoPage.hashesLoadError)
    ;(fetch as jest.Mock).mockResolvedValue(answer({ Results: HASHES }))
    fireEvent.click(screen.getByRole('button', { name: en.gameInfoPage.retry }))
    await act(async () => { await jest.advanceTimersByTimeAsync(0) })
    expect(screen.getByText('Sonic (USA).md')).toBeInTheDocument()
  } finally {
    jest.useRealTimers()
  }
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
  expect(fetch).toHaveBeenLastCalledWith('/api/getGameHashes?gameId=8', expect.anything())
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
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  fireEvent.click(screen.getByRole('dialog').parentElement!)
  expect(onClose).toHaveBeenCalledTimes(2)
})

test('a hash can be copied, with the check said aloud, and its label is a sentence-case tag', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined)
  Object.assign(navigator, { clipboard: { writeText } })
  setup()
  await screen.findByText('Sonic (USA).md')
  expect(screen.getByText('No-Intro').className).not.toMatch(/uppercase/)
  fireEvent.click(screen.getAllByRole('button', { name: en.gameInfoPage.hashesCopy })[0])
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('aaaa1111'))
  expect(await screen.findByText(en.gameInfoPage.hashesCopied)).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: en.gameInfoPage.hashesCopy })[0]).toHaveAttribute('type', 'button')
})
