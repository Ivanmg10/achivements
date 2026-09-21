import { render, screen, fireEvent } from '@testing-library/react'
import GroupModalGamePicker from './GroupModalGamePicker'
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
    imageRef: '', pctWon: 0, numAwarded: 0, maxPossible: 0, status: null,
  }
}

const ZELDA = candidate('ra', 620, 'Zelda')
const PORTAL = candidate('steam', 620, 'Portal 2')

beforeEach(() => {
  jest.clearAllMocks()
  ;(useGameCandidates as jest.Mock).mockReturnValue([ZELDA, PORTAL])
})

test('loads candidates only while enabled', () => {
  render(<GroupModalGamePicker enabled={false} selected={[]} onChange={jest.fn()} />)
  expect(useGameCandidates).toHaveBeenCalledWith(false)
})

test('the search box is labelled', () => {
  render(<GroupModalGamePicker enabled selected={[]} onChange={jest.fn()} />)
  expect(screen.getByLabelText(en.groups.addGame)).toBeInTheDocument()
})

test('picking a Steam match adds it', () => {
  const onChange = jest.fn()
  render(<GroupModalGamePicker enabled selected={[ZELDA]} onChange={onChange} />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'portal' } })
  fireEvent.click(screen.getByRole('button', { name: /Portal 2/ }))
  expect(onChange).toHaveBeenCalledWith([ZELDA, PORTAL])
})

test('chosen games are not offered again, even when the other platform has the same id', () => {
  render(<GroupModalGamePicker enabled selected={[PORTAL]} onChange={jest.fn()} />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } })
  expect(screen.getByRole('button', { name: /Zelda/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Portal 2 Steam/ })).not.toBeInTheDocument()
})

test('a chosen game can be removed, and Steam ones are marked', () => {
  const onChange = jest.fn()
  render(<GroupModalGamePicker enabled selected={[ZELDA, PORTAL]} onChange={onChange} />)
  expect(screen.getByLabelText('Steam')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: `${en.groups.removeGame} Portal 2` }))
  expect(onChange).toHaveBeenCalledWith([ZELDA])
})

test('adds an RA game by pasted id', async () => {
  const metroid = candidate('ra', 1234, 'Metroid')
  ;(fetchRaCandidateById as jest.Mock).mockResolvedValue(metroid)
  const onChange = jest.fn()
  render(<GroupModalGamePicker enabled selected={[]} onChange={onChange} />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '1234' } })
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`${en.search.openById} #1234`) }))
  await screen.findByRole('textbox')
  await new Promise((r) => setTimeout(r, 0))
  expect(onChange).toHaveBeenCalledWith([metroid])
})

test('says so when a pasted id is not found', async () => {
  ;(fetchRaCandidateById as jest.Mock).mockResolvedValue(null)
  render(<GroupModalGamePicker enabled selected={[]} onChange={jest.fn()} />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '99999' } })
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`${en.search.openById} #99999`) }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.search.noResults)
})
