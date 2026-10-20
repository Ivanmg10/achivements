'use client'

import { usePreferencesSync } from '@/hooks/usePreferencesSync'

/** Draws nothing: starts the sync of the display preferences with the account. */
export default function PreferencesSync() {
  usePreferencesSync()
  return null
}
