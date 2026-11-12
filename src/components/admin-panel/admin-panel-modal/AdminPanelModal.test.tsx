import { act, fireEvent, render, screen } from '@testing-library/react'
import AdminPanelModal from './AdminPanelModal'

let reportMode: (mode: 'loading' | 'locked' | 'open') => void = () => {}
jest.mock('@/components/admin-panel/AdminPanel', () => ({
  __esModule: true,
  default: ({ onModeChange }: { onModeChange: (m: 'loading' | 'locked' | 'open') => void }) => {
    reportMode = onModeChange
    return <div>panel body</div>
  },
}))

test('shows nothing while closed', () => {
  render(<AdminPanelModal isOpen={false} onClose={jest.fn()} />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('opens the admin panel in a named dialog', () => {
  render(<AdminPanelModal isOpen onClose={jest.fn()} />)
  act(() => reportMode('open'))
  expect(screen.getByRole('dialog', { name: 'Admin panel' })).toHaveTextContent('panel body')
})

test('the close button and the backdrop close it; a click inside does not', () => {
  const onClose = jest.fn()
  render(<AdminPanelModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByText('panel body'))
  expect(onClose).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('dialog').parentElement!)
  expect(onClose).toHaveBeenCalledTimes(2)
})

test('Escape closes it when it is the top dialog', () => {
  const onClose = jest.fn()
  render(<AdminPanelModal isOpen onClose={onClose} />)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})

test('Escape leaves it open while another dialog sits over it', () => {
  const onClose = jest.fn()
  render(
    <>
      <AdminPanelModal isOpen onClose={onClose} />
    </>,
  )
  const other = document.createElement('div')
  other.setAttribute('role', 'dialog')
  document.body.appendChild(other)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(onClose).not.toHaveBeenCalled()
  other.remove()
})

test('until it is known the head claims neither title and the body is the unlock skeleton (#132)', () => {
  render(<AdminPanelModal isOpen onClose={jest.fn()} />)
  expect(screen.queryByText('Admin panel')).not.toBeInTheDocument()
  expect(screen.queryByText('Unlock the admin panel')).not.toBeInTheDocument()
  expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-[33.75rem]')
  expect(screen.getAllByRole('status')[0]).toHaveTextContent('Loading')
  expect(screen.getByText('panel body').parentElement).toHaveAttribute('hidden')
  act(() => reportMode('locked'))
  expect(screen.getByRole('dialog', { name: 'Unlock the admin panel' })).toHaveClass('sm:max-w-[33.75rem]')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('the door has one title, with the lock; the open panel has the shield (#132)', () => {
  render(<AdminPanelModal isOpen onClose={jest.fn()} />)
  act(() => reportMode('locked'))
  const dialog = screen.getByRole('dialog', { name: 'Unlock the admin panel' })
  expect(dialog.querySelectorAll('h1, h2, h3')).toHaveLength(1)
  expect(screen.getByTestId('IconLock')).toBeInTheDocument()
  act(() => reportMode('open'))
  expect(screen.getByRole('dialog', { name: 'Admin panel' })).toBeInTheDocument()
  expect(screen.getByTestId('IconShield')).toBeInTheDocument()
})

test('narrow while it is only the password door, wide once the panel is open', () => {
  render(<AdminPanelModal isOpen onClose={jest.fn()} />)
  act(() => reportMode('locked'))
  expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-[33.75rem]')
  act(() => reportMode('open'))
  expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-5xl')
})
