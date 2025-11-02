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
      try {
        const params = new URLSearchParams()
        if (status) params.set('status', status)
        
        const response = await fetch(`/api/teamwork/projects?${params.toString()}`)
        if (!response.ok) {
          console.error('Projects API failed:', response.status, response.statusText)
          return []
        }
        const data = await response.json()
        
        // Check if response contains an error
        if (data.error) {
          console.error('Projects API returned error:', data.error)
          return []
        }
        
        // Handle various response formats from Teamwork API
        return (data?.projects || data || []) as TeamworkProject[]
      } catch (error) {
        console.error('Projects fetch failed:', error)
        return []
      }
    },
  })
}

export function useTeamworkCategories() {
  return useQuery({
    queryKey: ['teamwork-categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/teamwork/categories')
        if (!response.ok) {
          console.error('Categories API failed:', response.status, response.statusText)
          return []
        }
        const data = await response.json()
        
        // Check if response contains an error
        if (data.error) {
          console.error('Categories API returned error:', data.error)
          return []
        }
        
        // Handle various response formats from Teamwork API
        return (data?.categories || data || []) as TeamworkCategory[]
      } catch (error) {
        console.error('Categories fetch failed:', error)
        return []
      }
    },
  })
}

export function useTeamworkPeople() {
  return useQuery({
    queryKey: ['teamwork-people'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/teamwork/people')
        if (!response.ok) {
          console.error('People API failed:', response.status, response.statusText)
          return []
        }
        const data = await response.json()
        
        // Check if response contains an error
        if (data.error) {
          console.error('People API returned error:', data.error)
          return []
        }
        
        // Handle various response formats from Teamwork API
        return (data?.people || data || []) as TeamworkPerson[]
      } catch (error) {
        console.error('People fetch failed:', error)
        return []
      }
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

