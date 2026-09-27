import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FavoriteGameModal from './FavoriteGameModal'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { en } from '@/translations/en'
import type { GameCandidate } from '@/utils/gameCandidates'

jest.mock('@/hooks/useGameCandidates', () => ({ useGameCandidates: jest.fn() }))
jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

function candidate(source: 'ra' | 'steam', id: number, title: string): GameCandidate {
  return {
    key: `${source}:${id}`, source, id, title, subtitle: source === 'ra' ? 'SNES' : 'Steam',
    imageRef: '', pctWon: 0, numAwarded: 0, maxPossible: 0, status: null,
  }
}

const ZELDA = candidate('ra', 1, 'Zelda')
const PORTAL = candidate('steam', 620, 'Portal 2')

function renderModal(props: Partial<React.ComponentProps<typeof FavoriteGameModal>> = {}) {
  const onSave = jest.fn().mockResolvedValue(undefined)
  const onClose = jest.fn()
  render(
    <FavoriteGameModal isOpen source="ra" current={null} onClose={onClose} onSave={onSave} {...props} />,
  )
  return { onSave, onClose }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useGameCandidates as jest.Mock).mockReturnValue([ZELDA, PORTAL])
})

test('renders nothing when closed', () => {
  const { container } = render(
    <FavoriteGameModal isOpen={false} source="ra" current={null} onClose={jest.fn()} onSave={jest.fn()} />,
  )
  expect(container.innerHTML).toBe('')
})

test('only offers games from its own platform', () => {
  renderModal({ source: 'steam' })
  expect(screen.getByRole('button', { name: /Portal 2/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Zelda/ })).not.toBeInTheDocument()
})

test('suggests games before anything is typed, and searches after', () => {
  renderModal()
  expect(screen.getByRole('button', { name: /Zelda/ })).toBeInTheDocument()

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'xyz' } })
  expect(screen.getByText(en.userData.favoriteGameNoResults)).toBeInTheDocument()
})

test('picking a game saves it and closes', async () => {
  const { onSave, onClose } = renderModal()
  fireEvent.click(screen.getByRole('button', { name: /Zelda/ }))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(onSave).toHaveBeenCalledWith({ id: 1, title: 'Zelda', imageIcon: '' })
})

test('the current favourite can be removed, or cleared by picking it again', async () => {
  const { onSave } = renderModal({ current: { id: 1, title: 'Zelda', imageIcon: '' } })
  fireEvent.click(screen.getByRole('button', { name: en.userData.favoriteGameRemove }))
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(null))
})

test('a failed save stays open and says so', async () => {
  const onSave = jest.fn().mockRejectedValue(new Error('nope'))
  const onClose = jest.fn()
  render(<FavoriteGameModal isOpen source="ra" current={null} onClose={onClose} onSave={onSave} />)

  fireEvent.click(screen.getByRole('button', { name: /Zelda/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.userData.favoriteGameError)
  expect(onClose).not.toHaveBeenCalled()
})
