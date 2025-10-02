'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, X } from 'lucide-react'
import Link from 'next/link'
import { projectCategories, categoryLabels } from '@/config/site'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

interface EditProjectPageProps {
  params: Promise<{ id: string }>
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('other')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')

  // File upload state
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [markdownFile, setMarkdownFile] = useState<File | null>(null)
  const [images, setImages] = useState<File[]>([])

  useEffect(() => {
    params.then((p) => {
      setProjectId(p.id)
      fetchProject(p.id)
    })
  }, [])

  async function fetchProject(id: string) {
    try {
      const response = await fetch(`/api/admin/projects/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch project')
      }

      const project = data.project
      setTitle(project.title)
      setSlug(project.slug)
      setDescription(project.description)
      setCategory(project.category)
      setTags(project.tags || [])
      setIsPublished(project.isPublished)
      setMarkdownContent(project.markdownContent)
    } catch (err: any) {
      setError(err.message || 'Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  // Handle file uploads
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0])
    }
  }

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMarkdownFile(e.target.files[0])
    }
  }

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      if (!title.trim()) {
        throw new Error('Title is required')
      }
      if (!description.trim()) {
        throw new Error('Description is required')
      }

      // Check if we have file uploads
      const hasFileUploads = thumbnail || markdownFile || images.length > 0

      let response

      if (hasFileUploads) {
        // Use FormData for file uploads
        const formData = new FormData()
        formData.append('title', title.trim())
        formData.append('description', description.trim())
        formData.append('category', category)
        formData.append('tags', JSON.stringify(tags))
        formData.append('isPublished', String(isPublished))
        formData.append('markdownContent', markdownContent)

        if (thumbnail) {
          formData.append('thumbnail', thumbnail)
        }

        if (markdownFile) {
          formData.append('markdown', markdownFile)
        }

        images.forEach((image, index) => {
          formData.append(`image_${index}`, image)
        })

        response = await fetch(`/api/admin/projects/${projectId}`, {
          method: 'PATCH',
          body: formData,
        })
      } else {
        // Use JSON for text-only updates
        response = await fetch(`/api/admin/projects/${projectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            category,
            tags,
            isPublished,
            markdownContent,
          }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project')
      }

      router.push('/admin/projects')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update project')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Project</h1>
          <p className="text-muted-foreground">Update your project details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Update the basic details about your project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Cookie-Level vs User-Level Randomization"
                      required
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A comprehensive guide exploring the differences..."
                      rows={4}
                      required
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory} disabled={isSaving}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {projectCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {categoryLabels[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag()
                          }
                        }}
                        placeholder="Add a tag and press Enter"
                        disabled={isSaving}
                      />
                      <Button type="button" onClick={addTag} disabled={isSaving}>
                        Add
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="pl-2.5 pr-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1.5 hover:text-destructive"
                              disabled={isSaving}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>File Uploads</CardTitle>
                  <CardDescription>
                    Upload or replace files for this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="markdown-file">Markdown File</Label>
                    <Input
                      id="markdown-file"
                      type="file"
                      accept=".md,.markdown,.txt"
                      onChange={handleMarkdownChange}
                      disabled={isSaving}
                      className="cursor-pointer"
                    />
                    {markdownFile && (
                      <span className="text-sm text-muted-foreground">
                        {markdownFile.name}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-images">Project Images</Label>
                    <Input
                      id="project-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      disabled={isSaving}
                      className="cursor-pointer"
                    />
                    {images.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {images.length} image(s) selected
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail-image">Thumbnail Image</Label>
                    <Input
                      id="thumbnail-image"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      disabled={isSaving}
                      className="cursor-pointer"
                    />
                    {thumbnail && (
                      <span className="text-sm text-muted-foreground">
                        {thumbnail.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                  <CardDescription>
                    Edit the markdown content directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="markdown">Markdown Content *</Label>
                    <Textarea
                      id="markdown"
                      value={markdownContent}
                      onChange={(e) => setMarkdownContent(e.target.value)}
                      placeholder="# Project Title&#10;&#10;Your markdown content here..."
                      rows={20}
                      className="font-mono text-sm"
                      required
                      disabled={isSaving}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="published">Published</Label>
                      <p className="text-sm text-muted-foreground">
                        Make this project visible to the public
                      </p>
                    </div>
                    <Switch
                      id="published"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                      disabled={isSaving}
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" asChild disabled={!slug}>
                    <Link href={slug ? `/projects/${slug}` : '#'} target="_blank">
                      View Live
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}
