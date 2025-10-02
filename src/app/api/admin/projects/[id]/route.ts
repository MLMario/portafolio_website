import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { storage, getSupabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper function to migrate project files when slug changes
async function migrateProjectFiles(
  oldSlug: string,
  newSlug: string,
  currentProject: any
) {
  const bucket = 'projects'
  const migratedUrls: any = {}

  try {
    // Check if old folder exists by trying to list files
    let files: any[] = []
    try {
      files = await storage.listFiles(bucket, `projects/${oldSlug}`)
    } catch (error) {
      // Folder doesn't exist, nothing to migrate
      return migratedUrls
    }

    if (files.length === 0) {
      return migratedUrls
    }

    // Migrate markdown file
    if (currentProject.markdownFileUrl) {
      const oldMarkdownPath = `projects/${oldSlug}/content.md`
      const newMarkdownPath = `projects/${newSlug}/content.md`
      try {
        await storage.copyFile(bucket, oldMarkdownPath, newMarkdownPath)
        migratedUrls.markdownFileUrl = storage.getPublicUrl(bucket, newMarkdownPath)
      } catch (error) {
        console.warn('No markdown file to migrate:', error)
      }
    }

    // Migrate thumbnail
    if (currentProject.thumbnail) {
      // Extract extension from current thumbnail URL
      const thumbnailMatch = currentProject.thumbnail.match(/thumbnail\.([^?]+)/)
      if (thumbnailMatch) {
        const ext = thumbnailMatch[1]
        const oldThumbnailPath = `projects/${oldSlug}/thumbnail.${ext}`
        const newThumbnailPath = `projects/${newSlug}/thumbnail.${ext}`
        try {
          await storage.copyFile(bucket, oldThumbnailPath, newThumbnailPath)
          migratedUrls.thumbnail = storage.getPublicUrl(bucket, newThumbnailPath)
        } catch (error) {
          console.warn('No thumbnail to migrate:', error)
        }
      }
    }

    // Migrate images folder
    if (currentProject.imageUrls && currentProject.imageUrls.length > 0) {
      try {
        const imageFiles = await storage.listFiles(bucket, `projects/${oldSlug}/images`)
        const newImageUrls: string[] = []

        for (const imageFile of imageFiles) {
          const oldImagePath = `projects/${oldSlug}/images/${imageFile.name}`
          const newImagePath = `projects/${newSlug}/images/${imageFile.name}`
          await storage.copyFile(bucket, oldImagePath, newImagePath)
          newImageUrls.push(storage.getPublicUrl(bucket, newImagePath))
        }

        if (newImageUrls.length > 0) {
          migratedUrls.imageUrls = newImageUrls
        }
      } catch (error) {
        console.warn('No images to migrate:', error)
      }
    }

    // Delete old folder after successful migration
    try {
      // Delete images subfolder first
      try {
        await storage.deleteFolder(bucket, `projects/${oldSlug}/images`)
      } catch (error) {
        // Images folder might not exist
      }

      // Delete main folder
      await storage.deleteFolder(bucket, `projects/${oldSlug}`)
      console.log(`Migrated and cleaned up folder: projects/${oldSlug} -> projects/${newSlug}`)
    } catch (error) {
      console.warn('Could not delete old folder:', error)
      // Non-critical, don't fail the migration
    }

    return migratedUrls
  } catch (error) {
    console.error('Error migrating project files:', error)
    throw new Error('Failed to migrate project files')
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    // Verify authentication
    await requireAuth()

    const supabaseAdmin = getSupabaseAdmin()

    const { data: project, error } = await supabaseAdmin
      .from('Project')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    // Verify authentication
    await requireAuth()

    const contentType = req.headers.get('content-type') || ''
    const isFormData = contentType.includes('multipart/form-data')

    let title, description, category, tags, isPublished, markdownContent
    let thumbnail: File | null = null
    let markdownFile: File | null = null
    let imageFiles: File[] = []

    const supabaseAdmin = getSupabaseAdmin()

    // Get current project with all file URLs and title for comparison
    const { data: currentProject } = await supabaseAdmin
      .from('Project')
      .select('slug, title, markdownFileUrl, thumbnail, imageUrls')
      .eq('id', id)
      .single()

    if (!currentProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (isFormData) {
      // Handle FormData (with file uploads)
      const formData = await req.formData()

      title = formData.get('title') as string
      description = formData.get('description') as string
      category = formData.get('category') as string
      const tagsJson = formData.get('tags') as string
      tags = JSON.parse(tagsJson || '[]')
      isPublished = formData.get('isPublished') === 'true'
      markdownContent = formData.get('markdownContent') as string

      thumbnail = formData.get('thumbnail') as File | null
      markdownFile = formData.get('markdown') as File | null

      // Collect image files
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('image_') && value instanceof File) {
          imageFiles.push(value)
        }
      }
    } else {
      // Handle JSON (text-only updates)
      const body = await req.json()
      title = body.title
      description = body.description
      category = body.category
      tags = body.tags
      isPublished = body.isPublished
      markdownContent = body.markdownContent
    }

    // Prepare update data
    let updateData: any = {
      description,
      category,
      tags,
      isPublished,
      markdownContent,
      updatedAt: new Date().toISOString(),
    }

    // Determine if title is changing (compare title to title, NOT title to slug!)
    let targetSlug = currentProject.slug
    let titleChanged = false

    if (title && title !== currentProject.title) {
      const newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check if new slug conflicts with another project
      const { data: existingProject } = await supabaseAdmin
        .from('Project')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', id)
        .single()

      if (existingProject) {
        return NextResponse.json(
          { error: 'A project with this title already exists' },
          { status: 400 }
        )
      }

      targetSlug = newSlug
      titleChanged = true
      updateData.title = title
      updateData.slug = newSlug
    }

    // Handle file uploads (always upload to targetSlug)
    if (markdownFile) {
      const markdownPath = `projects/${targetSlug}/content.md`
      await storage.uploadFile('projects', markdownPath, markdownFile)
      const markdownFileUrl = storage.getPublicUrl('projects', markdownPath)

      // Read new markdown content
      const newMarkdownContent = await markdownFile.text()
      updateData.markdownFileUrl = markdownFileUrl
      updateData.markdownContent = newMarkdownContent
    }

    if (thumbnail) {
      const thumbnailPath = `projects/${targetSlug}/thumbnail.${thumbnail.name.split('.').pop()}`
      await storage.uploadFile('projects', thumbnailPath, thumbnail)
      const thumbnailUrl = storage.getPublicUrl('projects', thumbnailPath)
      updateData.thumbnail = thumbnailUrl
    }

    if (imageFiles.length > 0) {
      const imageUrls: string[] = []
      for (let i = 0; i < imageFiles.length; i++) {
        const image = imageFiles[i]
        const imagePath = `projects/${targetSlug}/images/${Date.now()}-${i}-${image.name}`
        await storage.uploadFile('projects', imagePath, image)
        const imageUrl = storage.getPublicUrl('projects', imagePath)
        imageUrls.push(imageUrl)
      }
      // Append to existing imageUrls
      const { data: project } = await supabaseAdmin
        .from('Project')
        .select('imageUrls')
        .eq('id', id)
        .single()

      updateData.imageUrls = [...(project?.imageUrls || []), ...imageUrls]
    }

    // Handle title change: migrate existing files if no new files uploaded
    if (titleChanged && !markdownFile && !thumbnail && imageFiles.length === 0) {
      try {
        const migratedUrls = await migrateProjectFiles(
          currentProject.slug,
          targetSlug,
          currentProject
        )

        // Update URLs if files were migrated
        if (migratedUrls.markdownFileUrl) {
          updateData.markdownFileUrl = migratedUrls.markdownFileUrl
        }
        if (migratedUrls.thumbnail) {
          updateData.thumbnail = migratedUrls.thumbnail
        }
        if (migratedUrls.imageUrls) {
          updateData.imageUrls = migratedUrls.imageUrls
        }
      } catch (migrationError) {
        console.error('File migration failed:', migrationError)
        return NextResponse.json(
          { error: 'Failed to migrate project files to new title' },
          { status: 500 }
        )
      }
    }

    // Update publishedAt if publishing for the first time
    if (isPublished) {
      const { data: project } = await supabaseAdmin
        .from('Project')
        .select('publishedAt')
        .eq('id', id)
        .single()

      if (!project?.publishedAt) {
        updateData.publishedAt = new Date().toISOString()
      }
    } else {
      updateData.publishedAt = null
    }

    const { data: updatedProject, error } = await supabaseAdmin
      .from('Project')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    // Verify authentication
    await requireAuth()

    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('Project')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
