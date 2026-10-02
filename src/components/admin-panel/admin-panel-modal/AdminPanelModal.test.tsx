import { act, fireEvent, render, screen } from '@testing-library/react'
import AdminPanelModal from './AdminPanelModal'

let reportMode: (mode: 'loading' | 'locked' | 'open') => void = () => {}
jest.mock('@/components/admin-panel/AdminPanel', () => ({
  __esModule: true,
  default: ({ headerEnd, onModeChange }: { headerEnd: React.ReactNode; onModeChange: (m: 'loading' | 'locked' | 'open') => void }) => {
    reportMode = onModeChange
    return (
      <div>
        panel body
        {headerEnd}
      </div>
    )
  },
}))

test('shows nothing while closed', () => {
  render(<AdminPanelModal isOpen={false} onClose={jest.fn()} />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('opens the admin panel in a named dialog', () => {
  render(<AdminPanelModal isOpen onClose={jest.fn()} />)
  expect(screen.getByRole('dialog', { name: 'Admin panel' })).toHaveTextContent('panel body')
})

test('the close button and the backdrop close it; a click inside does not', () => {
  const onClose = jest.fn()
  render(<AdminPanelModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByText('panel body'))
  expect(onClose).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Close admin panel' }))
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

test('narrow while it is only the password door, wide once the panel is open', () => {
  render(<AdminPanelModal isOpen onClose={jest.fn()} />)
  act(() => reportMode('locked'))
  expect(screen.getByRole('dialog')).toHaveClass('max-w-md')
  act(() => reportMode('open'))
  expect(screen.getByRole('dialog')).toHaveClass('max-w-6xl')
})
