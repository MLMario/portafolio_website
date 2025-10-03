import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import { logger, createTimer } from '@/lib/logger'

export async function GET() {
  const timer = createTimer()
  logger.apiRequest('GET', '/api/projects')

  try {
    const projects = await prisma.project.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        tags: true,
        category: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    logger.apiResponse('GET', '/api/projects', 200, timer.end(), { count: projects.length })
    return NextResponse.json({ projects })
  } catch (error) {
    const duration = timer.end()
    logger.error('Error fetching projects', error, { durationMs: duration })

    // Handle database connection errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logger.apiResponse('GET', '/api/projects', 503, duration, { reason: 'db_connection_failed' })
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    // Handle database query errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.apiResponse('GET', '/api/projects', 500, duration, { reason: 'db_query_failed' })
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      )
    }

    // Generic error
    logger.apiResponse('GET', '/api/projects', 500, duration)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
