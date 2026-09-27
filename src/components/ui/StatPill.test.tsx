import { render, screen, fireEvent } from '@testing-library/react'
import { StatPill, StatCard } from './StatPill'

describe('StatPill', () => {
  test('renders label, value and an optional sub line', () => {
    render(<StatPill label="Rank" value="#42" sub="1,000 pts" />)
    expect(screen.getByText('Rank')).toBeInTheDocument()
    expect(screen.getByText('#42')).toBeInTheDocument()
    expect(screen.getByText('1,000 pts')).toBeInTheDocument()
  })

  test('renders as a link when given an href', () => {
    render(<StatPill label="Streak" value="7d" href="/racha" />)
    expect(screen.getByRole('link').getAttribute('href')).toBe('/racha')
  })

  test('renders as a button and reports clicks when given onClick', () => {
    const onClick = jest.fn()
    render(<StatPill label="Today" value="3" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  test('renders as a plain div without href or onClick', () => {
    render(<StatPill label="Avg" value="1.2" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('StatCard', () => {
  test('renders a numeric value through toLocaleString, and a string value as given', () => {
    render(<StatCard label="Games" value={1234} />)
    expect(screen.getByText((1234).toLocaleString())).toBeInTheDocument()
    expect(screen.getByText('Games')).toBeInTheDocument()
  })

  test('uses theme text tokens by default, so it reads correctly in light mode too', () => {
    const { container } = render(<StatCard label="Games" value="10" />)
    const value = container.querySelector('span')!
    expect(value.className).toContain('text-text-main')
    expect(value.className).not.toContain('text-white')
  })

  test('an accent class overrides the default colour', () => {
    const { container } = render(<StatCard label="Perfect" value="5" accent="text-warning" />)
    expect(container.querySelector('span')!.className).toContain('text-warning')
  })
})
