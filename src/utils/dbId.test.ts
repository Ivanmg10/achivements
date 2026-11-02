import { dbId } from './dbId'

test.each([[1, 1], ['42', 42], [2147483647, 2147483647]])('%p is an id', (value, id) => {
  expect(dbId(value)).toBe(id)
})

test.each([0, -1, 1.5, 2147483648, '99999999999', 'abc', '12abc', '', null, undefined, {}])('%p is not', (value) => {
  expect(dbId(value)).toBeNull()
})
