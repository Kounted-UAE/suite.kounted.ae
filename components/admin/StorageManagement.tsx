'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/react-ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/react-ui/card'
import { Input } from '@/components/react-ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/react-ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/react-ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { 
  HardDrive, 
  Upload, 
  Download, 
  Trash2, 
  Folder, 
  File, 
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Search,
  Link as LinkIcon
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/react-ui/select'
import { cn } from '@/lib/utils'

interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, any>
}

interface StorageBucket {
  id: string
  name: string
  public: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
}

export default function StorageManagement() {
  const [buckets, setBuckets] = useState<StorageBucket[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [files, setFiles] = useState<StorageFile[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [currentPath, setCurrentPath] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<{ path: string; name: string } | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseClient> | null>(null)

  // Initialize Supabase client only in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(getSupabaseClient())
    }
  }, [])

  // Load buckets
  const loadBuckets = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/storage/buckets')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load buckets')
      }

      const { buckets: bucketsData } = await response.json()
      setBuckets(bucketsData || [])
      if (bucketsData && bucketsData.length > 0 && !selectedBucket) {
        setSelectedBucket(bucketsData[0].name)
      }
    } catch (error) {
      toast({
        title: 'Error loading buckets',
        description: error instanceof Error ? error.message : 'Failed to load buckets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [selectedBucket])

  // Load files from selected bucket
  const loadFiles = useCallback(async (bucketName: string, path: string = '') => {
    if (!bucketName) return

    try {
      setLoading(true)
      
      // Use API route to bypass RLS policies
      const params = new URLSearchParams({
        bucketName,
        ...(path && { path }),
      })
      
      const response = await fetch(`/api/admin/storage/files?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load files')
      }

      const { files: data } = await response.json()

      // Separate files and folders
      const fileList: StorageFile[] = []
      const folderList: string[] = []

      ;(data || []).forEach((item: any) => {
        if (item.id === null) {
          // It's a folder
          folderList.push(item.name)
        } else {
          // It's a file
          fileList.push(item as StorageFile)
        }
      })

      setFiles(fileList)
      setFolders(folderList)
    } catch (error) {
      toast({
        title: 'Error loading files',
        description: error instanceof Error ? error.message : 'Failed to load files',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBuckets()
  }, [loadBuckets])

  useEffect(() => {
    if (selectedBucket) {
      loadFiles(selectedBucket, currentPath)
    }
  }, [selectedBucket, currentPath, loadFiles])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !selectedBucket) return

    try {
      setUploading(true)
      const uploadPromises = Array.from(files).map(async (file) => {
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucketName', selectedBucket)
        formData.append('filePath', filePath)

        const response = await fetch('/api/admin/storage/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to upload ${file.name}`)
        }

        return { file: file.name, success: true }
      })

      const results = await Promise.allSettled(uploadPromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (failed > 0) {
        toast({
          title: 'Upload completed with errors',
          description: `${successful} file(s) uploaded successfully, ${failed} failed`,
          variant: failed === files.length ? 'destructive' : 'default',
        })
      } else {
        toast({
          title: 'Upload successful',
          description: `${successful} file(s) uploaded successfully`,
        })
      }

      // Reload files
      await loadFiles(selectedBucket, currentPath)
      
      // Reset input
      event.target.value = ''
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (fileName: string) => {
    if (!selectedBucket || !supabase) return

    try {
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName
      const { data, error } = await supabase.storage
        .from(selectedBucket)
        .download(filePath)

      if (error) {
        toast({
          title: 'Download failed',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      // Create a blob URL and trigger download
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Download started',
        description: `Downloading "${fileName}"`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: 'destructive',
      })
    }
  }

  const handleOpenUrl = async (fileName: string) => {
    if (!selectedBucket) return

    try {
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName
      
      const params = new URLSearchParams({
        bucketName: selectedBucket,
        filePath,
      })
      
      const response = await fetch(`/api/admin/storage/url?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get file URL')
      }

      const { url } = await response.json()
      
      // Open in new tab
      window.open(url, '_blank', 'noopener,noreferrer')
      
      // Also copy to clipboard for sharing
      await navigator.clipboard.writeText(url)
      
      toast({
        title: 'Link opened',
        description: 'File opened in new tab. URL copied to clipboard.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open file URL',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedBucket || !fileToDelete || !supabase) return

    try {
      const filePath = currentPath ? `${currentPath}/${fileToDelete.name}` : fileToDelete.name
      const { error } = await supabase.storage
        .from(selectedBucket)
        .remove([filePath])

      if (error) {
        toast({
          title: 'Delete failed',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'File deleted',
        description: `"${fileToDelete.name}" has been deleted`,
      })

      // Reload files
      await loadFiles(selectedBucket, currentPath)
      setDeleteDialogOpen(false)
      setFileToDelete(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      })
    }
  }

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName
    setCurrentPath(newPath)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Filter files based on search query
  const filteredFiles = files.filter((file) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return file.name.toLowerCase().includes(query)
  })

  const filteredFolders = folders.filter((folder) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return folder.toLowerCase().includes(query)
  })

  return (
    <div className="space-y-6 relative">
      {/* Uploading Overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center gap-4 min-w-[200px]">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-zinc-700">Uploading...</p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Management
          </CardTitle>
          <CardDescription>
            Manage files in your Supabase storage buckets. Upload, download, and delete files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls - Search, Bucket Selection, Refresh */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={!selectedBucket}
              />
            </div>
            <Select 
              value={selectedBucket || ''} 
              onValueChange={(value) => {
                setSelectedBucket(value)
                setCurrentPath('')
                setSearchQuery('')
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select bucket..." />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-white">
                {buckets.map((bucket) => (
                  <SelectItem key={bucket.id} value={bucket.name}>
                    {bucket.name} {bucket.public ? '(Public)' : '(Private)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (selectedBucket) {
                  loadFiles(selectedBucket, currentPath)
                } else {
                  loadBuckets()
                }
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Breadcrumb Navigation */}
          {selectedBucket && currentPath && (
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setCurrentPath('')}
                className="text-zinc-600 hover:text-zinc-900"
              >
                {selectedBucket}
              </button>
              {currentPath.split('/').map((part, index, arr) => {
                const pathToHere = arr.slice(0, index + 1).join('/')
                return (
                  <div key={index} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                    {index === arr.length - 1 ? (
                      <span className="font-medium">{part}</span>
                    ) : (
                      <button
                        onClick={() => setCurrentPath(pathToHere)}
                        className="text-zinc-600 hover:text-zinc-900"
                      >
                        {part}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Upload Section */}
          {selectedBucket && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Files</label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading || !selectedBucket}
                  className="flex-1"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !selectedBucket}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          )}


          {/* Files and Folders Table */}
          {selectedBucket && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && files.length === 0 && folders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-zinc-400">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-zinc-400">
                        {searchQuery ? 'No files or folders match your search' : 'No files or folders found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {/* Folders */}
                      {filteredFolders.map((folder) => (
                        <TableRow key={folder}>
                          <TableCell>
                            <Folder className="h-4 w-4 text-blue-500" />
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => navigateToFolder(folder)}
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                            >
                              {folder}
                            </button>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                      ))}
                      {/* Files */}
                      {filteredFiles.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <File className="h-4 w-4 text-zinc-500" />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{file.name}</TableCell>
                          <TableCell>
                            {file.metadata?.size ? formatFileSize(file.metadata.size) : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500">
                            {formatDate(file.updated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenUrl(file.name)}
                                className="h-8 w-8 p-0"
                                title="Open file in new tab (URL copied to clipboard)"
                              >
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(file.name)}
                                className="h-8 w-8 p-0"
                                title="Download file"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setFileToDelete({ path: currentPath, name: file.name })
                                  setDeleteDialogOpen(true)
                                }}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Delete file"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

