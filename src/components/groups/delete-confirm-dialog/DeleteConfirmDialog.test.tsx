import { render, screen, fireEvent } from '@testing-library/react'
import DeleteConfirmDialog from './DeleteConfirmDialog'

const mockT = {
  groups: { confirmDelete: 'Are you sure?', cancel: 'Cancel', deleteGroup: 'Delete' },
  cards: { close: 'Close' },
}
jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ T: mockT }),
}))

describe('DeleteConfirmDialog', () => {
  it('renders null when not open', () => {
    const { container } = render(
      <DeleteConfirmDialog isOpen={false} onClose={() => {}} onConfirm={() => {}} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders dialog when open', () => {
    render(<DeleteConfirmDialog isOpen={true} onClose={() => {}} onConfirm={() => {}} />)
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn()
    render(<DeleteConfirmDialog isOpen={true} onClose={onClose} onConfirm={() => {}} />)
    fireEvent.click(screen.getByRole('alertdialog').parentElement!)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when cancel button is clicked', () => {
    const onClose = jest.fn()
    render(<DeleteConfirmDialog isOpen={true} onClose={onClose} onConfirm={() => {}} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onConfirm when delete button is clicked', () => {
    const onConfirm = jest.fn()
    render(<DeleteConfirmDialog isOpen={true} onClose={() => {}} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Delete'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('is a named alertdialog, closed by Escape and by its named corner button', () => {
    const onClose = jest.fn()
    render(<DeleteConfirmDialog isOpen={true} onClose={onClose} onConfirm={() => {}} />)
    expect(screen.getByRole('alertdialog', { name: 'Are you sure?' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('does not close when dialog content is clicked', () => {
    const onClose = jest.fn()
    render(<DeleteConfirmDialog isOpen={true} onClose={onClose} onConfirm={() => {}} />)
    fireEvent.click(screen.getByText('Are you sure?'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
