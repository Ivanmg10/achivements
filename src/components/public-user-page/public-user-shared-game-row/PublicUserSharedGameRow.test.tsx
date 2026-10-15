import { render, screen } from '@testing-library/react'
import PublicUserSharedGameRow from './PublicUserSharedGameRow'
import { en } from '@/translations/en'

const GAME = { key: 'psn:2018800', source: 'psn' as const, id: 2018800, title: 'Bloodborne', subtitle: 'PlayStation', theirPct: 80, myPct: 20 }
const leads = (who: string) => en.userProfile.leads.replace('{who}', who)

test('opens the game side by side, with both progress bars and who is ahead', () => {
  render(<PublicUserSharedGameRow game={GAME} username="ivan" />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/user/ivan/psn/NPWR20188_00?compare=1')
  expect(screen.getByRole('progressbar', { name: 'Bloodborne — ivan' })).toHaveAttribute('aria-valuenow', '80')
  expect(screen.getByRole('progressbar', { name: `Bloodborne — ${en.userProfile.you}` })).toHaveAttribute('aria-valuenow', '20')
  expect(screen.getByText(`PlayStation · ${leads('ivan')}`)).toBeInTheDocument()
})

test('even, nobody is ahead; you can be', () => {
  const { unmount } = render(<PublicUserSharedGameRow game={{ ...GAME, theirPct: 50, myPct: 50 }} username="ivan" />)
  expect(screen.getByText('PlayStation')).toBeInTheDocument()
  unmount()
  render(<PublicUserSharedGameRow game={{ ...GAME, theirPct: 10, myPct: 100 }} username="ivan" />)
  expect(screen.getByText(`PlayStation · ${leads(en.userProfile.you)}`)).toBeInTheDocument()
})
