// Types for the jest-dom matchers (toBeInTheDocument…) in the tests; jest.setup.js loads them at run time.
import '@testing-library/jest-dom'

// __mocks__/next/server.js keeps the body of NextResponse.json() on `data`, so route tests read it there.
declare module 'next/server' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface NextResponse<Body = unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  }
}
