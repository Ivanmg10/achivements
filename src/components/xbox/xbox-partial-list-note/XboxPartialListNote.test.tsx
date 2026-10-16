import { render, screen } from '@testing-library/react'
import XboxPartialListNote from './XboxPartialListNote'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const GAME = xboxGameFixture({ maxPossible: 50, totalKnown: true })

test('says so when fewer achievements come than the game has', () => {
  render(<XboxPartialListNote game={GAME} listed={14} />)
  expect(screen.getByRole('status')).toHaveTextContent(en.xbox.partialList)
})

test('says nothing when the list is complete, or when the total is unknown', () => {
  const { container, rerender } = render(<XboxPartialListNote game={GAME} listed={50} />)
  expect(container).toBeEmptyDOMElement()
  rerender(<XboxPartialListNote game={{ ...GAME, totalKnown: false, maxPossible: 0 }} listed={3} />)
  expect(container).toBeEmptyDOMElement()
})
