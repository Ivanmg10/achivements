const ID = 'G-TEST123'

/** A fresh copy of the module, since GA_ID is read from the environment on import. */
function load(id?: string) {
  if (id) process.env.NEXT_PUBLIC_GA_ID = id
  jest.resetModules()
  return import('./analytics')
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_GA_ID
  delete (window as unknown as Record<string, unknown>)[`ga-disable-${ID}`]
})

test('tells GA the path only, never the query — reset tokens live there', async () => {
  const { pageLocation } = await load(ID)
  expect(pageLocation({ origin: 'https://www.cheevovault.com', pathname: '/resetPassword' })).toBe(
    'https://www.cheevovault.com/resetPassword',
  )
})

test('turning analytics off sets the opt-out flag and drops GA cookies, and nothing else', async () => {
  const { setAnalyticsEnabled } = await load(ID)
  document.cookie = '_ga=GA1.1.1; path=/'
  document.cookie = '_ga_TEST123=GS1.1; path=/'
  document.cookie = 'keep=1; path=/'

  setAnalyticsEnabled(false)

  expect((window as unknown as Record<string, boolean>)[`ga-disable-${ID}`]).toBe(true)
  expect(document.cookie).not.toMatch(/_ga/)
  expect(document.cookie).toContain('keep=1')
})

test('turning it back on lifts the opt-out', async () => {
  const { setAnalyticsEnabled } = await load(ID)
  setAnalyticsEnabled(false)
  setAnalyticsEnabled(true)
  expect((window as unknown as Record<string, boolean>)[`ga-disable-${ID}`]).toBe(false)
})

test('without an ID it does nothing', async () => {
  const { GA_ID, setAnalyticsEnabled } = await load()
  expect(GA_ID).toBe('')
  setAnalyticsEnabled(false)
  expect(Object.keys(window).some((k) => k.startsWith('ga-disable-'))).toBe(false)
})
