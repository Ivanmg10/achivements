/**
 * The rules the register endpoint enforces ([api/users/route.ts]), repeated
 * here so the form can say what is wrong before asking the server. The server
 * stays the authority — this only saves a round trip and a vague error.
 */
export const USERNAME_MIN = 3
export const USERNAME_MAX = 20
export const PASSWORD_MIN = 6

const USERNAME_SHAPE = /^[a-zA-Z0-9_]+$/
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type FieldRule = 'empty' | 'shape' | null

/** What is wrong with a username, or null when it will be accepted. */
export function checkUsername(value: string): FieldRule {
  const name = value.trim()
  if (!name) return 'empty'
  if (name.length < USERNAME_MIN || name.length > USERNAME_MAX || !USERNAME_SHAPE.test(name)) return 'shape'
  return null
}

/** What is wrong with an address, or null when it will be accepted. */
export function checkEmail(value: string): FieldRule {
  const email = value.trim()
  if (!email) return 'empty'
  if (!EMAIL_SHAPE.test(email)) return 'shape'
  return null
}

/** What is wrong with a new password, or null when it will be accepted. */
export function checkPassword(value: string): FieldRule {
  if (!value) return 'empty'
  if (value.length < PASSWORD_MIN) return 'shape'
  return null
}
