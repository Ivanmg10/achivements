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

it('opens near the top as a panel when placed there, centred (a sheet on a phone) by default', () => {
  const { rerender } = render(<Modal isOpen onClose={() => {}} aria-label="Search">x</Modal>)
  expect(screen.getByRole('dialog')).toHaveClass('rounded-t-card', 'sm:rounded-card')
  expect(screen.getByRole('dialog').parentElement).toHaveClass('items-end', 'sm:items-center')
  rerender(<Modal isOpen onClose={() => {}} aria-label="Search" placement="top">x</Modal>)
  expect(screen.getByRole('dialog')).toHaveClass('rounded-sheet')
  expect(screen.getByRole('dialog').parentElement).toHaveClass('items-start', 'pt-[12vh]')
})

it('can have no padding round its body, for rows that reach the edges', () => {
  const { rerender } = render(<Modal isOpen onClose={() => {}} aria-label="Search"><p>row</p></Modal>)
  expect(screen.getByText('row').parentElement).toHaveClass('px-6')
  rerender(<Modal isOpen onClose={() => {}} aria-label="Search" flush><p>row</p></Modal>)
  expect(screen.getByText('row').parentElement).not.toHaveClass('px-6')
})

test('a confirmation can be only its head and footer: no empty body', () => {
  render(<Modal isOpen onClose={jest.fn()} title="Delete it?" hint="Cannot be undone" footer={<button>Go</button>} />)
  const dialog = screen.getByRole('dialog', { name: 'Delete it?' })
  expect(dialog).toHaveAccessibleDescription('Cannot be undone')
  expect(dialog.querySelector('.overflow-y-auto')).toBeNull()
})

test('the footer keeps its actions at the right, under a hairline, at their normal size (#132)', () => {
  render(<Modal isOpen onClose={jest.fn()} title="Save it" footer={<><button>Cancel</button><button>Save</button></>} />)
  const footer = screen.getByRole('button', { name: 'Save' }).parentElement
  expect(footer).toHaveClass('justify-end', 'shadow-hairline-t')
})

test('a dialog never runs past 85dvh from sm, its head and footer fixed while the body scrolls (#165)', () => {
  render(<Modal isOpen onClose={jest.fn()} title="Long" footer={<button>Save</button>}><p>Body</p></Modal>)
  const dialog = screen.getByRole('dialog', { name: 'Long' })
  expect(dialog).toHaveClass('sm:max-h-[85dvh]', 'flex-col')
  expect(screen.getByText('Body').parentElement).toHaveClass('overflow-y-auto')
})

test('below sm a detail, a picker or a tool is a full-screen sheet; a confirmation stays a sheet (#165)', () => {
  const { rerender } = render(<Modal isOpen onClose={jest.fn()} size="xl" title="Pick"><p>Games</p></Modal>)
  expect(screen.getByRole('dialog', { name: 'Pick' })).toHaveClass('max-sm:h-dvh')
  rerender(<Modal isOpen onClose={jest.fn()} size="md" title="Pick"><p>Games</p></Modal>)
  expect(screen.getByRole('dialog', { name: 'Pick' })).not.toHaveClass('max-sm:h-dvh')
})

test('a toolbar sits between the head and the scrolling body, outside the scroll box (#165)', () => {
  render(
    <Modal isOpen onClose={jest.fn()} title="Pick" toolbar={<input aria-label="Search" />}>
      <p>The list</p>
    </Modal>,
  )
  const bar = screen.getByRole('textbox', { name: 'Search' }).parentElement!
  const body = screen.getByText('The list').parentElement!
  expect(body).toHaveClass('overflow-y-auto')
  expect(body.contains(bar)).toBe(false)
  // Order in the panel: head, toolbar, body.
  const kids = [...screen.getByRole('dialog').children]
  expect(kids.indexOf(bar)).toBeGreaterThan(kids.indexOf(screen.getByRole('heading', { name: 'Pick' }).parentElement!.parentElement!))
  expect(kids.indexOf(bar)).toBeLessThan(kids.indexOf(body))
})

test('a field with autoFocus keeps the focus the dialog would otherwise take', () => {
  render(<Modal isOpen onClose={jest.fn()} title="Search"><input aria-label="Query" autoFocus /></Modal>)
  expect(screen.getByRole('textbox', { name: 'Query' })).toHaveFocus()
})
