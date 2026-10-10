import { renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { useIsClient } from './useIsClient'

test('true in the browser', () => {
  expect(renderHook(() => useIsClient()).result.current).toBe(true)
})

test('false when rendered on the server, so the first client render can match it', () => {
  function Probe() {
    return <span>{String(useIsClient())}</span>
  }
  expect(renderToString(<Probe />)).toContain('false')
})
