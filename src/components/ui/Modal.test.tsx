import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'

it('has a head that names it, a footer and the close in the corner', () => {
  const onClose = jest.fn()
  render(
    <Modal isOpen onClose={onClose} title="Change password" hint="You will be signed out" footer={<button>Save</button>}>
      <input aria-label="Current" />
    </Modal>,
  )
  const dialog = screen.getByRole('dialog', { name: 'Change password' })
  expect(dialog).toHaveAccessibleDescription('You will be signed out')
  expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})

it('can darken the page behind an immersive dialog', () => {
  render(<Modal isOpen onClose={jest.fn()} backdrop="opaque" title="Layout"><p>Choices</p></Modal>)
  expect(screen.getByRole('dialog', { name: 'Layout' }).parentElement).toHaveClass('bg-black/80')
})

it('can leave the blur out, for a page that takes part in a view transition', () => {
  render(<Modal isOpen onClose={jest.fn()} backdrop="dim" title="Theme"><p>Choices</p></Modal>)
  const backdrop = screen.getByRole('dialog', { name: 'Theme' }).parentElement
  expect(backdrop).toHaveClass('bg-black/60')
  expect(backdrop?.className).not.toContain('backdrop-blur')
})

it('is an alertdialog for a dangerous confirmation', () => {
  render(<Modal isOpen onClose={jest.fn()} tone="danger" title="Delete group?"><p>Gone for good</p></Modal>)
  expect(screen.getByRole('alertdialog', { name: 'Delete group?' })).toBeInTheDocument()
})

it('moves focus in and keeps Tab inside', () => {
  render(
    <Modal isOpen onClose={jest.fn()} title="Pick" showClose={false}>
      <button>First</button>
      <button>Last</button>
    </Modal>,
  )
  const first = screen.getByRole('button', { name: 'First' })
  const last = screen.getByRole('button', { name: 'Last' })
  expect(screen.getByRole('dialog')).toHaveFocus()
  last.focus()
  fireEvent.keyDown(document, { key: 'Tab' })
  expect(first).toHaveFocus()
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
  expect(last).toHaveFocus()
})

it('closes on Escape and gives focus back', () => {
  const opener = document.createElement('button')
  document.body.appendChild(opener)
  opener.focus()
  const onClose = jest.fn()
  const { rerender } = render(<Modal isOpen onClose={onClose} aria-label="Menu"><button>Item</button></Modal>)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
  rerender(<Modal isOpen={false} onClose={onClose} aria-label="Menu"><button>Item</button></Modal>)
  expect(opener).toHaveFocus()
})
