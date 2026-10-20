'use client'

import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat'

/** Draws nothing: tells the server, while the tab is visible, that the user is here. */
export default function PresenceHeartbeat() {
  usePresenceHeartbeat()
  return null
}
