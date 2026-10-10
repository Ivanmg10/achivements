import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import GameInfoComments from './GameInfoComments'
import { en } from '@/translations/en'

const comment = (n: number) => ({ User: `user${n}`, Submitted: '2026-01-02T00:00:00Z', CommentText: `text ${n}`, ULID: `u${n}` })
const answer = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) })

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue(answer({ Results: [comment(1), comment(2)], Total: 2 }))
})

test('says it is loading, then lists the comments newest first', async () => {
  render(<GameInfoComments gameId={7} />)
  expect(screen.getByText(en.gameComments.loading)).toBeInTheDocument()
  expect(await screen.findByText('text 1')).toBeInTheDocument()
  expect(fetch).toHaveBeenCalledWith('/api/getGameComments?gameId=7')
  const texts = screen.getAllByText(/^text \d$/).map((n) => n.textContent)
  // RA sends them oldest first; the section shows the latest at the top.
  expect(texts).toEqual(['text 2', 'text 1'])
  expect(screen.getByText('(2)')).toBeInTheDocument()
})

test('draws nothing for a game with no comments', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({ Results: [], Total: 0 }))
  const { container } = render(<GameInfoComments gameId={7} />)
  await waitFor(() => expect(screen.queryByText(en.gameComments.loading)).not.toBeInTheDocument())
  expect(container).toBeEmptyDOMElement()
})

test('an answer with no Results is no comments, not a crash', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({}))
  const { container } = render(<GameInfoComments gameId={7} />)
  await waitFor(() => expect(screen.queryByText(en.gameComments.loading)).not.toBeInTheDocument())
  expect(container).toBeEmptyDOMElement()
})

test('a failed request says so in an alert', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({}, false))
  render(<GameInfoComments gameId={7} />)
  expect(await screen.findByRole('alert')).toHaveTextContent(en.gameComments.error)
})

test('a network failure says the same', async () => {
  ;(fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  render(<GameInfoComments gameId={7} />)
  expect(await screen.findByRole('alert')).toHaveTextContent(en.gameComments.error)
})

test('only the first few are shown until asked for more, and then folded again', async () => {
  const many = Array.from({ length: 8 }, (_, i) => comment(i + 1))
  ;(fetch as jest.Mock).mockResolvedValue(answer({ Results: many, Total: 8 }))
  render(<GameInfoComments gameId={7} />)
  await screen.findByText('text 8')
  expect(screen.getAllByText(/^text \d$/)).toHaveLength(5)

  fireEvent.click(screen.getByRole('button', { name: new RegExp(`${en.gameComments.showMore} \\(3\\)`) }))
  expect(screen.getAllByText(/^text \d$/)).toHaveLength(8)

  fireEvent.click(screen.getByRole('button', { name: en.gameComments.collapse }))
  expect(screen.getAllByText(/^text \d$/)).toHaveLength(5)
})

test('no "show more" for a short list', async () => {
  render(<GameInfoComments gameId={7} />)
  await screen.findByText('text 1')
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('another game loads again and shows loading meanwhile', async () => {
  const { rerender } = render(<GameInfoComments gameId={7} />)
  await screen.findByText('text 1')
  let resolve!: (v: unknown) => void
  ;(fetch as jest.Mock).mockReturnValue(new Promise((r) => { resolve = r }))
  rerender(<GameInfoComments gameId={8} />)
  expect(screen.getByText(en.gameComments.loading)).toBeInTheDocument()
  await act(async () => { resolve(answer({ Results: [comment(9)], Total: 1 })) })
  expect(await screen.findByText('text 9')).toBeInTheDocument()
  expect(screen.queryByText('text 1')).not.toBeInTheDocument()
})

test('a slow answer for the previous game does not land on the new one', async () => {
  let resolveOld!: (v: unknown) => void
  ;(fetch as jest.Mock).mockReturnValueOnce(new Promise((r) => { resolveOld = r }))
  const { rerender } = render(<GameInfoComments gameId={7} />)
  ;(fetch as jest.Mock).mockResolvedValue(answer({ Results: [comment(9)], Total: 1 }))
  rerender(<GameInfoComments gameId={8} />)
  await screen.findByText('text 9')
  await act(async () => { resolveOld(answer({ Results: [comment(1)], Total: 1 })) })
  expect(screen.queryByText('text 1')).not.toBeInTheDocument()
  expect(screen.getByText('text 9')).toBeInTheDocument()
})
