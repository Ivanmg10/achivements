import { renderHook } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useGoBack } from './useGoBack'

const back = jest.fn()
const push = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ back, push, replace: jest.fn(), prefetch: jest.fn() })
})

test('goes back when there is a history', () => {
  const spy = jest.spyOn(window.history, 'length', 'get').mockReturnValue(3)
  renderHook(() => useGoBack()).result.current()
  expect(back).toHaveBeenCalledTimes(1)
  expect(push).not.toHaveBeenCalled()
  spy.mockRestore()
})

test('goes home in a tab that has nothing to go back to', () => {
  const spy = jest.spyOn(window.history, 'length', 'get').mockReturnValue(1)
  renderHook(() => useGoBack()).result.current()
  expect(push).toHaveBeenCalledWith('/')
  expect(back).not.toHaveBeenCalled()
  spy.mockRestore()
})
