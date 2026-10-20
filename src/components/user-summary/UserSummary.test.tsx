import { render, screen } from '@testing-library/react'
import UserSummary from './UserSummary'
import { en } from '@/translations/en'

test('picture, name, country, bio and platforms, each platform named', () => {
  const { container } = render(<UserSummary user={{ username: 'ivan', avatar: 'https://x/a.png', location: 'ES', description: 'Retro fan', ra: true, steam: true, psn: false }} />)
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://x/a.png')
  expect(screen.getByText('ivan')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Spain' })).toBeInTheDocument()
  expect(screen.getByText('Retro fan')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'RetroAchievements' })).toBeInTheDocument()
  expect(screen.getByLabelText('Steam')).toBeInTheDocument()
})

test('without picture, country, bio or platforms, just the name', () => {
  const { container } = render(<UserSummary user={{ username: 'ivan', avatar: null, ra: false, steam: false, psn: false }} />)
  expect(container.querySelector('img')).toBeNull()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.getByText('ivan')).toBeInTheDocument()
})

test('online, or when last seen, in place of the bio', () => {
  const user = { username: 'ivan', avatar: null, description: 'Retro fan', ra: true, steam: false, psn: false }
  const { rerender } = render(<UserSummary user={{ ...user, online: true, lastSeenAt: new Date().toISOString() }} />)
  expect(screen.getByText(en.following.online)).toBeInTheDocument()
  expect(screen.queryByText('Retro fan')).not.toBeInTheDocument()
  rerender(<UserSummary user={{ ...user, online: false, lastSeenAt: new Date(Date.now() - 2 * 3600e3).toISOString() }} />)
  expect(screen.getByText(/^Seen .*2 hr/)).toBeInTheDocument()
})
