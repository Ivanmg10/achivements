import { markRefresh, REFRESH_COOKIE } from './refreshMark'

test('sets a short-lived cookie the browser sends to /api only', () => {
  const set = jest.spyOn(document, 'cookie', 'set')
  markRefresh()
  const written = set.mock.calls[0][0]
  expect(written).toContain(`${REFRESH_COOKIE}=1`)
  expect(written).toContain('path=/api')
  expect(written).toMatch(/max-age=\d+/)
  set.mockRestore()
})
