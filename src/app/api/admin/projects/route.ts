import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { storage, getSupabaseAdmin } from '@/lib/supabase'
import { createId } from '@paralleldrive/cuid2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    // Verify authentication
    await requireAuth()

    const supabaseAdmin = getSupabaseAdmin()

    const { data: projects, error } = await supabaseAdmin
      .from('Project')
      .select('id, title, slug, category, isPublished, isFeatured, viewCount, createdAt')
      .order('createdAt', { ascending: false })

    if (error) throw error

    return NextResponse.json({ projects })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    await requireAuth()

    const formData = await req.formData()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const tagsJson = formData.get('tags') as string

    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!description || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    if (!category || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    let tags: string[] = []
    try {
      tags = JSON.parse(tagsJson || '[]')
    } catch {
      return NextResponse.json(
        { error: 'Invalid tags format' },
        { status: 400 }
      )
    }

    const thumbnail = formData.get('thumbnail') as File | null
    const markdownFile = formData.get('markdown') as File

    if (!markdownFile) {
      return NextResponse.json(
        { error: 'Markdown file is required' },
        { status: 400 }
      )
    }

    const imageFiles: File[] = []

    // Collect image files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        imageFiles.push(value)
      }
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const supabaseAdmin = getSupabaseAdmin()

    // Check if slug already exists
    const { data: existingProject } = await supabaseAdmin
      .from('Project')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this title already exists' },
        { status: 400 }
      )
    }

    // Read markdown content
    const markdownContent = await markdownFile.text()

    // Upload markdown file to Supabase Storage
    const markdownPath = `projects/${slug}/content.md`
    await storage.uploadFile('projects', markdownPath, markdownFile)
    const markdownFileUrl = storage.getPublicUrl('projects', markdownPath)

    // Upload thumbnail if provided
    let thumbnailUrl: string | null = null
    if (thumbnail) {
      const thumbnailPath = `projects/${slug}/thumbnail.${thumbnail.name.split('.').pop()}`
      await storage.uploadFile('projects', thumbnailPath, thumbnail)
      thumbnailUrl = storage.getPublicUrl('projects', thumbnailPath)
    }

    // Upload images
    const imageUrls: string[] = []
    for (let i = 0; i < imageFiles.length; i++) {
      const image = imageFiles[i]
      const imagePath = `projects/${slug}/${image.name}`
      await storage.uploadFile('projects', imagePath, image)
      const imageUrl = storage.getPublicUrl('projects', imagePath)
      imageUrls.push(imageUrl)
    }

    // Create project in database using Supabase admin client (bypasses RLS)
    const now = new Date().toISOString()
    const { data: project, error } = await supabaseAdmin
      .from('Project')
      .insert({
        id: createId(), // Manually generate ID since Supabase doesn't use Prisma defaults
        title,
        slug,
        description,
        category,
        tags,
        thumbnail: thumbnailUrl,
        markdownFileUrl,
        markdownContent,
        imageUrls,
        isPublished: false, // Always create as draft
        createdAt: now, // Manually set timestamp since Supabase doesn't use Prisma defaults
        updatedAt: now, // Manually set timestamp since Supabase doesn't use Prisma defaults
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error creating project:', error)

    // Handle storage errors
    if (error instanceof Error && error.message.includes('storage')) {
      return NextResponse.json(
        { error: 'File upload failed' },
        { status: 500 }
      )
    }

    // Handle database errors from Supabase
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code?: string; message?: string }
      if (dbError.code === '23505') {
        return NextResponse.json(
          { error: 'Project with this slug already exists' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    )
  }
}
