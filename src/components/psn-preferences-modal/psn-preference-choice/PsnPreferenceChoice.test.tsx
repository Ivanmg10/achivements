import { render, screen, fireEvent } from '@testing-library/react'
import PsnPreferenceChoice from './PsnPreferenceChoice'

const OPTIONS = [{ value: false, label: 'Off' }, { value: true, label: 'On' }]

test('marks the current option and reports the one picked', () => {
  const onChoose = jest.fn()
  render(<PsnPreferenceChoice icon={null} title="Pref" current={false} options={OPTIONS} onChoose={onChoose} />)
  expect(screen.getByRole('radio', { name: 'Off' })).toBeChecked()
  expect(screen.getByRole('radiogroup', { name: 'Pref' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'On' }))
  expect(onChoose).toHaveBeenCalledWith(true)
})
