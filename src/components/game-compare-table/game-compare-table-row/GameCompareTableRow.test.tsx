import { render, screen } from '@testing-library/react'
import GameCompareTableRow from './GameCompareTableRow'
import type { CompareRow } from '@/utils/gameCompare'
import { en } from '@/translations/en'

const ROW: CompareRow = {
  id: '1', title: 'Win', description: '', iconUrl: 'https://x/b.png', rarity: null, earned: false, earnedAt: null,
  mine: { earned: false, earnedAt: null },
}

const renderRow = (row: CompareRow, comparing: boolean) =>
  render(
    <ul>
      <GameCompareTableRow row={row} username="ivan" comparing={comparing} mineLoading={false} />
    </ul>,
  )

test("a badge nobody has is greyed out; one either of you has is not", () => {
  const { container, unmount } = renderRow(ROW, true)
  expect(container.querySelector('img')).toHaveClass('grayscale')
  unmount()
  const again = renderRow({ ...ROW, mine: { earned: true, earnedAt: null } }, true)
  expect(again.container.querySelector('img')).not.toHaveClass('grayscale')
})

test('your column only when comparing', () => {
  const { unmount } = renderRow(ROW, false)
  expect(screen.queryByText(en.userProfile.you)).not.toBeInTheDocument()
  unmount()
  const { container } = renderRow({ ...ROW, iconUrl: null }, true)
  expect(screen.getByText(en.userProfile.you)).toBeInTheDocument()
  expect(container.querySelector('img')).toBeNull()
})
