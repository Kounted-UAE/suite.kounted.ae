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
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from '@/components/react-ui/alert-dialog'
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
  const [confirmBulkDialog, setConfirmBulkDialog] = useState(false)

  const { toast } = useToast()

  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useTeamworkProjects(statusFilter)
  const { data: categories, isLoading: categoriesLoading } = useTeamworkCategories()
  const { data: people, isLoading: peopleLoading } = useTeamworkPeople()
  const bulkUpdateMutation = useBulkUpdateTeamworkProjects()

  // Ensure categories and people are always arrays
  const safeCategories = Array.isArray(categories) ? categories : []
  const safePeople = Array.isArray(people) ? people : []
  
  // Debug project data structure
  console.log('🔍 Debug Project Owners:')
  if (projects && projects.length > 0) {
    console.log('  First project:', projects[0])
    console.log('  Project owner structure:', {
      'project.owner': projects[0]?.owner,
      'project.ownerId': projects[0]?.ownerId,
      'project.responsible-party-id': projects[0]?.['responsible-party-id'],
    })
  }
  
  // Check if categories API is having issues (people API is working)
  const hasCategoryIssues = !categoriesLoading && safeCategories.length === 0 && safePeople.length > 0

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
    
    // Convert our constants to the values that Teamwork API expects
    let apiValue = value
    if (value === 'NO_CATEGORY' || value === 'NO_OWNER') {
      apiValue = '' // Empty string for Teamwork API to unassign
    }
    
    newEdits.set(projectId, { ...existing, [field]: apiValue })
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

  // Show confirmation for bulk update
  const showBulkUpdateConfirmation = () => {
    if (selectedProjects.size === 0) {
      toast({
        title: 'No projects selected',
        description: 'Please select at least one project to update.',
      })
      return
    }

    if ((!bulkCategoryId || bulkCategoryId === 'KEEP_CURRENT_CATEGORY') && (!bulkOwnerId || bulkOwnerId === 'KEEP_CURRENT_OWNER')) {
      toast({
        title: 'No changes specified',
        description: 'Please select a category or owner to apply.',
      })
      return
    }

    setConfirmBulkDialog(true)
  }

  // Bulk update selected projects
  const applyBulkUpdate = async () => {
    setConfirmBulkDialog(false) // Close confirmation dialog

    // Convert our constants to values that Teamwork API expects
    let categoryValue = ''
    let shouldUpdateCategory = false
    
    if (bulkCategoryId === 'UNASSIGN_CATEGORY') {
      categoryValue = ''
      shouldUpdateCategory = true
    } else if (bulkCategoryId && bulkCategoryId !== 'KEEP_CURRENT_CATEGORY') {
      categoryValue = bulkCategoryId
      shouldUpdateCategory = true
    }
    
    let ownerValue = ''
    let shouldUpdateOwner = false
    
    if (bulkOwnerId === 'UNASSIGN_OWNER') {
      ownerValue = ''
      shouldUpdateOwner = true
    } else if (bulkOwnerId && bulkOwnerId !== 'KEEP_CURRENT_OWNER') {
      ownerValue = bulkOwnerId
      shouldUpdateOwner = true
    }

    const updates = Array.from(selectedProjects).map(id => ({
      id,
      updates: {
        ...(shouldUpdateCategory ? { categoryId: categoryValue } : {}),
        ...(shouldUpdateOwner ? { ownerId: ownerValue } : {}),
      }
    }))

    const actionDescription = []
    if (bulkCategoryId === 'UNASSIGN_CATEGORY') {
      actionDescription.push('remove categories')
    } else if (bulkCategoryId && bulkCategoryId !== 'KEEP_CURRENT_CATEGORY') {
      const category = safeCategories.find(c => c.id === bulkCategoryId)
      actionDescription.push(`set category to "${category?.name || 'Unknown Category'}"`)
    }
    
    if (bulkOwnerId === 'UNASSIGN_OWNER') {
      actionDescription.push('unassign owners')
    } else if (bulkOwnerId && bulkOwnerId !== 'KEEP_CURRENT_OWNER') {
      const owner = safePeople.find(p => p.id === bulkOwnerId)
      actionDescription.push(`assign to "${owner?.firstName || 'Unknown'} ${owner?.lastName || 'Person'}"`)
    }

    try {
      const result = await bulkUpdateMutation.mutateAsync(updates)
      
      if (result.success) {
        toast({
          title: 'Bulk Update Successful',
          description: `Successfully updated ${result.results.successful.length} project(s) to ${actionDescription.join(' and ')}.`,
        })
        setBulkEditDialog(false)
        setSelectedProjects(new Set())
        setBulkCategoryId('')
        setBulkOwnerId('')
        refetchProjects() // Refresh the projects list
      } else {
        toast({
          variant: 'destructive',
          title: 'Partial success',
          description: `Updated ${result.results.successful.length} projects successfully. ${result.results.failed.length} failed.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Bulk Update Failed',
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
          {/* Categories API Issues Warning */}
          {hasCategoryIssues && (
            <div className="bg-zinc-100 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">
                  ⚠️
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Categories Data Not Loading
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Project categories cannot be loaded from Teamwork. This could be due to:
                  </p>
                  <ul className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 ml-4 space-y-1">
                    <li>• No categories configured in your Teamwork account</li>
                    <li>• API permission issues for the categories endpoint</li>
                    <li>• Network connectivity to Teamwork.com</li>
                  </ul>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    Check your browser's Network tab for API errors, or verify categories exist in Teamwork.
                  </p>
                </div>
              </div>
            </div>
          )}

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
              <SelectContent className="bg-white dark:bg-white">
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
          <div className="flex flex-wrap gap-2">
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
              <>
                <Button 
                  onClick={() => setBulkEditDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Bulk Update ({selectedProjects.size})
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedProjects(new Set())}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear Selection
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              Total: {filteredProjects.length} projects
            </span>
            {selectedProjects.size > 0 && (
              <span className="text-blue-600 font-medium">
                Selected: {selectedProjects.size} project{selectedProjects.size !== 1 ? 's' : ''}
              </span>
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
                      let currentCategoryId = edit?.categoryId ?? project.category?.id ?? ''
                      let currentOwnerId = edit?.ownerId ?? project.owner?.id ?? ''
                      
                      // Convert empty strings back to our display constants for the Select components
                      if (currentCategoryId === '' && edit?.categoryId === '') {
                        currentCategoryId = 'NO_CATEGORY'
                      }
                      if (currentOwnerId === '' && edit?.ownerId === '') {
                        currentOwnerId = 'NO_OWNER'
                      }

                      const isSelected = selectedProjects.has(project.id)
                      
                      return (
                        <TableRow 
                          key={project.id}
                          className={isSelected ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
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
                                <SelectContent className="bg-white dark:bg-white">
                                  <SelectItem value="NO_CATEGORY">No category</SelectItem>
                                  {safeCategories.map((cat) => (
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
                                <SelectContent className="bg-white dark:bg-white">
                                  <SelectItem value="NO_OWNER">No owner</SelectItem>
                                  {safePeople.map((person) => (
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Update Projects</DialogTitle>
            <DialogDescription>
              Apply changes to {selectedProjects.size} selected project(s). Only fields you change will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="bulk-category" className="text-sm font-medium">
                Project Category
              </Label>
              <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                <SelectTrigger id="bulk-category">
                  <SelectValue placeholder="Keep current categories" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-white">
                  <SelectItem value="KEEP_CURRENT_CATEGORY">
                    <span className="text-muted-foreground">Keep current categories</span>
                  </SelectItem>
                  <SelectItem value="UNASSIGN_CATEGORY">
                    <span className="text-orange-600">Remove category from all selected</span>
                  </SelectItem>
                  {safeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        {cat.color && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="bulk-owner" className="text-sm font-medium">
                Project Owner
              </Label>
              <Select value={bulkOwnerId} onValueChange={setBulkOwnerId}>
                <SelectTrigger id="bulk-owner">
                  <SelectValue placeholder="Keep current owners" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-white">
                  <SelectItem value="KEEP_CURRENT_OWNER">
                    <span className="text-muted-foreground">Keep current owners</span>
                  </SelectItem>
                  <SelectItem value="UNASSIGN_OWNER">
                    <span className="text-orange-600">Unassign all selected projects</span>
                  </SelectItem>
                  {safePeople.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                          {person.firstName[0]}{person.lastName[0]}
                        </div>
                        {person.firstName} {person.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={showBulkUpdateConfirmation} 
              disabled={bulkUpdateMutation.isPending || ((!bulkCategoryId || bulkCategoryId === 'KEEP_CURRENT_CATEGORY') && (!bulkOwnerId || bulkOwnerId === 'KEEP_CURRENT_OWNER'))}
            >
              {bulkUpdateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Update {selectedProjects.size} Project{selectedProjects.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Confirmation Dialog */}
      <AlertDialog open={confirmBulkDialog} onOpenChange={setConfirmBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Update</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update {selectedProjects.size} project{selectedProjects.size !== 1 ? 's' : ''}:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 space-y-1 text-sm">
            {bulkCategoryId === 'UNASSIGN_CATEGORY' && (
              <div className="text-orange-600">• Remove categories from all selected projects</div>
            )}
            {bulkCategoryId && bulkCategoryId !== 'KEEP_CURRENT_CATEGORY' && bulkCategoryId !== 'UNASSIGN_CATEGORY' && (
              <div className="text-blue-600">• Set category to "{safeCategories.find(c => c.id === bulkCategoryId)?.name || 'Unknown Category'}"</div>
            )}
            {bulkOwnerId === 'UNASSIGN_OWNER' && (
              <div className="text-orange-600">• Unassign owners from all selected projects</div>
            )}
            {bulkOwnerId && bulkOwnerId !== 'KEEP_CURRENT_OWNER' && bulkOwnerId !== 'UNASSIGN_OWNER' && (
              (() => {
                const owner = safePeople.find(p => p.id === bulkOwnerId);
                return (
                  <div className="text-blue-600">• Assign to "{owner?.firstName || 'Unknown'} {owner?.lastName || 'Person'}"</div>
                );
              })()
            )}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            This action cannot be undone.
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyBulkUpdate} disabled={bulkUpdateMutation.isPending}>
              {bulkUpdateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Update'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

