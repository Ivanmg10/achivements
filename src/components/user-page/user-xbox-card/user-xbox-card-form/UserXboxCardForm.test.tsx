import { render, screen, fireEvent } from '@testing-library/react'
import UserXboxCardForm from './UserXboxCardForm'
import { en } from '@/translations/en'

const onSubmit = jest.fn()

beforeEach(() => jest.clearAllMocks())

test('submits the trimmed gamertag', () => {
  render(<UserXboxCardForm onSubmit={onSubmit} isLinking={false} error={null} />)
  const button = screen.getByRole('button', { name: en.xbox.connect })
  expect(button).toBeDisabled()

  fireEvent.change(screen.getByLabelText(en.xbox.gamertagLabel), { target: { value: '  TestPlayer ' } })
  fireEvent.click(button)
  expect(onSubmit).toHaveBeenCalledWith('TestPlayer')
})

test('shows why the last attempt failed, tied to the box', () => {
  render(<UserXboxCardForm onSubmit={onSubmit} isLinking={false} error="not-found" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.errors['not-found'])
  expect(screen.getByLabelText(en.xbox.gamertagLabel)).toHaveAttribute('aria-invalid', 'true')
})

test('cannot be sent twice while linking', () => {
  render(<UserXboxCardForm onSubmit={onSubmit} isLinking error={null} />)
  fireEvent.change(screen.getByLabelText(en.xbox.gamertagLabel), { target: { value: 'TestPlayer' } })
  expect(screen.getByRole('button', { name: en.xbox.connecting })).toBeDisabled()
})

test('a blank box sends nothing', () => {
  render(<UserXboxCardForm onSubmit={onSubmit} isLinking={false} error={null} />)
  fireEvent.change(screen.getByLabelText(en.xbox.gamertagLabel), { target: { value: '   ' } })
  fireEvent.submit(screen.getByLabelText(en.xbox.gamertagLabel).closest('form')!)
  expect(onSubmit).not.toHaveBeenCalled()
})
