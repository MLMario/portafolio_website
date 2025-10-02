import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { isFeatured } = await req.json()

    const project = await prisma.project.update({
      where: { id },
      data: { isFeatured },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error toggling featured status:', error)
    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500 }
    )
  }
}
