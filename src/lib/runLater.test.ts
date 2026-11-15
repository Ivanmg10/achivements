jest.mock('next/server', () => ({ after: jest.fn() }))

import { after } from 'next/server'
import { runLater } from './runLater'

test('inside a request, the work waits for the answer (after)', () => {
  const task = jest.fn(async () => {})
  runLater(task)
  expect(after).toHaveBeenCalledTimes(1)
  expect(task).not.toHaveBeenCalled()
})

test('outside one, it runs at once, and a failure is logged, never thrown', async () => {
  ;(after as jest.Mock).mockImplementationOnce(() => {
    throw new Error('outside a request scope')
  })
  const error = jest.spyOn(console, 'error').mockImplementation(() => {})
  const task = jest.fn(async () => Promise.reject(new Error('boom')))
  runLater(task)
  expect(task).toHaveBeenCalled()
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(error).toHaveBeenCalledWith('[runLater]', expect.any(Error))
  error.mockRestore()
})
