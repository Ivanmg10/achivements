import { render, screen, fireEvent } from '@testing-library/react'
import Input, { Field, Textarea, fieldClass } from './Input'
import SearchInput from './SearchInput'

describe('fieldClass', () => {
  it('is sunken and lights up with the accent', () => {
    const cls = fieldClass()
    expect(cls).toContain('bg-bg-main')
    expect(cls).toContain('shadow-[inset')
    expect(cls).toContain('hover:ring-accent/50')
    expect(cls).toContain('focus-visible:ring-accent')
  })

  it('uses the danger colour when invalid, also on hover', () => {
    const cls = fieldClass({ invalid: true })
    expect(cls).toContain('ring-danger/70')
    expect(cls).toContain('hover:ring-danger')
    expect(cls).not.toContain('hover:ring-accent')
  })

  it('leaves room for an icon and has a dense size', () => {
    expect(fieldClass({ icon: true })).toContain('pl-10')
    expect(fieldClass({ size: 'sm' })).toContain('h-(--h-control)')
    expect(fieldClass()).toContain('h-(--h-field)')
  })
})

describe('Input', () => {
  it('passes its props through and marks itself invalid', () => {
    const onChange = jest.fn()
    render(<Input aria-label="Name" value="" onChange={onChange} invalid />)
    const input = screen.getByLabelText('Name')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(input, { target: { value: 'a' } })
    expect(onChange).toHaveBeenCalled()
  })
})

describe('Textarea', () => {
  it('renders a textarea with the field look', () => {
    render(<Textarea aria-label="Bio" defaultValue="hi" />)
    expect(screen.getByLabelText('Bio').tagName).toBe('TEXTAREA')
    expect(screen.getByLabelText('Bio').className).toContain('rounded-field')
  })
})

describe('Field', () => {
  it('labels the control and ties the hint to it', () => {
    render(<Field label="Username" hint="3 to 20 letters" aside="Optional">{(c) => <Input {...c} />}</Field>)
    const input = screen.getByLabelText('Username')
    expect(screen.getByText('Optional')).toBeInTheDocument()
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('3 to 20 letters').id)
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('shows the error in place of the hint, announced', () => {
    render(<Field label="Email" hint="We never share it" error="Not an email">{(c) => <Input {...c} />}</Field>)
    expect(screen.queryByText('We never share it')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Not an email')
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('SearchInput', () => {
  it('is a search field named by its label', () => {
    render(<SearchInput aria-label="Search games" />)
    expect(screen.getByRole('searchbox', { name: 'Search games' })).toHaveClass('pl-10')
  })
})
