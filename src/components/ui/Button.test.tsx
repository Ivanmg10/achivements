import { render, screen, fireEvent } from '@testing-library/react'
import Button, { buttonClass } from './Button'
import IconButton from './IconButton'

describe('Button', () => {
  it('is a type="button" by default, so it never submits a form by accident', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button')
  })

  it('submits when asked', () => {
    render(<Button type="submit">Send</Button>)
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit')
  })

  it('calls onClick', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Go</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalled()
  })

  it('blocks and says it is busy while loading, keeping its text', () => {
    const onClick = jest.fn()
    render(<Button loading onClick={onClick}>Saving</Button>)
    const button = screen.getByRole('button', { name: 'Saving' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders a link with href', () => {
    render(<Button href="/groups">Groups</Button>)
    expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute('href', '/groups')
  })

  it('draws each variant from the theme', () => {
    expect(buttonClass('primary')).toContain('before:bg-accent')
    expect(buttonClass('danger')).toContain('before:bg-danger')
    expect(buttonClass('secondary')).toContain('before:ring-1')
    expect(buttonClass('quiet')).not.toContain('before:bg-accent')
  })

  it('keeps the shape behind the text', () => {
    expect(buttonClass().split(' ')).toEqual(expect.arrayContaining(['isolate', 'before:-z-10', 'before:rounded-button']))
  })

  it('leans only the primary, and only its shape, on the one angle', () => {
    expect(buttonClass()).toContain('before:skew-x-(--slant)')
    expect(buttonClass()).not.toMatch(/(^|\s)skew-x/)
    for (const v of ['secondary', 'quiet', 'danger'] as const) expect(buttonClass(v)).not.toContain('skew')
  })

  it('adds layout classes', () => {
    render(<Button className="w-full">Wide</Button>)
    expect(screen.getByRole('button', { name: 'Wide' }).className).toContain('w-full')
  })
})

describe('IconButton', () => {
  it('is named by its aria-label', () => {
    render(<IconButton aria-label="Close"><svg aria-hidden="true" /></IconButton>)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('type', 'button')
  })

  it('shows a pressed state', () => {
    render(<IconButton aria-label="Pin" aria-pressed="true"><svg aria-hidden="true" /></IconButton>)
    expect(screen.getByRole('button', { name: 'Pin' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Button xl', () => {
  it('is the biggest size, a title screen\'s ways in, and still fits a phone (smaller there)', () => {
    const cls = buttonClass('primary', 'xl')
    expect(cls).toContain('min-h-14')
    expect(cls).toContain('sm:min-h-16')
    expect(cls).toContain('sm:text-lg')
  })
})
