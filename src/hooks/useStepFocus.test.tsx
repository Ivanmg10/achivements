import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { useStepFocus } from './useStepFocus'

function Steps() {
  const [open, setOpen] = useState<string | null>(null)
  const { detail, list } = useStepFocus(open)
  return (
    <div>
      <div ref={list}>
        <button data-step-key="a" onClick={() => setOpen('a')}>Open a</button>
        <button data-step-key="b" onClick={() => setOpen('b')}>Open b</button>
      </div>
      {open && (
        <div>
          <button onClick={() => setOpen(null)}>Back</button>
          <h3 ref={detail} tabIndex={-1}>Day {open}</h3>
        </div>
      )}
    </div>
  )
}

test('opening an item moves the focus to its heading, and back returns it to the item\'s button', () => {
  render(<Steps />)
  fireEvent.click(screen.getByText('Open b'))
  expect(screen.getByRole('heading', { name: 'Day b' })).toHaveFocus()
  fireEvent.click(screen.getByText('Back'))
  expect(screen.getByText('Open b')).toHaveFocus()
})

test('nothing takes the focus on mount', () => {
  render(<Steps />)
  expect(document.body).toHaveFocus()
})
