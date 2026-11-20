import { render, screen } from '@testing-library/react'
import RankingsPageUser from './RankingsPageUser'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))

const row = { username: 'ana', avatar: null, isMe: false, online: false }

test('the name is the one link, stretched over its row, with the focus ring round the row', () => {
  render(
    <div className="relative">
      <RankingsPageUser row={row} linked rowRadius="after:rounded-tile" />
    </div>,
  )
  const links = screen.getAllByRole('link')
  expect(links).toHaveLength(1)
  expect(links[0]).toHaveAccessibleName('ana')
  expect(links[0]).toHaveAttribute('href', '/user/ana')
  expect(links[0]).toHaveClass('after:absolute', 'after:inset-0', 'focus-visible:after:ring-2', 'after:rounded-tile')
})

test('someone who cannot be opened stays plain', () => {
  render(<RankingsPageUser row={row} linked={false} />)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
  expect(screen.getByText('ana')).toBeInTheDocument()
})
