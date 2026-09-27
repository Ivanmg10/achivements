import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRaLinked } from './useRaLinked'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))

const linked = (user: unknown) => {
  ;(useSession as jest.Mock).mockReturnValue({ data: user ? { user } : null })
  return renderHook(() => useRaLinked()).result.current
}

test('a username and a key means linked', () => {
  expect(linked({ rausername: 'Ivan', raid: 'key' })).toBe(true)
})

test('a username without a key is not linked — no call could succeed', () => {
  expect(linked({ rausername: 'Ivan' })).toBe(false)
})

test('a key without a username is not linked', () => {
  expect(linked({ raid: 'key' })).toBe(false)
})

test('a Steam-only account is not linked', () => {
  expect(linked({ steamid: '7656' })).toBe(false)
})

test('no session at all is not linked', () => {
  expect(linked(null)).toBe(false)
})
