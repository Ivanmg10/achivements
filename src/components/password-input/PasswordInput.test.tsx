import { fireEvent, render, screen } from '@testing-library/react'
import PasswordInput from './PasswordInput'
import { en } from '@/translations/en'

test('a labelled field, hidden by default', () => {
  render(<PasswordInput id="pw" label="Password" value="secret" onChange={jest.fn()} />)
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
})

test('the toggle shows and hides it, and says which', () => {
  render(<PasswordInput id="pw" label="Password" value="secret" onChange={jest.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: en.passwordInput.show }))
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  expect(screen.getByRole('button', { name: en.passwordInput.hide })).toHaveAttribute('aria-pressed', 'true')
})

test('reports what is typed', () => {
  const onChange = jest.fn()
  render(<PasswordInput id="pw" label="Password" value="" onChange={onChange} />)
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abc' } })
  expect(onChange).toHaveBeenCalledWith('abc')
})
