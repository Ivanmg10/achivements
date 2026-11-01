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
  expect((round.old!.maskImage as string[])[0]).toContain('circle 626px')
  // Both sides: with the width alone the mask is not the window's height and hides both looks, a full screen of the accent.
  const [wide, tall] = (slanted.keyframes.maskSize as string[])[0].split(' ').map(parseFloat)
  expect(tall).toBe(500)
  // The new look is solid behind the arc, or the band's colour stays in the corners a circle leaves out.
  expect((round.keyframes.maskImage as string[])[0]).toContain('linear-gradient(#000, #000)')

  // The edge rides in the mask's middle and starts and ends just out of the window, or it idles there and then lurches.
  const [from, to] = (slanted.keyframes.maskPosition as string[]).map((at) => parseFloat(at) + wide / 2)
  expect(from).toBeLessThan(0)
  expect(from).toBeGreaterThan(-100)
  expect(to).toBeGreaterThan(1000)
  expect(to).toBeLessThan(1250)
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
