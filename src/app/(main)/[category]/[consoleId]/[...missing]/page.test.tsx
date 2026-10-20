import { notFound } from 'next/navigation'
import Missing from './page'

test('is always a 404', () => {
  expect(() => Missing()).toThrow('NEXT_NOT_FOUND')
  expect(notFound).toHaveBeenCalled()
})
