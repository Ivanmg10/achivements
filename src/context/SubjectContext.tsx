'use client'

import { createContext, useContext } from 'react'

/**
 * Whose data the components below are showing: null for the signed-in user's
 * own (the main page), or a CheevoVault username on someone's public profile.
 * Read hooks pass it through `withSubject`, so the same hooks and cards serve both.
 */
export const SubjectContext = createContext<string | null>(null)

export const useSubject = () => useContext(SubjectContext)
