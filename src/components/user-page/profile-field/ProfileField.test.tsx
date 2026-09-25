import { render, screen, fireEvent } from '@testing-library/react'
import ProfileField from './ProfileField'

test('a read-only field is not a button', () => {
  render(<ProfileField label="Email" value="a@b.c" />)
  expect(screen.getByText('a@b.c')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('an editable field is a button naming the field and its value', () => {
  const onEdit = jest.fn()
  render(<ProfileField label="Email" value="a@b.c" onEdit={onEdit} />)
  fireEvent.click(screen.getByRole('button', { name: 'Email: a@b.c' }))
  expect(onEdit).toHaveBeenCalled()
})

test('falls back to the empty text when there is no value', () => {
  render(<ProfileField label="Location" empty="Not set" onEdit={jest.fn()} />)
  expect(screen.getByRole('button', { name: 'Location: Not set' })).toBeInTheDocument()
})

test('children replace the plain value', () => {
  render(<ProfileField label="Theme" onEdit={jest.fn()}><span>dark</span></ProfileField>)
  expect(screen.getByText('dark')).toBeInTheDocument()
})
