import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    // Verify authentication
    await requireAuth()

    const project = await prisma.project.findUnique({
      where: { id },
    })

    if (!project) {
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

    const body = await req.json()
    const { title, description, category, tags, isPublished, markdownContent } = body

    // If title is being changed, generate new slug
    let updateData: any = {
      description,
      category,
      tags,
      isPublished,
      markdownContent,
    }

    if (title) {
      const newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check if new slug conflicts with another project
      const existingProject = await prisma.project.findFirst({
        where: {
          slug: newSlug,
          NOT: { id },
        },
      })

      if (existingProject) {
        return NextResponse.json(
          { error: 'A project with this title already exists' },
          { status: 400 }
        )
      }

      updateData.title = title
      updateData.slug = newSlug
    }

    // Update publishedAt if publishing for the first time
    if (isPublished) {
      const project = await prisma.project.findUnique({
        where: { id },
        select: { publishedAt: true },
      })

      if (!project?.publishedAt) {
        updateData.publishedAt = new Date()
      }
    } else {
      updateData.publishedAt = null
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    })

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

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
