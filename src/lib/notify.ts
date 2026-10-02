/**
 * Toasts: short notices, bottom right, saying how an action went — green when
 * it worked, red when it did not. Callable from anywhere (components, hooks,
 * contexts) without wiring a provider: `notify.success(T.toast.groupCreated)`.
 * The <Toaster /> in the root layout draws them.
 *
 * Messages arrive already translated: the caller has the language.
 */
type ToastKind = 'success' | 'error'
export type Toast = { id: number; kind: ToastKind; message: string }

/** More than this and the oldest goes: a burst must not cover the page. */
const MAX_TOASTS = 4

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function push(kind: ToastKind, message: string): number {
  const toast = { id: nextId++, kind, message }
  toasts = [...toasts, toast].slice(-MAX_TOASTS)
  emit()
  return toast.id
}

export const notify = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

// The store, in the shape useSyncExternalStore wants.
export function subscribeToasts(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getToasts(): Toast[] {
  return toasts
}

const NONE: Toast[] = []
/** The server never has toasts: they only come from what happens in the browser. */
export function getServerToasts(): Toast[] {
  return NONE
}
