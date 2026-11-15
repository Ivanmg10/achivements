import { fireEvent, render, screen } from '@testing-library/react'
import { useScrollFade } from './useScrollFade'
import { scrollFadeClass } from '@/components/ui/scrollFade'

function Strip({ fromEnd = false }: { fromEnd?: boolean }) {
  const { ref, fade } = useScrollFade({ fromEnd })
  return (
    <div ref={ref} data-testid="strip" className={fade}>
      <span>one</span>
    </div>
  )
}

/** A strip `client` px wide over `scroll` px of content, scrolled `left` px. */
function sized(client: number, scroll: number) {
  const box = { left: 0 }
  jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(client)
  jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scroll)
  jest.spyOn(HTMLElement.prototype, 'scrollLeft', 'get').mockImplementation(() => box.left)
  jest.spyOn(HTMLElement.prototype, 'scrollLeft', 'set').mockImplementation((v: number) => {
    box.left = Math.max(0, Math.min(v, scroll - client))
  })
  return box
}

afterEach(() => jest.restoreAllMocks())

test('the class fades the edge, or both, with more past it, and nothing when it fits', () => {
  expect(scrollFadeClass({ start: false, end: false })).toBe('')
  expect(scrollFadeClass({ start: false, end: true })).toContain('to_right')
  expect(scrollFadeClass({ start: true, end: false })).toContain('to_left')
  expect(scrollFadeClass({ start: true, end: true })).toContain('transparent,black_2.5rem')
})

test('a strip that fits does not fade', () => {
  sized(300, 300)
  render(<Strip />)
  expect(screen.getByTestId('strip')).toHaveAttribute('class', '')
})

test('more to the right fades the end; scrolled to the end, the start; in the middle, both', () => {
  const box = sized(300, 700)
  render(<Strip />)
  const strip = screen.getByTestId('strip')
  expect(strip).toHaveClass(scrollFadeClass({ start: false, end: true }))

  box.left = 400
  fireEvent.scroll(strip)
  expect(strip).toHaveClass(scrollFadeClass({ start: true, end: false }))

  box.left = 200
  fireEvent.scroll(strip)
  expect(strip).toHaveClass(scrollFadeClass({ start: true, end: true }))
})

test('fromEnd opens it on its end, so the fade says there is more before it', () => {
  sized(300, 700)
  render(<Strip fromEnd />)
  expect(screen.getByTestId('strip')).toHaveClass(scrollFadeClass({ start: true, end: false }))
})

test('a box that scrolls down fades its foot, then its top too once scrolled', () => {
  expect(scrollFadeClass({ start: false, end: true }, 'y')).toContain('to_bottom')
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300)
  jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(900)
  const top = jest.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockReturnValue(0)
  function Box() {
    const { ref, fade } = useScrollFade({ axis: 'y' })
    return <div ref={ref} data-testid="box" className={fade} />
  }
  render(<Box />)
  expect(screen.getByTestId('box').className).toContain('to_bottom,black_calc')
  top.mockReturnValue(200)
  fireEvent.scroll(screen.getByTestId('box'))
  expect(screen.getByTestId('box').className).toContain('transparent,black_2.5rem')
})
