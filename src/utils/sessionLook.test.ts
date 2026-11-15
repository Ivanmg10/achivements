import { sessionLook } from './sessionLook'

test('signed out there is nothing to remember', () => {
  expect(sessionLook(null)).toBeNull()
  expect(sessionLook(undefined)).toBeNull()
})

test('one platform or none has no switch; several do', () => {
  expect(sessionLook({})).toBe('in')
  expect(sessionLook({ raLinked: true })).toBe('in')
  expect(sessionLook({ raLinked: true, steamid: '1' })).toBe('tabs')
})

test('Xbox counts only for who may use it', () => {
  expect(sessionLook({ raLinked: true, xboxxuid: '1', admin: false })).toBe('in')
  expect(sessionLook({ raLinked: true, xboxxuid: '1', admin: true })).toBe('tabs')
})
