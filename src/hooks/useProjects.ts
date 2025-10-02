'use client'

import { useState, useEffect } from 'react'

interface Project {
  id: string
  title: string
  slug: string
  description: string
  thumbnail: string | null
  tags: string[]
  category: string
  viewCount: number
  createdAt: Date
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }
        const data = await response.json()
        setProjects(data.projects)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return { projects, isLoading, error }
}
