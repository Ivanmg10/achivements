import { forgetAnswers, keepAnswer, lastAnswer } from './lastAnswers'

beforeEach(() => forgetAnswers())

test('gives back the last answer of a URL, for the user who read it only', () => {
  keepAnswer('7', '/api/groups', [1])
  keepAnswer('7', '/api/groups', [1, 2])
  expect(lastAnswer('7', '/api/groups')).toEqual([1, 2])
  expect(lastAnswer('8', '/api/groups')).toBeUndefined()
  expect(lastAnswer('7', '/api/favorites')).toBeUndefined()
})

test('nothing without a user', () => {
  keepAnswer(null, '/api/groups', [1])
  expect(lastAnswer(null, '/api/groups')).toBeUndefined()
  expect(lastAnswer(undefined, '/api/groups')).toBeUndefined()
})

test('keeps the newest 200, dropping the oldest', () => {
  for (let i = 0; i <= 200; i++) keepAnswer('7', `/api/x?${i}`, i)
  expect(lastAnswer('7', '/api/x?0')).toBeUndefined()
  expect(lastAnswer('7', '/api/x?200')).toBe(200)
})
