import { fireEvent, render, screen } from '@testing-library/react'
import StatusNavDropdown from './StatusNavDropdown'

const items = [
  { href: '/playing', label: 'Playing' },
  { href: '/wantToPlay', label: 'Want to play' },
  { href: '/completed', label: 'Completed' },
]

test('renders the trigger with the given label', () => {
  render(<StatusNavDropdown items={items} active={false} label="Status" />)
  expect(screen.getByRole('button', { name: 'Status' })).toBeInTheDocument()
})

test('menu is hidden until the trigger is clicked', () => {
  render(<StatusNavDropdown items={items} active={false} label="Status" />)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  expect(screen.getByRole('menu')).toBeInTheDocument()
})

test('renders the 3 status links with correct hrefs', () => {
  render(<StatusNavDropdown items={items} active={false} label="Status" />)
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  expect(screen.getByRole('menuitem', { name: 'Playing' })).toHaveAttribute('href', '/playing')
  expect(screen.getByRole('menuitem', { name: 'Want to play' })).toHaveAttribute('href', '/wantToPlay')
  expect(screen.getByRole('menuitem', { name: 'Completed' })).toHaveAttribute('href', '/completed')
})

test('closes the menu when a link is clicked', () => {
  render(<StatusNavDropdown items={items} active={false} label="Status" />)
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  fireEvent.click(screen.getByRole('menuitem', { name: 'Playing' }))
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('closes on outside click', () => {
  render(<StatusNavDropdown items={items} active={false} label="Status" />)
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  fireEvent.mouseDown(document.body)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('closes on Escape', () => {
  render(<StatusNavDropdown items={items} active={false} label="Status" />)
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('applies active styling when active is true', () => {
  render(<StatusNavDropdown items={items} active={true} label="Status" />)
  expect(screen.getByRole('button', { name: 'Status' })).toHaveClass('text-accent')
})
