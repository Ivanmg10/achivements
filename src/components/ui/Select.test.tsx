import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Select from './Select'

const OPTIONS = [
  { value: 'progress', label: 'Progress' },
  { value: 'name', label: 'Name', description: 'A to Z' },
  { value: 'date', label: 'Date' },
] as const

function Harness({ onChange = jest.fn() }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState<'progress' | 'name' | 'date'>('progress')
  return (
    <>
      <label htmlFor="sort">Sort by</label>
      <Select id="sort" value={value} options={[...OPTIONS]} onChange={(v) => { setValue(v); onChange(v) }} />
      <button type="button">outside</button>
    </>
  )
}

const combo = () => screen.getByRole('combobox', { name: 'Sort by' })

it('shows the chosen option, named by its label, closed', () => {
  render(<Harness />)
  expect(combo()).toHaveTextContent('Progress')
  expect(combo()).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

it('opens on click and picks an option', () => {
  const onChange = jest.fn()
  render(<Harness onChange={onChange} />)
  fireEvent.click(combo())
  expect(screen.getByRole('option', { name: /Progress/ })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText('A to Z')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('option', { name: /Name/ }))
  expect(onChange).toHaveBeenCalledWith('name')
  expect(combo()).toHaveTextContent('Name')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

it('works from the keyboard: arrows, End, Enter', () => {
  const onChange = jest.fn()
  render(<Harness onChange={onChange} />)
  fireEvent.keyDown(combo(), { key: 'ArrowDown' })
  expect(combo()).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-0$/))
  fireEvent.keyDown(combo(), { key: 'ArrowDown' })
  expect(combo()).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-1$/))
  fireEvent.keyDown(combo(), { key: 'End' })
  fireEvent.keyDown(combo(), { key: 'Enter' })
  expect(onChange).toHaveBeenCalledWith('date')
})

it('closes on Escape without changing', () => {
  const onChange = jest.fn()
  render(<Harness onChange={onChange} />)
  fireEvent.keyDown(combo(), { key: 'Enter' })
  fireEvent.keyDown(combo(), { key: 'Escape' })
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(onChange).not.toHaveBeenCalled()
})

it('jumps by typing, closed or open', () => {
  const onChange = jest.fn()
  render(<Harness onChange={onChange} />)
  fireEvent.keyDown(combo(), { key: 'd' })
  expect(onChange).toHaveBeenCalledWith('date')
})

it('closes when clicking outside', () => {
  render(<Harness />)
  fireEvent.click(combo())
  fireEvent.pointerDown(screen.getByRole('button', { name: 'outside' }))
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})
