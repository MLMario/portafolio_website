import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import { storage } from '@/lib/supabase'

export async function GET() {
  try {
    // Verify authentication
    await requireAuth()

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        isPublished: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

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
    const tags = JSON.parse(tagsJson || '[]')

    const thumbnail = formData.get('thumbnail') as File | null
    const markdownFile = formData.get('markdown') as File
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

    // Check if slug already exists
    const existingProject = await prisma.project.findUnique({
      where: { slug },
    })

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
      const imagePath = `projects/${slug}/images/${i}-${image.name}`
      await storage.uploadFile('projects', imagePath, image)
      const imageUrl = storage.getPublicUrl('projects', imagePath)
      imageUrls.push(imageUrl)
    }

    // Create project in database
    const project = await prisma.project.create({
      data: {
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
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    )
  }
}
