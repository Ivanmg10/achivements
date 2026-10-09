jest.mock('@/lib/notify', () => ({ notify: { error: jest.fn(), success: jest.fn() } }))

import { act, fireEvent, render, screen } from '@testing-library/react'
import MainPageProfileActionsRefresh from './MainPageProfileActionsRefresh'
import { notify } from '@/lib/notify'
import { REFRESH_COOKIE } from '@/lib/refreshMark'
import { en } from '@/translations/en'

const button = () => screen.getByRole('button', { name: en.profileRa.refreshData })
const click = () => act(async () => { fireEvent.click(button()) })

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  document.cookie = `${REFRESH_COOKIE}=; path=/; max-age=0`
})
afterEach(() => jest.useRealTimers())

test('an icon-only button with an accessible name', () => {
  render(<MainPageProfileActionsRefresh onRefresh={jest.fn()} ringClass="focus:ring-accent" />)
  expect(button()).toBeEnabled()
})

test('pressing it runs the refetches', async () => {
  const onRefresh = jest.fn()
  render(<MainPageProfileActionsRefresh onRefresh={onRefresh} ringClass="x" />)
  await click()
  expect(onRefresh).toHaveBeenCalledTimes(1)
})

test('it rests afterwards, then can be pressed again', async () => {
  render(<MainPageProfileActionsRefresh onRefresh={jest.fn()} ringClass="x" />)
  await click()
  expect(button()).toBeDisabled()
  act(() => { jest.advanceTimersByTime(30_000) })
  expect(button()).toBeEnabled()
})

test('a failed refresh says so and does not make the user wait to retry', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {})
  render(<MainPageProfileActionsRefresh onRefresh={jest.fn().mockRejectedValue(new Error('boom'))} ringClass="x" />)
  await click()
  expect(notify.error).toHaveBeenCalledWith(en.profileRa.refreshFailed)
  expect(button()).toBeEnabled()
  error.mockRestore()
})
