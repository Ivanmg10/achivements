import { render, screen } from '@testing-library/react'
import UserSummary from './UserSummary'

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
