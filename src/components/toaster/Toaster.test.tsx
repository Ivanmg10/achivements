import { act, fireEvent, render, screen } from '@testing-library/react'
import Toaster from './Toaster'
import { TOAST_MS } from './toast-item/ToastItem'
import { dismissToast, getToasts, notify } from '@/lib/notify'
import { en } from '@/translations/en'

beforeEach(() => jest.useFakeTimers())

afterEach(() => {
  act(() => {
    for (const t of getToasts()) dismissToast(t.id)
  })
  jest.useRealTimers()
})

test('a live region is always there, empty until something happens', () => {
  const { container } = render(<Toaster />)
  const region = container.querySelector('[aria-live="polite"]')
  expect(region).toBeInTheDocument()
  expect(region).toBeEmptyDOMElement()
})

test('a success is announced politely, an error as an alert', () => {
  render(<Toaster />)
  act(() => {
    notify.success('Group created')
    notify.error('Could not delete the group')
  })
  expect(screen.getByRole('status')).toHaveTextContent('Group created')
  expect(screen.getByRole('alert')).toHaveTextContent('Could not delete the group')
})

test('success and failure differ by icon, not only by colour', () => {
  render(<Toaster />)
  act(() => {
    notify.success('ok')
    notify.error('ko')
  })
  expect(screen.getByRole('status').querySelector('[data-testid="IconCircleCheck"]')).toBeInTheDocument()
  expect(screen.getByRole('alert').querySelector('[data-testid="IconAlertCircle"]')).toBeInTheDocument()
})

test('a toast goes by itself; an error stays longer than a success', () => {
  render(<Toaster />)
  act(() => {
    notify.success('ok')
    notify.error('ko')
  })
  act(() => jest.advanceTimersByTime(TOAST_MS.success))
  expect(screen.queryByText('ok')).not.toBeInTheDocument()
  expect(screen.getByText('ko')).toBeInTheDocument()
  act(() => jest.advanceTimersByTime(TOAST_MS.error - TOAST_MS.success))
  expect(screen.queryByText('ko')).not.toBeInTheDocument()
})

test('it stays while the pointer is on it, and goes once it leaves', () => {
  render(<Toaster />)
  act(() => {
    notify.success('read me')
  })
  fireEvent.mouseEnter(screen.getByRole('status'))
  act(() => jest.advanceTimersByTime(TOAST_MS.success * 3))
  expect(screen.getByText('read me')).toBeInTheDocument()

  // Looked up again: the motion mock remounts the element on every render.
  fireEvent.mouseLeave(screen.getByRole('status'))
  act(() => jest.advanceTimersByTime(TOAST_MS.success))
  expect(screen.queryByText('read me')).not.toBeInTheDocument()
})

test('the close button removes it at once', () => {
  render(<Toaster />)
  act(() => {
    notify.error('ko')
  })
  fireEvent.click(screen.getByRole('button', { name: en.toast.close }))
  expect(screen.queryByText('ko')).not.toBeInTheDocument()
})
