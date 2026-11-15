import { en } from '@/translations/en'
import { es } from '@/translations/es'
import { groupError, profileFieldError, psnVerifyError, signupError } from './apiErrors'

describe('signupError', () => {
  test('a known code is the reader\'s language', () => {
    expect(signupError('username-taken', en)).toBe(en.steamAuth.usernameTaken)
    expect(signupError('too-many', es)).toBe(es.steamAuth.tooMany)
    expect(signupError('closed', en)).toBe(en.steamAuth.closed)
  })

  test('the rules say their numbers', () => {
    expect(signupError('username-invalid', en)).toBe('3–20 characters: letters, numbers or underscore')
    expect(signupError('password-weak', en)).toBe('At least 8 characters')
  })

  test('a sentence or an unknown code is never shown as it came', () => {
    expect(signupError('Username ya en uso', en)).toBe(en.registerForm.errorCreating)
    expect(signupError(undefined, en)).toBe(en.registerForm.errorCreating)
    expect(signupError('toString', en)).toBe(en.registerForm.errorCreating)
  })
})

describe('profileFieldError', () => {
  test('maps the codes the profile route answers', () => {
    expect(profileFieldError('wrong-password', en)).toBe(en.changePassword.wrongPassword)
    expect(profileFieldError('email-taken', es)).toBe(es.editProfileModal.emailTaken)
  })

  test('anything else is the generic text', () => {
    expect(profileFieldError('Invalid gender', en)).toBe(en.editProfileModal.errorGeneric)
    expect(profileFieldError(null, en)).toBe(en.editProfileModal.errorGeneric)
  })
})

describe('groupError', () => {
  test('the limit says its number; anything else is the save failure', () => {
    expect(groupError('groups-max', en)).toContain('10')
    expect(groupError('title-required', en)).toBe(en.groups.titleRequired)
    expect(groupError('Máximo 10 grupos permitidos', en)).toBe(en.groups.saveFailed)
  })
})

describe('psnVerifyError', () => {
  test.each(['no-code', 'not-found', 'taken', 'private', 'rate-limited', 'not-configured'] as const)('%s is said in the reader\'s language', (code) => {
    expect(psnVerifyError(code, en)).toBe(en.psn.verification.errors[code])
    expect(psnVerifyError(code, es)).toBe(es.psn.verification.errors[code])
  })

  test('anything else is the generic text, never the raw code', () => {
    expect(psnVerifyError('failed', en)).toBe(en.psn.verification.errors.failed)
    expect(psnVerifyError('toString', en)).toBe(en.psn.verification.errors.failed)
    expect(psnVerifyError(undefined, es)).toBe(es.psn.verification.errors.failed)
  })
})
