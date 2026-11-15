import { FEED_VIEW_MOTION, feedViewTransition } from './feedViewMotion'

test('the views fade and shift a little; reduced motion swaps them at once', () => {
  expect(FEED_VIEW_MOTION.initial.opacity).toBe(0)
  expect(feedViewTransition(false).duration).toBeGreaterThan(0)
  expect(feedViewTransition(true).duration).toBe(0)
})
