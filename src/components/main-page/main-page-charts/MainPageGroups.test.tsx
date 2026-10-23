jest.mock('@/utils/apiCallsUtils', () => ({ addGamesToGroup: jest.fn() }))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/components/groups/GroupModal', () => ({
  __esModule: true,
  default: ({ isOpen, onSave }: { isOpen: boolean; onSave: (d: unknown) => Promise<void> }) =>
    isOpen ? (
      <button
        data-testid="modal-save"
        onClick={() => onSave({ title: 'New', description: '', icon: '', is_public: false, initialGames: (globalThis as { __games?: unknown[] }).__games }).catch(() => {})}
      >
        modal
      </button>
    ) : null,
}))
jest.mock('@/components/groups/group-icon/GroupIcon', () => ({ __esModule: true, default: () => <span data-testid="icon" /> }))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MainPageGroups from './MainPageGroups'
import { addGamesToGroup } from '@/utils/apiCallsUtils'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'

const group = (id: number, over: Record<string, unknown> = {}) => ({
  id, title: `Group ${id}`, description: null, icon: null, is_public: false, position: id,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', game_count: 3, steam_count: 0, psn_count: 0,
  total_awarded: 4, total_possible: 10, ...over,
})

const createGroup = jest.fn()
let props: React.ComponentProps<typeof MainPageGroups>

function state(groups: unknown[], over: Partial<React.ComponentProps<typeof MainPageGroups>> = {}) {
  props = { groups: groups as React.ComponentProps<typeof MainPageGroups>['groups'], isLoading: false, createGroup, ...over }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(globalThis as { __games?: unknown[] }).__games = undefined
  createGroup.mockResolvedValue({ id: 99 })
  ;(addGamesToGroup as jest.Mock).mockResolvedValue([])
  state([group(1), group(2)])
})

test('a skeleton while loading, with no way to create yet', () => {
  state([], { isLoading: true })
  const { container } = render(<MainPageGroups {...props} />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: en.groups.newGroup })).not.toBeInTheDocument()
})

test('no groups: says so and offers to create the first', async () => {
  state([])
  render(<MainPageGroups {...props} />)
  expect(screen.getByText(en.groups.noGroups)).toBeInTheDocument()
  // The "+" in the header and the button under the empty state both start it.
  expect(screen.getAllByRole('button', { name: en.groups.newGroup })).toHaveLength(2)
  fireEvent.click(screen.getAllByRole('button', { name: en.groups.newGroup })[1])
  expect(await screen.findByTestId('modal-save')).toBeInTheDocument()
})

test('lists each group as a link with its title, games and progress', () => {
  render(<MainPageGroups {...props} />)
  const link = screen.getByRole('link', { name: /Group 1/ })
  expect(link).toHaveAttribute('href', '/groups/1')
  expect(screen.getByRole('progressbar', { name: 'Group 1' })).toBeInTheDocument()
  expect(link).toHaveTextContent('40%')
})

test('stops at four groups and points to the rest', () => {
  state([1, 2, 3, 4, 5, 6].map((n) => group(n)))
  render(<MainPageGroups {...props} />)
  expect(screen.getAllByRole('link', { name: /Group \d/ })).toHaveLength(4)
  expect(screen.getByRole('link', { name: new RegExp(en.cards.moreMatches.replace('{n}', '2')) })).toHaveAttribute('href', '/groups')
})

test('given onSelect, every group is listed as a toggle that says which is shown', () => {
  const onSelect = jest.fn()
  state([1, 2, 3, 4, 5].map((n) => group(n)))
  render(<MainPageGroups {...props} onSelect={onSelect} selectedId={2} />)
  const rows = screen.getAllByRole('button', { pressed: undefined }).filter((b) => /Group \d/.test(b.textContent ?? ''))
  expect(rows).toHaveLength(5)
  expect(screen.getByRole('button', { name: /Group 2/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: /Group 3/ })).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(screen.getByRole('button', { name: /Group 3/ }))
  expect(onSelect).toHaveBeenCalledWith(3)
})

test('with ten groups there is no more room to create', () => {
  state(Array.from({ length: 10 }, (_, i) => group(i + 1)))
  render(<MainPageGroups {...props} />)
  expect(screen.queryByRole('button', { name: en.groups.newGroup })).not.toBeInTheDocument()
})

test('groups are not deleted from here', () => {
  render(<MainPageGroups {...props} />)
  expect(screen.queryByRole('button', { name: en.groups.deleteGroup })).not.toBeInTheDocument()
})

describe('creating', () => {
  const open = async () => {
    fireEvent.click(screen.getAllByRole('button', { name: en.groups.newGroup })[0])
    fireEvent.click(await screen.findByTestId('modal-save'))
  }

  test('creates the group, leaving empty fields out, and says so', async () => {
    render(<MainPageGroups {...props} />)
    await open()
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith(en.toast.groupCreated))
    expect(createGroup).toHaveBeenCalledWith({ title: 'New', description: undefined, icon: undefined, is_public: false })
    expect(addGamesToGroup).not.toHaveBeenCalled()
  })

  test('the games picked are added to it', async () => {
    ;(globalThis as { __games?: unknown[] }).__games = [{ id: 1 }, { id: 2 }]
    render(<MainPageGroups {...props} />)
    await open()
    await waitFor(() => expect(addGamesToGroup).toHaveBeenCalledWith(99, [{ id: 1 }, { id: 2 }]))
    expect(notify.success).toHaveBeenCalledWith(en.toast.groupCreated)
  })

  test('when some games could not be added, it says so instead of claiming success', async () => {
    ;(globalThis as { __games?: unknown[] }).__games = [{ id: 1 }]
    ;(addGamesToGroup as jest.Mock).mockResolvedValue([{ id: 1 }])
    render(<MainPageGroups {...props} />)
    await open()
    await waitFor(() => expect(notify.error).toHaveBeenCalledWith(en.toast.someGamesFailed))
    expect(notify.success).not.toHaveBeenCalled()
  })
})
