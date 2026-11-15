import { render, screen } from '@testing-library/react'
import PublicUserPlatformChips from './PublicUserPlatformChips'
import { en } from '@/translations/en'

const USER = { username: 'ivan', avatar: null, description: null, location: null, ra: 'IvanRA', steam: true, psn: true, steamName: 'ivan_st', psnName: null }

test('names each linked account; RA opens their RA profile in a new tab', () => {
  render(<PublicUserPlatformChips user={USER} />)
  expect(screen.getByRole('list', { name: en.userProfile.platformsLabel })).toBeInTheDocument()
  const ra = screen.getByRole('link', { name: `IvanRA — ${en.userProfile.openOnRa}` })
  expect(ra).toHaveAttribute('href', 'https://retroachievements.org/user/IvanRA')
  expect(ra).toHaveAttribute('target', '_blank')
  expect(screen.getByText('ivan_st')).toBeInTheDocument()
  // No PSN name kept: the platform's name stands in.
  expect(screen.getByText('PlayStation')).toBeInTheDocument()
  expect(screen.getAllByRole('link')).toHaveLength(1)
})

test('nothing linked, nothing shown', () => {
  const { container } = render(<PublicUserPlatformChips user={{ ...USER, ra: null, steam: false, psn: false }} />)
  expect(container).toBeEmptyDOMElement()
})

test('a PSN account proven theirs says so in words, not only in colour', () => {
  render(<PublicUserPlatformChips user={{ ...USER, psnName: 'Hakoom', psnVerified: true }} />)
  expect(screen.getByText(en.psn.verification.verified)).toHaveAttribute('title', en.psn.verification.publicVerified)
})

test('an unproven one carries no mark', () => {
  render(<PublicUserPlatformChips user={{ ...USER, psnName: 'Hakoom', psnVerified: false }} />)
  expect(screen.queryByText(en.psn.verification.verified)).not.toBeInTheDocument()
})
