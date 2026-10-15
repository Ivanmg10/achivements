import { render, screen, fireEvent } from '@testing-library/react'
import PsnPreferenceSwitch from './PsnPreferenceSwitch'

test('says its state in words, and asks for the opposite on click', () => {
  const onChange = jest.fn()
  const { rerender } = render(<PsnPreferenceSwitch icon={null} label="Pref" onText="On!" offText="Off!" checked={false} onChange={onChange} />)
  const sw = screen.getByRole('switch', { name: 'Pref' })
  expect(sw).not.toBeChecked()
  expect(screen.getByText('Off!')).toBeInTheDocument()
  fireEvent.click(sw)
  expect(onChange).toHaveBeenCalledWith(true)
  rerender(<PsnPreferenceSwitch icon={null} label="Pref" onText="On!" offText="Off!" checked onChange={onChange} />)
  expect(sw).toBeChecked()
  expect(screen.getByText('On!')).toBeInTheDocument()
})
