import { render, screen, fireEvent } from '@testing-library/react'
import UserPsnCardForm from './UserPsnCardForm'
import { en } from '@/translations/en'

const onSubmit = jest.fn()

beforeEach(() => jest.clearAllMocks())

test('submits the trimmed online ID', () => {
  render(<UserPsnCardForm onSubmit={onSubmit} isLinking={false} error={null} />)
  const button = screen.getByRole('button', { name: en.psn.connect })
  expect(button).toBeDisabled()

  fireEvent.change(screen.getByLabelText(en.psn.usernameLabel), { target: { value: '  Hakoom ' } })
  fireEvent.click(button)
  expect(onSubmit).toHaveBeenCalledWith('Hakoom')
})

test('shows why the last attempt failed, tied to the box', () => {
  render(<UserPsnCardForm onSubmit={onSubmit} isLinking={false} error="not-found" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.errors['not-found'])
  expect(screen.getByLabelText(en.psn.usernameLabel)).toHaveAttribute('aria-invalid', 'true')
})

test('cannot be sent twice while linking', () => {
  render(<UserPsnCardForm onSubmit={onSubmit} isLinking error={null} />)
  fireEvent.change(screen.getByLabelText(en.psn.usernameLabel), { target: { value: 'Hakoom' } })
  expect(screen.getByRole('button', { name: en.psn.connecting })).toBeDisabled()
})
