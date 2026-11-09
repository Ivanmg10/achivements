import type { Translations } from '@/translations/en'
import { GROUPS_PER_USER_MAX } from '@/utils/groupValidation'
import { PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from '@/utils/authValidation'

/**
 * The text for a code the account routes answer with. The server never sends a
 * sentence: a code it has no text for falls back to `fallback`, so a person is
 * never shown a raw `data.error`.
 */
function byCode(codes: Record<string, string>, code: unknown, fallback: string): string {
  return typeof code === 'string' && Object.hasOwn(codes, code) ? codes[code] : fallback
}

const usernameRule = (T: Translations) =>
  T.registerForm.usernameRule.replace('{min}', String(USERNAME_MIN)).replace('{max}', String(USERNAME_MAX))

/** `POST /api/users` (sign-up) failures. */
export function signupError(code: unknown, T: Translations): string {
  return byCode(
    {
      'email-taken': T.registerForm.emailTaken,
      'key-in-use': T.raLoginModal.keyInUse,
      'ra-invalid': T.raLoginModal.invalid,
      'ra-unavailable': T.registerForm.raUnavailable,
      'username-taken': T.steamAuth.usernameTaken,
      'username-invalid': usernameRule(T),
      'password-weak': T.registerForm.passwordRule.replace('{min}', String(PASSWORD_MIN)),
      'email-invalid': T.passwordReset.emailInvalid,
      closed: T.steamAuth.closed,
      'too-many': T.steamAuth.tooMany,
    },
    code,
    T.registerForm.errorCreating,
  )
}

/** `POST /api/updateUserProfile` failures (a name, an email, the picture, the location, the gender…). */
export function profileFieldError(code: unknown, T: Translations): string {
  return byCode(
    {
      'wrong-password': T.changePassword.wrongPassword,
      'too-many-attempts': T.changePassword.tooManyAttempts,
      'username-taken': T.steamAuth.usernameTaken,
      'username-invalid': usernameRule(T),
      'email-taken': T.editProfileModal.emailTaken,
      'email-invalid': T.passwordReset.emailInvalid,
    },
    code,
    T.editProfileModal.errorGeneric,
  )
}

/** Creating or saving a group (`POST /api/groups`, `PUT /api/groups/[id]`). */
export function groupError(code: unknown, T: Translations): string {
  return byCode(
    {
      'title-required': T.groups.titleRequired,
      'groups-max': T.groups.maxGroups.replace('{n}', String(GROUPS_PER_USER_MAX)),
    },
    code,
    T.groups.saveFailed,
  )
}
