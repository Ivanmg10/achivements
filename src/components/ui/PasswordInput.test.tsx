import { fireEvent, render, screen } from '@testing-library/react'
import PasswordInput from './PasswordInput'
import { en } from '@/translations/en'

test('a labelled field, hidden by default', () => {
  render(<PasswordInput label="Password" value="secret" onChange={jest.fn()} />)
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
})

test('the toggle shows and hides it, and says which', () => {
  render(<PasswordInput label="Password" value="secret" onChange={jest.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: en.passwordInput.show }))
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  expect(screen.getByRole('button', { name: en.passwordInput.hide })).toHaveAttribute('aria-pressed', 'true')
})

test('reports what is typed', () => {
  const onChange = jest.fn()
  render(<PasswordInput label="Password" value="" onChange={onChange} />)
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abc' } })
  expect(onChange).toHaveBeenCalledWith('abc')
})

test('an error is announced and tied to the field', () => {
  render(<PasswordInput label="Password" value="" onChange={jest.fn()} error="Too short" />)
  const field = screen.getByLabelText('Password')
  expect(field).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByRole('alert')).toHaveTextContent('Too short')
  expect(field.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id)
})
