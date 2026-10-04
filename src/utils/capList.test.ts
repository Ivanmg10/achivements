import { capList } from './utils'

const list = Array.from({ length: 100 }, (_, i) => i)

test('a long list is cut to the limit until asked for all', () => {
  expect(capList(list, 60, false)).toEqual({ visible: list.slice(0, 60), capped: true })
  expect(capList(list, 60, true)).toEqual({ visible: list, capped: true })
})

test('a list only a little over the limit is shown whole', () => {
  const short = list.slice(0, 70)
  expect(capList(short, 60, false)).toEqual({ visible: short, capped: false })
})
