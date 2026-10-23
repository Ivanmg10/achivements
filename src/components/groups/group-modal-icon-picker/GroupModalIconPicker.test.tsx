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

test('icons come in categories, and it opens on the one of the current icon', () => {
  render(<GroupModalIconPicker value="🦊" onChange={jest.fn()} />)
  expect(screen.getByRole('button', { name: en.groups.iconNature })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: '🦊' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: en.groups.iconTrophies }))
  expect(screen.getByRole('button', { name: '🏆' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '🦊' })).not.toBeInTheDocument()
  expect(screen.getByLabelText(en.groups.customIcon)).toHaveValue('')
})
