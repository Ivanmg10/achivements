import { render, screen, fireEvent } from '@testing-library/react'
import { IconUser } from '@tabler/icons-react'
import AuthFormField from './AuthFormField'

function renderField(props: Partial<React.ComponentProps<typeof AuthFormField>> = {}) {
  const onChange = jest.fn()
  render(
    <AuthFormField label="Username" icon={<IconUser size={18} />} value="" onChange={onChange} {...props} />,
  )
  return { onChange }
}

test('the label is visible and tied to the input', () => {
  renderField()
  const input = screen.getByLabelText('Username')
  expect(input).toBeInTheDocument()
  expect(screen.getByText('Username').tagName).toBe('LABEL')
})

test('reports what is typed', () => {
  const { onChange } = renderField()
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'ivan' } })
  expect(onChange).toHaveBeenCalledWith('ivan')
})

test('shows the rule while the field is fine', () => {
  renderField({ hint: '3–20 characters' })
  const input = screen.getByLabelText('Username')
  expect(screen.getByText('3–20 characters')).toBeInTheDocument()
  expect(input.getAttribute('aria-invalid')).toBeNull()
  expect(document.getElementById(input.getAttribute('aria-describedby')!)).toHaveTextContent('3–20 characters')
})

test('an error replaces the rule and marks the field', () => {
  renderField({ hint: '3–20 characters', error: 'This field is required' })
  const input = screen.getByLabelText('Username')
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(screen.getByText('This field is required')).toBeInTheDocument()
  expect(screen.queryByText('3–20 characters')).not.toBeInTheDocument()
})

test('passes through the input attributes it is given', () => {
  renderField({ type: 'password', autoComplete: 'new-password', required: true, disabled: true })
  const input = screen.getByLabelText('Username') as HTMLInputElement
  expect(input.type).toBe('password')
  expect(input.autocomplete).toBe('new-password')
  expect(input.required).toBe(true)
  expect(input.disabled).toBe(true)
})
