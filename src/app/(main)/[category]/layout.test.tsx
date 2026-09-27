import { notFound } from 'next/navigation'
import CategoryLayout from './layout'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

test.each(['wantToPlay', 'playing', 'completed'])('renders the %s category', async (category) => {
  const out = await CategoryLayout({ children: 'page', params: Promise.resolve({ category }) })
  expect(out).toBeTruthy()
  expect(notFound).not.toHaveBeenCalled()
})

test.each(['robots.txt', 'llms.txt', 'foo'])('answers 404 for /%s instead of an empty list', async (category) => {
  await expect(CategoryLayout({ children: 'page', params: Promise.resolve({ category }) })).rejects.toThrow('NEXT_NOT_FOUND')
})
