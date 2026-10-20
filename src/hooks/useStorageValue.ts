import { useCallback, useSyncExternalStore } from 'react'

export type StorageKind = 'local' | 'session'

const listeners = new Set<() => void>()
/** Values that could not be written (storage blocked), so the choice still applies until the page is left. */
const unsaved = new Map<string, string | null>()

const slot = (kind: StorageKind, key: string) => `${kind}:${key}`
const area = (kind: StorageKind) => (kind === 'local' ? window.localStorage : window.sessionStorage)

function read(kind: StorageKind, key: string): string | null {
  const s = slot(kind, key)
  if (unsaved.has(s)) return unsaved.get(s) ?? null
  try {
    return area(kind).getItem(key)
  } catch {
    return null
  }
}

type WriteObserver = (key: string, value: string | null) => void
const observers = new Set<WriteObserver>()
/** True while a value that came from somewhere else (the account) is being applied: it must not be sent back. */
let applying = false

/** Hears every localStorage value the person changes; not the ones applied by `applyStoredValue`. */
export function observeStoredWrites(observer: WriteObserver) {
  observers.add(observer)
  return () => {
    observers.delete(observer)
  }
}

/** Writes a value that came from the account, so every component showing it updates, without it being observed as a change. */
export function applyStoredValue(key: string, value: string | null) {
  applying = true
  try {
    write('local', key, value)
  } finally {
    applying = false
  }
}

/** The localStorage keys with a value now (what is saved or kept unsaved). */
export function storedKeys(): string[] {
  const keys = new Set<string>()
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k) keys.add(k)
    }
  } catch {
    // Storage blocked: only what was kept in memory.
  }
  for (const s of unsaved.keys()) if (s.startsWith('local:') && unsaved.get(s) !== null) keys.add(s.slice('local:'.length))
  return [...keys]
}

export function readStoredValue(key: string): string | null {
  return read('local', key)
}

function write(kind: StorageKind, key: string, value: string | null) {
  const s = slot(kind, key)
  try {
    if (value === null) area(kind).removeItem(key)
    else area(kind).setItem(key, value)
    unsaved.delete(s)
  } catch {
    unsaved.set(s, value)
  }
  listeners.forEach((l) => l())
  if (kind === 'local' && !applying) observers.forEach((o) => o(key, value))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changing a localStorage value reaches this one too.
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/** Forgets values that could not be saved. For tests, which share this module between cases. */
export function forgetUnsavedValues() {
  unsaved.clear()
}

/**
 * A value remembered in this browser, as React state that every component
 * asking for the same key shares. `undefined` while rendering on the server
 * and while hydrating (so both render the same, with no flash), then the saved
 * value or `null`. A missing or unreadable value is `null`; if storage cannot
 * be written the value is still kept until the page is left.
 *
 * `key` null reads nothing and writes nothing.
 */
export function useStorageValue(key: string | null, kind: StorageKind = 'local') {
  const value = useSyncExternalStore(
    subscribe,
    () => (key === null ? null : read(kind, key)),
    () => undefined,
  )
  const set = useCallback(
    (next: string | null) => {
      if (key !== null) write(kind, key, next)
    },
    [key, kind],
  )
  return [value, set] as const
}
