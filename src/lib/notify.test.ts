import { dismissToast, getServerToasts, getToasts, notify, subscribeToasts } from './notify'

afterEach(() => {
  for (const t of getToasts()) dismissToast(t.id)
})

test('success and error add a toast of their kind, in order', () => {
  notify.success('Saved')
  notify.error('Failed')
  expect(getToasts().map(({ kind, message }) => ({ kind, message }))).toEqual([
    { kind: 'success', message: 'Saved' },
    { kind: 'error', message: 'Failed' },
  ])
})

test('each toast gets its own id, and dismissing removes only that one', () => {
  const a = notify.success('a')
  const b = notify.success('b')
  expect(a).not.toBe(b)
  dismissToast(a)
  expect(getToasts().map((t) => t.message)).toEqual(['b'])
})

test('a burst keeps only the last four', () => {
  for (const m of ['1', '2', '3', '4', '5', '6']) notify.success(m)
  expect(getToasts().map((t) => t.message)).toEqual(['3', '4', '5', '6'])
})

test('subscribers hear about every change, until they unsubscribe', () => {
  const listener = jest.fn()
  const unsubscribe = subscribeToasts(listener)
  const id = notify.success('x')
  dismissToast(id)
  expect(listener).toHaveBeenCalledTimes(2)
  unsubscribe()
  notify.success('y')
  expect(listener).toHaveBeenCalledTimes(2)
})

test('the server never has toasts', () => {
  notify.success('only in the browser')
  expect(getServerToasts()).toEqual([])
})
