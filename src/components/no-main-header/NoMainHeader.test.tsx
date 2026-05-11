import { render, screen, fireEvent } from '@testing-library/react'
import NoMainHeader from './NoMainHeader'
import { useRouter } from 'next/navigation'

test('renders back button', () => {
  render(<NoMainHeader />)
  expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument()
})

test('clicking back button calls router.back()', () => {
  const mockBack = jest.fn()
  ;(useRouter as jest.Mock).mockReturnValue({ back: mockBack })
  render(<NoMainHeader />)
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
  expect(mockBack).toHaveBeenCalled()
})
