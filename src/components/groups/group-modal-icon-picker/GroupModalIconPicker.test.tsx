import { fireEvent, render, screen } from '@testing-library/react'
import GroupModalIconPicker from './GroupModalIconPicker'
import { en } from '@/translations/en'

test('a common icon in one tap, none, or your own', () => {
  const onChange = jest.fn()
  const { rerender } = render(<GroupModalIconPicker value="" onChange={onChange} />)
  expect(screen.getByRole('button', { name: en.groups.noIcon })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: '🎮' }))
  expect(onChange).toHaveBeenCalledWith('🎮')
  rerender(<GroupModalIconPicker value="🎮" onChange={onChange} />)
  expect(screen.getByLabelText(en.groups.customIcon)).toHaveValue('')
  fireEvent.change(screen.getByLabelText(en.groups.customIcon), { target: { value: '🦔' } })
  expect(onChange).toHaveBeenCalledWith('🦔')
})
