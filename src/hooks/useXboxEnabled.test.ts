import { createElement, type ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useXboxEnabled } from './useXboxEnabled'
import { SubjectContext } from '@/context/SubjectContext'

function setSession(user: Record<string, unknown> | null) {
  ;(useSession as jest.Mock).mockReturnValue({ data: user ? { user } : null, status: user ? 'authenticated' : 'unauthenticated', update: jest.fn() })
}

test('an admin has Xbox; anyone else does not', () => {
  setSession({ id: '1', admin: true })
  expect(renderHook(() => useXboxEnabled()).result.current).toBe(true)
  setSession({ id: '1', admin: false })
  expect(renderHook(() => useXboxEnabled()).result.current).toBe(false)
  setSession({ id: '1' })
  expect(renderHook(() => useXboxEnabled()).result.current).toBe(false)
})

test('signed out has none', () => {
  setSession(null)
  expect(renderHook(() => useXboxEnabled()).result.current).toBe(false)
})

test("on someone else's page it is already decided: the server only says they have Xbox to a viewer who may see it", () => {
  setSession({ id: 'subject:ivan' })
  const wrapper = ({ children }: { children: ReactNode }) => createElement(SubjectContext.Provider, { value: 'ivan' }, children)
  expect(renderHook(() => useXboxEnabled(), { wrapper }).result.current).toBe(true)
})
