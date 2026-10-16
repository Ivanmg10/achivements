import { raUnavailable } from './raFailure'

const data = (res: unknown) => (res as { data: unknown }).data

test('a key RA does not accept is a 403 ra-key-invalid, whichever of its two codes RA used', () => {
  for (const status of [401, 403]) {
    const res = raUnavailable(Object.assign(new Error(`RA API error ${status}`), { status }))
    expect(res.status).toBe(403)
    expect(data(res)).toEqual({ error: 'ra-key-invalid' })
  }
})

test('anything else is RA being unavailable, which the client may retry', () => {
  for (const err of [Object.assign(new Error('RA API error 500'), { status: 500 }), Object.assign(new Error('rate'), { status: 429 }), new Error('timeout'), null, undefined]) {
    const res = raUnavailable(err)
    expect(res.status).toBe(503)
    expect(data(res)).toEqual({ message: 'RA service unavailable' })
  }
})
