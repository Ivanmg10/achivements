/**
 * What `useAchievementPins` answers in a component's test: the pins' state as plain lists of ids, and
 * the `toggle` to look at. Use with
 * `jest.mock('@/hooks/useAchievementPins', () => ({ ...jest.requireActual('@/hooks/useAchievementPins'), useAchievementPins: jest.fn() }))`
 * (the real specs, a fake hook).
 */
export function mockPins<T>(
  idOf: (item: T) => string | number,
  { canPin = true, pinned = [], leading = pinned }: { canPin?: boolean; pinned?: (string | number)[]; leading?: (string | number)[] } = {},
) {
  const toggle = jest.fn()
  const shown = new Set(pinned)
  const first = new Set(leading)
  return { toggle, value: { pins: { canPin, isPinned: (t: T) => shown.has(idOf(t)), leads: (t: T) => first.has(idOf(t)), toggle }, error: null } }
}
