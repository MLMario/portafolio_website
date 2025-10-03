import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import { requireAuth } from '@/lib/auth-server'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    await requireAuth()

    const { id } = await context.params
    const { isFeatured } = await req.json()

    // Validate isFeatured is a boolean
    if (typeof isFeatured !== 'boolean') {
      return NextResponse.json(
        { error: 'isFeatured must be a boolean' },
        { status: 400 }
      )
    }

    const project = await prisma.project.update({
      where: { id },
      data: { isFeatured },
    })

    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error toggling featured status:', error)

    // Handle validation errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Handle Prisma not found error
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500 }
    )
  }
}
