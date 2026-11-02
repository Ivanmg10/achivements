import { render, screen, fireEvent } from '@testing-library/react'
import Switch from './Switch'
import Checkbox from './Checkbox'
import ChoiceCards, { choiceClass } from './ChoiceCards'

describe('Switch', () => {
  it('is a named switch that reports the next state', () => {
    const onChange = jest.fn()
    render(<Switch checked={false} onChange={onChange} aria-label="Public profile" />)
    const sw = screen.getByRole('switch', { name: 'Public profile' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(sw)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('does nothing while disabled', () => {
    const onChange = jest.fn()
    render(<Switch checked onChange={onChange} aria-label="Admin" disabled />)
    fireEvent.click(screen.getByRole('switch', { name: 'Admin' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('Checkbox', () => {
  it('toggles from its label', () => {
    const onChange = jest.fn()
    render(<Checkbox checked={false} onChange={onChange}>PlayStation 2</Checkbox>)
    fireEvent.click(screen.getByText('PlayStation 2'))
    expect(onChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('checkbox', { name: 'PlayStation 2' })).not.toBeChecked()
  })
})

describe('ChoiceCards', () => {
  const options = [
    { value: false, label: 'Private', hint: 'Only you' },
    { value: true, label: 'Public', hint: 'Anyone' },
  ]

  it('is a radio group under its legend, with the current one checked', () => {
    render(<ChoiceCards legend="Who sees it" value={false} onChange={jest.fn()} options={options} />)
    expect(screen.getByRole('group', { name: 'Who sees it' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Private/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Public/ })).not.toBeChecked()
  })

  it('reports the value picked', () => {
    const onChange = jest.fn()
    render(<ChoiceCards legend="Who sees it" value={false} onChange={onChange} options={options} />)
    fireEvent.click(screen.getByRole('radio', { name: /Public/ }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('marks the chosen card with a ring, not colour alone', () => {
    expect(choiceClass(true)).toContain('ring-2 ring-accent')
    expect(choiceClass(false)).not.toContain('ring-2 ring-accent')
  })
})
