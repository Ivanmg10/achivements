import { PSN_VERIFIED_JOINED, psnVerifiedFor } from './vaultGate'

test('the joined clause lets every other platform through and PSN only for a verified account', () => {
  expect(PSN_VERIFIED_JOINED).toBe("(g.source <> 'psn' OR u.psn_verified_at IS NOT NULL)")
})

test('the standalone clause asks the users table about the row\'s own user', () => {
  expect(psnVerifiedFor('g.source', 'g.user_id')).toBe(
    "(g.source <> 'psn' OR EXISTS (SELECT 1 FROM users pv WHERE pv.id = g.user_id AND pv.psn_verified_at IS NOT NULL))",
  )
})
