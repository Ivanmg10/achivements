import { lookTransition } from './lookTransition'

function stubMotion(reduced: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({ matches: reduced }) as unknown as typeof window.matchMedia
}

afterEach(() => {
  delete (document as Partial<Document>).startViewTransition
  delete (document.documentElement as Partial<HTMLElement>).animate
})

function stubTransition(ready: Promise<void>) {
  const start = jest.fn((run: () => void) => {
    run()
    return { ready }
  })
  document.startViewTransition = start as unknown as typeof document.startViewTransition
  const animate = jest.fn()
  document.documentElement.animate = animate
  return { start, animate }
}

test('without view transitions it just changes', () => {
  stubMotion(false)
  const change = jest.fn()
  lookTransition(change)
  expect(change).toHaveBeenCalledTimes(1)
})

test('with reduced motion it just changes', () => {
  stubMotion(true)
  const { start } = stubTransition(Promise.resolve())
  const change = jest.fn()
  lookTransition(change)
  expect(change).toHaveBeenCalledTimes(1)
  expect(start).not.toHaveBeenCalled()
})

test('from a point, the new look spreads from it to the farthest corner', async () => {
  stubMotion(false)
  const { animate } = stubTransition(Promise.resolve())
  window.innerWidth = 300
  window.innerHeight = 400
  lookTransition(jest.fn(), { x: 0, y: 0 })
  await Promise.resolve()
  await Promise.resolve()
  const [keyframes, options] = animate.mock.calls[0]
  expect(keyframes.clipPath).toEqual(['circle(0 at 0px 0px)', 'circle(500px at 0px 0px)'])
  expect(options.pseudoElement).toBe('::view-transition-new(root)')
})

test('a skipped transition neither throws nor loses the change', async () => {
  stubMotion(false)
  const { animate } = stubTransition(Promise.reject(new Error('skipped')))
  const change = jest.fn()
  lookTransition(change)
  await Promise.resolve()
  await Promise.resolve()
  expect(change).toHaveBeenCalledTimes(1)
  expect(animate).not.toHaveBeenCalled()
})
