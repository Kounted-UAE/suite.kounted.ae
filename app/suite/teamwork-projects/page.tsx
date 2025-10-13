'use client'

import { useState, useMemo } from 'react'
import { useTeamworkProjects, useTeamworkCategories, useTeamworkPeople, useBulkUpdateTeamworkProjects } from '@/hooks/useTeamworkProjects'
import { TeamworkProject } from '@/lib/teamwork/projects'
import { Button } from '@/components/react-ui/button'
import { Input } from '@/components/react-ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/react-ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/react-ui/select'
import { Badge } from '@/components/react-ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/react-ui/card'
import { Checkbox } from '@/components/react-ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/react-ui/dialog'
import { Label } from '@/components/react-ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, RefreshCw, Edit, Save } from 'lucide-react'

interface ProjectEdit {
  id: string
  categoryId?: string
  ownerId?: string
}

export default function TeamworkProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [editMode, setEditMode] = useState(false)
  const [projectEdits, setProjectEdits] = useState<Map<string, ProjectEdit>>(new Map())
  const [bulkEditDialog, setBulkEditDialog] = useState(false)
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('')
  const [bulkOwnerId, setBulkOwnerId] = useState<string>('')

  const { toast } = useToast()

  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useTeamworkProjects(statusFilter)
  const { data: categories, isLoading: categoriesLoading } = useTeamworkCategories()
  const { data: people, isLoading: peopleLoading } = useTeamworkPeople()
  const bulkUpdateMutation = useBulkUpdateTeamworkProjects()

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!projects) return []
    
    return projects.filter(project => {
      const searchLower = searchQuery.toLowerCase()
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.company?.name?.toLowerCase().includes(searchLower) ||
        project.category?.name?.toLowerCase().includes(searchLower)
      )
    })
  }, [projects, searchQuery])

  // Toggle project selection
  const toggleProjectSelection = (projectId: string) => {
    const newSelected = new Set(selectedProjects)
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId)
    } else {
      newSelected.add(projectId)
    }
    setSelectedProjects(newSelected)
  }

  // Toggle all projects selection
  const toggleAllProjects = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set())
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)))
    }
  }

  // Update project edit
  const updateProjectEdit = (projectId: string, field: 'categoryId' | 'ownerId', value: string) => {
    const newEdits = new Map(projectEdits)
    const existing = newEdits.get(projectId) || { id: projectId }
    newEdits.set(projectId, { ...existing, [field]: value })
    setProjectEdits(newEdits)
  }

  // Save individual edits
  const saveEdits = async () => {
    if (projectEdits.size === 0) {
      toast({
        title: 'No changes',
        description: 'No edits to save.',
      })
      return
    }

    const updates = Array.from(projectEdits.values()).map(edit => ({
      id: edit.id,
      updates: {
        ...(edit.categoryId ? { categoryId: edit.categoryId } : {}),
        ...(edit.ownerId ? { ownerId: edit.ownerId } : {}),
      }
    }))

    try {
      const result = await bulkUpdateMutation.mutateAsync(updates)
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Successfully updated ${result.results.successful.length} project(s).`,
        })
        setProjectEdits(new Map())
        setEditMode(false)
      } else {
        toast({
          variant: 'destructive',
          title: 'Partial success',
          description: `Updated ${result.results.successful.length} projects, ${result.results.failed.length} failed.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save edits',
      })
    }
  }

  // Bulk update selected projects
  const applyBulkUpdate = async () => {
    if (selectedProjects.size === 0) {
      toast({
        title: 'No projects selected',
        description: 'Please select at least one project to update.',
      })
      return
    }

    if (!bulkCategoryId && !bulkOwnerId) {
      toast({
        title: 'No changes specified',
        description: 'Please select a category or owner to apply.',
      })
      return
    }

    const updates = Array.from(selectedProjects).map(id => ({
      id,
      updates: {
        ...(bulkCategoryId ? { categoryId: bulkCategoryId } : {}),
        ...(bulkOwnerId ? { ownerId: bulkOwnerId } : {}),
      }
    }))

    try {
      const result = await bulkUpdateMutation.mutateAsync(updates)
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Successfully updated ${result.results.successful.length} project(s).`,
        })
        setBulkEditDialog(false)
        setSelectedProjects(new Set())
        setBulkCategoryId('')
        setBulkOwnerId('')
      } else {
        toast({
          variant: 'destructive',
          title: 'Partial success',
          description: `Updated ${result.results.successful.length} projects, ${result.results.failed.length} failed.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to apply bulk update',
      })
    }
  }

  const isLoading = projectsLoading || categoriesLoading || peopleLoading

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teamwork Projects</CardTitle>
          <CardDescription>
            View and manage your Teamwork.com projects. Edit categories and owners individually or in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Projects</SelectItem>
                <SelectItem value="archived">Archived Projects</SelectItem>
                <SelectItem value="all">All Projects</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchProjects()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant={editMode ? 'default' : 'outline'}
              onClick={() => {
                setEditMode(!editMode)
                if (editMode) {
                  setProjectEdits(new Map())
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editMode ? 'Cancel Edit' : 'Edit Mode'}
            </Button>

            {editMode && projectEdits.size > 0 && (
              <Button onClick={saveEdits} disabled={bulkUpdateMutation.isPending}>
                {bulkUpdateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes ({projectEdits.size})
              </Button>
            )}

            {selectedProjects.size > 0 && (
              <Button onClick={() => setBulkEditDialog(true)}>
                Bulk Update ({selectedProjects.size})
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: {filteredProjects.length} projects</span>
            {selectedProjects.size > 0 && (
              <span>Selected: {selectedProjects.size}</span>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                        onCheckedChange={toggleAllProjects}
                      />
                    </TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => {
                      const edit = projectEdits.get(project.id)
                      const currentCategoryId = edit?.categoryId || project.category?.id || ''
                      const currentOwnerId = edit?.ownerId || project.owner?.id || ''

                      return (
                        <TableRow key={project.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProjects.has(project.id)}
                              onCheckedChange={() => toggleProjectSelection(project.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>{project.company?.name || '-'}</TableCell>
                          <TableCell>
                            {editMode ? (
                              <Select
                                value={currentCategoryId}
                                onValueChange={(value) => updateProjectEdit(project.id, 'categoryId', value)}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">No category</SelectItem>
                                  {categories?.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline">
                                {project.category?.name || 'None'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editMode ? (
                              <Select
                                value={currentOwnerId}
                                onValueChange={(value) => updateProjectEdit(project.id, 'ownerId', value)}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Select owner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">No owner</SelectItem>
                                  {people?.map((person) => (
                                    <SelectItem key={person.id} value={person.id}>
                                      {person.firstName} {person.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              project.owner ? (
                                <span>{project.owner.firstName} {project.owner.lastName}</span>
                              ) : (
                                '-'
                              )
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditDialog} onOpenChange={setBulkEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Projects</DialogTitle>
            <DialogDescription>
              Apply changes to {selectedProjects.size} selected project(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-category">Project Category</Label>
              <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                <SelectTrigger id="bulk-category">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-owner">Project Owner</Label>
              <Select value={bulkOwnerId} onValueChange={setBulkOwnerId}>
                <SelectTrigger id="bulk-owner">
                  <SelectValue placeholder="Select owner (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  {people?.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.firstName} {person.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={applyBulkUpdate} disabled={bulkUpdateMutation.isPending}>
              {bulkUpdateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Apply to {selectedProjects.size} Project(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

