import { fireEvent, render, screen } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import MobileNavModal from './MobileNavModal'

const push = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ push })
  ;(usePathname as jest.Mock).mockReturnValue('/')
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan' } } })
})

test('renders nothing when closed', () => {
  render(<MobileNavModal isOpen={false} onClose={jest.fn()} />)
  expect(screen.queryByText('Status')).not.toBeInTheDocument()
})

test('renders a collapsed Status group and a top-level Groups item', () => {
  render(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  expect(screen.getByText('Status')).toBeInTheDocument()
  expect(screen.getByText('Groups')).toBeInTheDocument()
  expect(screen.queryByText('Playing')).not.toBeInTheDocument()
})

test('expands the Status group to reveal the 3 status links', () => {
  render(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.click(screen.getByText('Status'))
  expect(screen.getByText('Playing')).toBeInTheDocument()
  expect(screen.getByText('Want to play')).toBeInTheDocument()
  expect(screen.getByText('Completed')).toBeInTheDocument()
})

test('navigates to a status route and closes the modal when signed in', () => {
  const onClose = jest.fn()
  render(<MobileNavModal isOpen={true} onClose={onClose} />)
  fireEvent.click(screen.getByText('Status'))
  fireEvent.click(screen.getByText('Playing'))
  expect(push).toHaveBeenCalledWith('/playing')
  expect(onClose).toHaveBeenCalled()
})

test('redirects to authPage when navigating a status route without a session', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  render(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.click(screen.getByText('Status'))
  fireEvent.click(screen.getByText('Playing'))
  expect(push).toHaveBeenCalledWith('/authPage')
})

test('collapses the Status group again when isOpen becomes false and reopens', () => {
  const { rerender } = render(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.click(screen.getByText('Status'))
  expect(screen.getByText('Playing')).toBeInTheDocument()
  rerender(<MobileNavModal isOpen={false} onClose={jest.fn()} />)
  rerender(<MobileNavModal isOpen={true} onClose={jest.fn()} />)
  expect(screen.queryByText('Playing')).not.toBeInTheDocument()
})
