import { render, screen } from '@testing-library/react'
import MainPageProfilePsnSync from './MainPageProfilePsnSync'

const MIN = 60_000

test('says when the library was read and when the refresh button reads it again', () => {
  const now = Date.now()
  render(<MainPageProfilePsnSync syncedAt={now - 3 * MIN} nextSyncAt={now + 7 * MIN} />)
  expect(screen.getByText(/Updated 3 minutes ago/)).toBeInTheDocument()
  expect(screen.getByText(/next update in 7 minutes/)).toBeInTheDocument()
})

test('once the next update is due, only when it was read', () => {
  const now = Date.now()
  render(<MainPageProfilePsnSync syncedAt={now - 20 * MIN} nextSyncAt={now - 10 * MIN} />)
  expect(screen.getByText(/Updated 20 minutes ago/)).toBeInTheDocument()
  expect(screen.queryByText(/next update/)).not.toBeInTheDocument()
})

test('nothing before the first read', () => {
  const { container } = render(<MainPageProfilePsnSync syncedAt={null} nextSyncAt={null} />)
  expect(container).toBeEmptyDOMElement()
})
