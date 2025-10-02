import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ArrowRight, FileText, Calendar, Eye, Share2 } from 'lucide-react'
import { categoryLabels } from '@/config/site'

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { title: true, description: true },
  })

  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: project.title,
    description: project.description,
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params

  const project = await prisma.project.findUnique({
    where: { slug, isPublished: true },
    include: {
      _count: {
        select: { chatSessions: true },
      },
    },
  })

  if (!project) {
    notFound()
  }

  // Increment view count
  await prisma.project.update({
    where: { id: project.id },
    data: { viewCount: { increment: 1 } },
  })

  // Get previous and next projects
  const [previousProject, nextProject] = await Promise.all([
    prisma.project.findFirst({
      where: {
        isPublished: true,
        createdAt: { lt: project.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      select: { slug: true, title: true },
    }),
    prisma.project.findFirst({
      where: {
        isPublished: true,
        createdAt: { gt: project.createdAt },
      },
      orderBy: { createdAt: 'asc' },
      select: { slug: true, title: true },
    }),
  ])

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(project.createdAt))

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Projects
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/projects/${project.slug}/details`}>
                <FileText className="mr-2 h-4 w-4" />
                Detailed Analysis
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="border-b bg-muted/30 py-8">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Badge variant="outline" className="mb-4">
              {categoryLabels[project.category as keyof typeof categoryLabels]}
            </Badge>

            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {project.title}
            </h1>

            <p className="mb-6 text-lg text-muted-foreground">
              {project.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{project.viewCount} views</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gamma Presentation */}
      <div className="container py-8">
        <div className="mx-auto max-w-6xl">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted">
            <iframe
              src={project.gammaUrl}
              allow="fullscreen"
              allowFullScreen
              className="h-full w-full"
              title={`${project.title} Presentation`}
            />
          </div>

          <div className="mt-6 flex items-center justify-center">
            <Button size="lg" asChild>
              <Link href={`/projects/${project.slug}/details`}>
                View Detailed Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t bg-muted/30 py-8">
        <div className="container">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex-1">
              {previousProject ? (
                <Link
                  href={`/projects/${previousProject.slug}`}
                  className="group flex items-start gap-3 transition-colors hover:text-primary"
                >
                  <ArrowLeft className="mt-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Previous</p>
                    <p className="font-medium">{previousProject.title}</p>
                  </div>
                </Link>
              ) : (
                <div />
              )}
            </div>

            <div className="flex-1 text-right">
              {nextProject ? (
                <Link
                  href={`/projects/${nextProject.slug}`}
                  className="group inline-flex items-start gap-3 transition-colors hover:text-primary"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">Next</p>
                    <p className="font-medium">{nextProject.title}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
