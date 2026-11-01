import { lookTransition, spreadFrom, sweepEdge } from './lookTransition'

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
  lookTransition(jest.fn(), spreadFrom(0, 0))
  await Promise.resolve()
  await Promise.resolve()
  const [keyframes, options] = animate.mock.calls[0]
  expect(keyframes.clipPath).toEqual(['circle(0 at 0px 0px)', 'circle(500px at 0px 0px)'])
  expect(options.pseudoElement).toBe('::view-transition-new(root)')
})

test('a shape sweeps across the whole window, the old look leaving room for the band', () => {
  window.innerWidth = 1000
  window.innerHeight = 500
  const round = sweepEdge('round')
  const slanted = sweepEdge('slanted')
  expect((round.keyframes.maskImage as string[])[0]).toContain('radial-gradient')
  expect((slanted.keyframes.maskImage as string[])[0]).toContain('linear-gradient(102deg')
  expect((round.old!.maskImage as string[])[0]).toContain('circle 620px')
  // Both sides: with the width alone the mask is as tall as the window and hides both looks, a full screen of the accent.
  expect((slanted.keyframes.maskSize as string[])[0]).toBe('3000px 3000px')

  // The mask is 3000 px wide with the edge in its middle, and the edge starts and ends out of the window.
  const [from, to] = (slanted.keyframes.maskPosition as string[]).map((at) => parseFloat(at) + 1500)
  expect(from).toBeLessThan(0)
  expect(to).toBeGreaterThan(1000)
  expect(slanted.old!.maskPosition).toEqual(slanted.keyframes.maskPosition)
})

test('with an old look to move, both are animated together', async () => {
  stubMotion(false)
  const { animate } = stubTransition(Promise.resolve())
  lookTransition(jest.fn(), sweepEdge('round'))
  await Promise.resolve()
  await Promise.resolve()
  expect(animate.mock.calls.map(([, options]) => options.pseudoElement)).toEqual(['::view-transition-new(root)', '::view-transition-old(root)'])
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
