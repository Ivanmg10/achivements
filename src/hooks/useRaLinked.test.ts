import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRaLinked } from './useRaLinked'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))

const linked = (user: unknown) => {
  ;(useSession as jest.Mock).mockReturnValue({ data: user ? { user } : null })
  return renderHook(() => useRaLinked()).result.current
}

test('linked when the server says a username and a key are stored', () => {
  expect(linked({ rausername: 'Ivan', raLinked: true })).toBe(true)
})

test('a username the server does not vouch for is not linked — no call could succeed', () => {
  expect(linked({ rausername: 'Ivan', raLinked: false })).toBe(false)
  expect(linked({ rausername: 'Ivan' })).toBe(false)
})

test('a Steam-only account is not linked', () => {
  expect(linked({ steamid: '7656' })).toBe(false)
})

test('no session at all is not linked', () => {
  expect(linked(null)).toBe(false)
})
