import { render, screen } from '@testing-library/react'
import PublicUserAbout from './PublicUserAbout'
import { useSubject } from '@/context/SubjectContext'
import { en } from '@/translations/en'

jest.mock('@/context/SubjectContext', () => ({ useSubject: jest.fn(() => 'ivan') }))
jest.mock('@/components/groups/group-card/GroupCard', () => ({
  __esModule: true,
  default: ({ group }: { group: { title: string } }) => <span>{group.title}</span>,
}))

const USER = {
  username: 'ivan', avatar: null, description: null, location: null, ra: 'IvanRA', steam: true, psn: false,
  theme: 'synthwave', gender: 'female' as const,
  favorites: { ra: { id: 1, title: 'Zelda', imageIcon: '/i.png' }, steam: { id: 7, title: 'Portal', imageIcon: '' }, psn: null },
  groups: [{ id: 3, title: 'RPGs' }] as never[],
}

test('their theme, gender and favourite games, each opening their progress', () => {
  render(<PublicUserAbout user={USER} />)
  expect(screen.getByText(en.userTheme.name_synthwave)).toBeInTheDocument()
  expect(screen.getByText(en.userData.genderFemale)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Zelda/ })).toHaveAttribute('href', '/user/ivan/ra/1')
  expect(screen.getByRole('link', { name: /Portal/ })).toHaveAttribute('href', '/user/ivan/steam/7')
  expect(useSubject).toHaveBeenCalled()
})

test('their public groups', () => {
  render(<PublicUserAbout user={USER} />)
  expect(screen.getByText('RPGs')).toBeInTheDocument()
})

test('what they did not set or show stays out, and says so where it helps', () => {
  render(<PublicUserAbout user={{ ...USER, theme: 'unknown-theme', gender: null, favorites: undefined, groups: undefined }} />)
  expect(screen.getByText('unknown-theme')).toBeInTheDocument()
  expect(screen.queryByText(en.userData.gender)).not.toBeInTheDocument()
  expect(screen.getByText(en.userProfile.noFavorites)).toBeInTheDocument()
  expect(screen.getByText(en.userProfile.noGroups)).toBeInTheDocument()
})
