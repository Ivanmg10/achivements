'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { GameGroup } from '@/types/types'

export function useGroups() {
  const { status } = useSession()
  const [groups, setGroups] = useState<GameGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetched = useRef(false)

  const fetchGroups = useCallback(async () => {
    if (status !== 'authenticated') { setIsLoading(false); return }
    try {
      const res = await fetch('/api/groups')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setGroups(Array.isArray(data) ? data : [])
      setError(null)
    } catch {
      setError('Error loading groups')
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { setIsLoading(false); return }
    if (fetched.current) return
    fetched.current = true
    fetchGroups()
  }, [status, fetchGroups])

  const createGroup = useCallback(async (data: {
    title: string
    description?: string
    icon?: string
    is_public?: boolean
  }) => {
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message ?? 'Error')
    }
    const group: GameGroup = await res.json()
    setGroups((prev) => [...prev, group])
    return group
  }, [])

  const updateGroup = useCallback(async (id: number, data: {
    title: string
    description?: string
    icon?: string
    is_public?: boolean
  }) => {
    const res = await fetch(`/api/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message ?? 'Error')
    }
    const updated: GameGroup = await res.json()
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)))
    return updated
  }, [])

  const deleteGroup = useCallback(async (id: number) => {
    const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error deleting group')
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }, [])

  return { groups, isLoading, error, fetchGroups, createGroup, updateGroup, deleteGroup, setGroups }
}
