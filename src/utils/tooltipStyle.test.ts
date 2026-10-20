import { tooltipStyle } from './tooltipStyle'

test('beside the pointer, to its right and just above, when there is room', () => {
  expect(tooltipStyle(100, 200, 1920, 1080)).toEqual({ left: 114, top: 190, transform: 'translate(0, 0)' })
})

test('to the pointer’s left when it would run off the right edge', () => {
  expect(tooltipStyle(1850, 200, 1920, 1080)).toEqual({ left: 1836, top: 190, transform: 'translate(-100%, 0)' })
})

test('above the pointer’s line when it would run off the bottom', () => {
  expect(tooltipStyle(100, 1000, 1920, 1080)).toEqual({ left: 114, top: 1010, transform: 'translate(0, -100%)' })
})

test('both at the bottom-right corner', () => {
  expect(tooltipStyle(1900, 1070, 1920, 1080)).toEqual({ left: 1886, top: 1080, transform: 'translate(-100%, -100%)' })
})

test('exactly fitting stays on the right', () => {
  expect(tooltipStyle(1920 - 14 - 260, 0, 1920, 1080).transform).toBe('translate(0, 0)')
})
