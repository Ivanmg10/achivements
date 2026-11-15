import { aboutMeHasCode, makePsnVerificationCode, normalizePsnVerification, psnVerificationExpiry, PSN_VERIFICATION_TTL_MS } from './psnVerification'

test('a code is CV- and eight characters without look-alikes', () => {
  for (let i = 0; i < 200; i++) expect(makePsnVerificationCode()).toMatch(/^CV-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/)
})

test('codes differ', () => {
  expect(new Set(Array.from({ length: 50 }, makePsnVerificationCode)).size).toBe(50)
})

test('normalising keeps upper case letters and digits only', () => {
  expect(normalizePsnVerification('cv-ab 12\n_x')).toBe('CVAB12X')
})

test.each([
  ['CV-ABCD2345', 'CV-ABCD2345'],
  ['hello cv-abcd2345 bye', 'CV-ABCD2345'],
  ['CV-ABCD\n2345', 'CV-ABCD2345'],
  ['CV ABCD 2345', 'CV-ABCD2345'],
])('finds the code in %j', (aboutMe, code) => {
  expect(aboutMeHasCode(aboutMe, code)).toBe(true)
})

test.each([
  ['CV-ABCD2346', 'CV-ABCD2345'],
  ['CV-ABCD', 'CV-ABCD2345'],
  ['', 'CV-ABCD2345'],
  [null, 'CV-ABCD2345'],
  ['anything', ''],
  ['anything', null],
])('does not find %j for %j', (aboutMe, code) => {
  expect(aboutMeHasCode(aboutMe, code)).toBe(false)
})

test('a code lives 24 hours', () => {
  expect(psnVerificationExpiry(1000).getTime()).toBe(1000 + PSN_VERIFICATION_TTL_MS)
  expect(PSN_VERIFICATION_TTL_MS).toBe(86_400_000)
})
