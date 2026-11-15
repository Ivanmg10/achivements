import { fireEvent, render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import MobileNavModal from './MobileNavModal'

beforeEach(() => {
  jest.clearAllMocks()
  ;(usePathname as jest.Mock).mockReturnValue('/')
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan' } } })
})

test('renders nothing when closed', () => {
  render(<MobileNavModal isOpen={false} onClose={jest.fn()} />)
  expect(screen.queryByText('Library')).not.toBeInTheDocument()
})

test('renders a collapsed Status group and a top-level Groups item', () => {
  render(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  expect(screen.getByText('Library')).toBeInTheDocument()
  expect(screen.getByText('Groups')).toBeInTheDocument()
  expect(screen.queryByText('In progress')).not.toBeInTheDocument()
})

test('expands the Status group to reveal the 3 status links', () => {
  render(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.click(screen.getByText('Library'))
  expect(screen.getByText('In progress')).toBeInTheDocument()
  expect(screen.getByText('Not started')).toBeInTheDocument()
  expect(screen.getByText('Completed')).toBeInTheDocument()
})

test('the entries are links: a status route closes the modal when signed in', () => {
  const onClose = jest.fn()
  render(<MobileNavModal isOpen={true} onClose={onClose} />)
  fireEvent.click(screen.getByText('Library'))
  const link = screen.getByRole('link', { name: 'In progress' })
  expect(link).toHaveAttribute('href', '/playing')
  fireEvent.click(link)
  expect(onClose).toHaveBeenCalled()
})

test('without a session every link leads to the sign-in', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  render(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.click(screen.getByText('Library'))
  expect(screen.getByRole('link', { name: 'In progress' })).toHaveAttribute('href', '/authPage')
  expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute('href', '/authPage')
})

test('the page you are on is marked with aria-current', () => {
  ;(usePathname as jest.Mock).mockReturnValue('/groups')
  render(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Following' })).not.toHaveAttribute('aria-current')
})

test('collapses the Status group again when isOpen becomes false and reopens', () => {
  const { rerender } = render(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.click(screen.getByText('Library'))
  expect(screen.getByText('In progress')).toBeInTheDocument()
  rerender(<MobileNavModal isOpen={false} onClose={jest.fn()} />)
  rerender(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  expect(screen.queryByText('In progress')).not.toBeInTheDocument()
})

test('it is a dialog named by its title, near the top, that Escape closes', () => {
  const onClose = jest.fn()
  render(<MobileNavModal isOpen={true} onClose={onClose} />)
  expect(screen.getByRole('dialog', { name: 'Menu' })).toHaveClass('rounded-sheet')
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})

test('Following is a top-level item that opens who you follow', () => {
  const onClose = jest.fn()
  render(<MobileNavModal isOpen={true} onClose={onClose} />)
  fireEvent.click(screen.getByText('Following'))
  expect(screen.getByRole('link', { name: 'Following' })).toHaveAttribute('href', '/following')
  expect(onClose).toHaveBeenCalled()
})
