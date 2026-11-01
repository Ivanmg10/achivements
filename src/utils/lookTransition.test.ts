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
    return { ready, finished: new Promise<void>(() => {}), skipTransition: jest.fn() }
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

test('the change waits for the transition to be running, two frames in, not in its callback', async () => {
  stubMotion(false)
  const { start, animate } = stubTransition(Promise.resolve())
  const frames: FrameRequestCallback[] = []
  const raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb))
  const change = jest.fn()
  const settle = async () => { for (let i = 0; i < 4; i++) await Promise.resolve() }

  lookTransition(change)
  expect(start).toHaveBeenCalledTimes(1)
  await settle()
  expect(animate).toHaveBeenCalledTimes(1)
  expect(change).not.toHaveBeenCalled()

  frames.shift()!(0)
  await settle()
  expect(change).not.toHaveBeenCalled()
  frames.shift()!(0)
  await settle()
  expect(change).toHaveBeenCalledTimes(1)
  raf.mockRestore()
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

test('kept to an element, the page stays out of it, and goes back in after', async () => {
  stubMotion(false)
  let finish = () => {}
  const finished = new Promise<void>((done) => { finish = done })
  const animate = jest.fn()
  document.documentElement.animate = animate
  document.startViewTransition = jest.fn((run: () => void) => {
    run()
    return { ready: Promise.resolve(), finished, skipTransition: jest.fn() }
  }) as unknown as typeof document.startViewTransition
  const panel = document.createElement('div')

  lookTransition(jest.fn(), undefined, panel)
  expect(document.documentElement.style.viewTransitionName).toBe('none')
  expect(panel.style.viewTransitionName).toBe('look-panel')
  await Promise.resolve()
  await Promise.resolve()
  expect(animate.mock.calls[0][1].pseudoElement).toBe('::view-transition-new(look-panel)')

  finish()
  await new Promise((done) => setTimeout(done))
  expect(document.documentElement.style.viewTransitionName).toBe('')
  expect(panel.style.viewTransitionName).toBe('')
})

test('a transition skipped by a newer one leaves it its scope, and the last one to end clears it', async () => {
  stubMotion(false)
  document.documentElement.animate = jest.fn()
  const ends: (() => void)[] = []
  document.startViewTransition = jest.fn(() => ({
    ready: new Promise(() => {}),
    finished: new Promise<void>((done) => ends.push(done)),
    skipTransition: jest.fn(),
  })) as unknown as typeof document.startViewTransition
  const settle = () => new Promise((done) => setTimeout(done))
  const panel = document.createElement('div')

  lookTransition(jest.fn(), undefined, panel)
  lookTransition(jest.fn(), undefined, panel)
  ends[0]()
  await settle()
  expect(document.documentElement.style.viewTransitionName).toBe('none')
  expect(panel.style.viewTransitionName).toBe('look-panel')

  ends[1]()
  await settle()
  expect(document.documentElement.style.viewTransitionName).toBe('')
  expect(panel.style.viewTransitionName).toBe('')
})

test('a whole-page transition takes over from one kept to an element', () => {
  stubMotion(false)
  stubTransition(new Promise(() => {}))
  const panel = document.createElement('div')
  lookTransition(jest.fn(), undefined, panel)
  lookTransition(jest.fn())
  expect(document.documentElement.style.viewTransitionName).toBe('')
  expect(panel.style.viewTransitionName).toBe('')
})

describe('a click while a transition covers the window', () => {
  const root = document.documentElement
  let end = () => {}
  const skipTransition = jest.fn(() => end())
  const settle = () => new Promise((done) => setTimeout(done))

  beforeEach(() => {
    stubMotion(false)
    skipTransition.mockClear()
    root.animate = jest.fn()
    document.startViewTransition = jest.fn(() => ({
      ready: new Promise(() => {}),
      finished: new Promise<void>((done) => { end = done }),
      skipTransition,
    })) as unknown as typeof document.startViewTransition
  })
  afterEach(() => { delete (document as Partial<Document>).elementFromPoint })

  function under(element: Element | null) {
    document.elementFromPoint = jest.fn(() => element)
  }

  test('ends it, and goes to the button under the pointer', async () => {
    const dialog = document.body.appendChild(document.createElement('div'))
    const button = dialog.appendChild(document.createElement('button'))
    const pressed = jest.fn()
    button.addEventListener('click', pressed)
    under(button)
    lookTransition(jest.fn(), undefined, dialog)
    root.dispatchEvent(new MouseEvent('click', { clientX: 5, clientY: 6 }))
    expect(skipTransition).toHaveBeenCalledTimes(1)
    await settle()
    expect(document.elementFromPoint).toHaveBeenCalledWith(5, 6)
    expect(pressed).toHaveBeenCalledTimes(1)
    dialog.remove()
  })

  test('never goes to anything outside the dialog: a click there must not close it', async () => {
    const dialog = document.body.appendChild(document.createElement('div'))
    const outside = document.body.appendChild(document.createElement('button'))
    const pressed = jest.fn()
    outside.addEventListener('click', pressed)
    under(outside)
    lookTransition(jest.fn(), undefined, dialog)
    root.dispatchEvent(new MouseEvent('click'))
    await settle()
    expect(pressed).not.toHaveBeenCalled()
    dialog.remove()
    outside.remove()
  })

  test('a click on the page itself is left alone, as the keyboard presses a real button', async () => {
    const dialog = document.body.appendChild(document.createElement('div'))
    const button = dialog.appendChild(document.createElement('button'))
    lookTransition(jest.fn(), undefined, dialog)
    button.click()
    await settle()
    expect(skipTransition).not.toHaveBeenCalled()
    end()
    dialog.remove()
  })
})

test('a sweep kept to a box runs across that box, not the window', () => {
  window.innerWidth = 2000
  window.innerHeight = 1000
  const ends = (sweepEdge('slanted', { width: 400, height: 300 }).keyframes.clipPath as string[])[1]
  const xs = points(ends).slice(1, -1)
  expect(Math.min(...xs)).toBeGreaterThanOrEqual(400)
  expect(Math.max(...xs)).toBeLessThan(500)
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
