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

const points = (clip: string) => clip.slice(8, -1).split(', ').map((p) => parseFloat(p))

test('a shape sweeps across the whole window, the band between two clipped looks', () => {
  window.innerWidth = 1000
  window.innerHeight = 500
  for (const shape of ['round', 'slanted'] as const) {
    const { keyframes, old } = sweepEdge(shape)
    const [newFrom, newTo] = keyframes.clipPath as string[]
    const [oldFrom, oldTo] = old!.clipPath as string[]
    // The same points at both ends, or a polygon does not ease.
    expect(points(newFrom)).toHaveLength(points(newTo).length)

    const edge = (clip: string) => points(clip).slice(1, -1)
    // Starts out of the window on the left, ends out of it on the right, with no idle time past that.
    expect(Math.max(...edge(newFrom))).toBeLessThanOrEqual(0)
    expect(Math.min(...edge(newTo))).toBeGreaterThanOrEqual(1000)
    expect(Math.max(...edge(newFrom))).toBeGreaterThanOrEqual(-100)
    // The old look starts a band further on.
    expect(edge(oldFrom)[0] - edge(newFrom)[0]).toBe(40)
    expect(edge(oldTo)[0] - edge(newTo)[0]).toBe(40)
  }
})

test('the edge has the shape chosen: straight and leaning, or curved', () => {
  window.innerWidth = 1000
  window.innerHeight = 500
  const edge = (shape: 'round' | 'slanted') => points((sweepEdge(shape).keyframes.clipPath as string[])[1]).slice(1, -1)
  const slanted = edge('slanted')
  expect(slanted[0]).toBeGreaterThan(slanted[slanted.length - 1])
  const round = edge('round')
  expect(round[16]).toBeGreaterThan(round[0])
  expect(round[16]).toBeGreaterThan(round[32])
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
