jest.mock('@/components/groups/group-modal-game-picker/GroupModalGamePicker', () => ({
  __esModule: true,
  default: ({ enabled, onChange }: { enabled: boolean; onChange: (games: unknown[]) => void }) => (
    <button type="button" data-testid="picker" data-enabled={String(enabled)} onClick={() => onChange([{ id: 1, source: 'ra', title: 'Sonic' }])}>
      picker
    </button>
  ),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GroupModal from './GroupModal'
import { en } from '@/translations/en'
import type { GameGroup } from '@/types/types'

const GROUP = { id: 5, title: 'Speedruns', description: 'Fast ones', icon: '🏃', is_public: true } as GameGroup

const title = () => screen.getByLabelText(en.groups.groupTitle) as HTMLInputElement
const description = () => screen.getByLabelText(en.groups.description) as HTMLInputElement
const icon = () => screen.getByLabelText(en.groups.icon) as HTMLInputElement
const isPublic = () => screen.getByRole('switch', { name: en.groups.isPublic })

function setup(props: Partial<React.ComponentProps<typeof GroupModal>> = {}) {
  const onSave = jest.fn().mockResolvedValue(undefined)
  const onClose = jest.fn()
  const utils = render(<GroupModal isOpen onClose={onClose} onSave={onSave} {...props} />)
  return { onSave, onClose, ...utils }
}

test('renders nothing while closed', () => {
  const { container } = render(<GroupModal isOpen={false} onClose={jest.fn()} onSave={jest.fn()} />)
  expect(container).toBeEmptyDOMElement()
})

test('a new group starts empty and private, and creates with what was typed and the games picked', async () => {
  const { onSave, onClose } = setup()
  expect(screen.getByRole('heading', { name: en.groups.newGroup })).toBeInTheDocument()
  expect(title()).toHaveValue('')
  expect(isPublic()).toHaveAttribute('aria-checked', 'false')

  fireEvent.change(title(), { target: { value: '  Backlog  ' } })
  fireEvent.change(description(), { target: { value: 'Later' } })
  fireEvent.click(isPublic())
  fireEvent.click(screen.getByTestId('picker'))
  fireEvent.click(screen.getByRole('button', { name: en.groups.create }))

  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
  expect(onSave).toHaveBeenCalledWith({
    title: 'Backlog',
    description: 'Later',
    icon: '',
    is_public: true,
    initialGames: [{ id: 1, source: 'ra', title: 'Sonic' }],
  })
  await waitFor(() => expect(onClose).toHaveBeenCalled())
})

test('editing starts from the group, offers no game picker, and saves without initial games', async () => {
  const { onSave } = setup({ group: GROUP })
  expect(screen.getByRole('heading', { name: en.groups.editGroup })).toBeInTheDocument()
  expect(title()).toHaveValue('Speedruns')
  expect(description()).toHaveValue('Fast ones')
  expect(icon()).toHaveValue('🏃')
  expect(isPublic()).toHaveAttribute('aria-checked', 'true')
  expect(screen.queryByTestId('picker')).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: en.groups.save }))
  await waitFor(() => expect(onSave).toHaveBeenCalled())
  expect(onSave.mock.calls[0][0]).toMatchObject({ title: 'Speedruns', initialGames: undefined })
})

test('a title is required: nothing is saved and the field is named in an alert', () => {
  const { onSave } = setup()
  fireEvent.click(screen.getByRole('button', { name: en.groups.create }))
  expect(screen.getByRole('alert')).toHaveTextContent(en.groups.groupTitle)
  expect(onSave).not.toHaveBeenCalled()
})

test('a failed save keeps the modal open and says why', async () => {
  const { onSave, onClose } = setup()
  onSave.mockRejectedValue(new Error('Title taken'))
  fireEvent.change(title(), { target: { value: 'X' } })
  fireEvent.click(screen.getByRole('button', { name: en.groups.create }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Title taken'))
  expect(onClose).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: en.groups.create })).toBeEnabled()
})

test('opening it again starts the form over, not from what was left in it', () => {
  const onSave = jest.fn()
  const { rerender } = render(<GroupModal isOpen onClose={jest.fn()} onSave={onSave} />)
  fireEvent.change(title(), { target: { value: 'Left over' } })
  rerender(<GroupModal isOpen={false} onClose={jest.fn()} onSave={onSave} />)
  rerender(<GroupModal isOpen onClose={jest.fn()} onSave={onSave} />)
  expect(title()).toHaveValue('')
})

test('switching to another group while open fills the form with that one', () => {
  const other = { ...GROUP, id: 6, title: 'Backlog', is_public: false } as GameGroup
  const onSave = jest.fn()
  const { rerender } = render(<GroupModal isOpen group={GROUP} onClose={jest.fn()} onSave={onSave} />)
  rerender(<GroupModal isOpen group={other} onClose={jest.fn()} onSave={onSave} />)
  expect(title()).toHaveValue('Backlog')
  expect(isPublic()).toHaveAttribute('aria-checked', 'false')
})

test('an image URL as the icon is shown as an image, anything else as text', () => {
  setup()
  fireEvent.change(icon(), { target: { value: 'https://x.test/a.png' } })
  expect(screen.getByAltText(en.groups.icon)).toHaveAttribute('src', 'https://x.test/a.png')
  fireEvent.change(icon(), { target: { value: '🎮' } })
  expect(screen.queryByAltText(en.groups.icon)).not.toBeInTheDocument()
})

test('cancel closes without saving', () => {
  const { onSave, onClose } = setup()
  fireEvent.click(screen.getByRole('button', { name: en.groups.cancel }))
  expect(onClose).toHaveBeenCalled()
  expect(onSave).not.toHaveBeenCalled()
})
