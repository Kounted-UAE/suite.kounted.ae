// hooks/useTeamworkProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TeamworkProject, TeamworkCategory, TeamworkPerson } from '@/lib/teamwork/projects'

interface BulkUpdateItem {
  id: string
  updates: Record<string, any>
}

export function useTeamworkProjects(status: 'active' | 'archived' | 'all' = 'active') {
  return useQuery({
    queryKey: ['teamwork-projects', status],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      
      const response = await fetch(`/api/teamwork/projects?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await response.json()
      return data.projects as TeamworkProject[]
    },
  })
}

export function useTeamworkCategories() {
  return useQuery({
    queryKey: ['teamwork-categories'],
    queryFn: async () => {
      const response = await fetch('/api/teamwork/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      return data.categories as TeamworkCategory[]
    },
  })
}

export function useTeamworkPeople() {
  return useQuery({
    queryKey: ['teamwork-people'],
    queryFn: async () => {
      const response = await fetch('/api/teamwork/people')
      if (!response.ok) {
        throw new Error('Failed to fetch people')
      }
      const data = await response.json()
      return data.people as TeamworkPerson[]
    },
  })
}

export function useUpdateTeamworkProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Record<string, any> }) => {
      const response = await fetch(`/api/teamwork/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update project')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamwork-projects'] })
    },
  })
}

export function useBulkUpdateTeamworkProjects() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (updates: BulkUpdateItem[]) => {
      const response = await fetch('/api/teamwork/projects/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to bulk update projects')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamwork-projects'] })
    },
  })
}

