import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SegmentedControl from './SegmentedControl'
import Pill, { pillClass } from './Pill'
import Tabs, { tabIds } from './Tabs'

describe('SegmentedControl', () => {
  it('presses the chosen option and reports a new one', () => {
    const onChange = jest.fn()
    render(<SegmentedControl aria-label="View" value="covers" onChange={onChange} options={[{ value: 'covers', label: 'Covers' }, { value: 'list', label: 'List' }]} />)
    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Covers' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(onChange).toHaveBeenCalledWith('list')
  })

  it('keeps an icon-only option named', () => {
    const Icon = () => <svg />
    render(<SegmentedControl aria-label="Columns" value="1" onChange={jest.fn()} options={[{ value: '1', label: 'One column', icon: Icon, iconOnly: true }]} />)
    expect(screen.getByRole('button', { name: 'One column' })).toBeInTheDocument()
  })
})

describe('Pill', () => {
  it('is a pressed toggle with its count', () => {
    render(<Pill pressed count={6}>Almost done</Pill>)
    const pill = screen.getByRole('button', { name: /Almost done/ })
    expect(pill).toHaveAttribute('aria-pressed', 'true')
    expect(pill).toHaveTextContent('6')
  })

  it('marks the pressed chip with a ring', () => {
    expect(pillClass(true)).toContain('ring-accent/50')
    expect(pillClass(false)).not.toContain('ring-accent')
  })
})

describe('Tabs', () => {
  function Harness() {
    const [tab, setTab] = useState<'a' | 'b' | 'c'>('a')
    return (
      <>
        <Tabs id="t" aria-label="Sections" value={tab} onChange={setTab} tabs={[{ value: 'a', label: 'One' }, { value: 'b', label: 'Two', count: 3 }, { value: 'c', label: 'Three' }]} />
        <div role="tabpanel" id={tabIds('t', tab).panel} aria-labelledby={tabIds('t', tab).tab}>panel {tab}</div>
      </>
    )
  }

  it('selects with a click and ties the panel to its tab', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('tab', { name: /Two/ }))
    expect(screen.getByRole('tab', { name: /Two/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: /Two/ })).toHaveTextContent('panel b')
  })

  it('moves with the arrows and Home / End, one tab in the tab order', () => {
    render(<Harness />)
    const first = screen.getByRole('tab', { name: 'One' })
    expect(first).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('tabindex', '-1')
    fireEvent.keyDown(first, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Three' }), { key: 'Home' })
    expect(first).toHaveAttribute('aria-selected', 'true')
  })
})
