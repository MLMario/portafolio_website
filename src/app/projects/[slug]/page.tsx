import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Calendar, Eye } from 'lucide-react'
import { categoryLabels } from '@/config/site'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import { TableOfContents } from '@/components/markdown/TableOfContents'
import { ChatWidget } from '@/components/chat/ChatWidget'
import 'katex/dist/katex.min.css'

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
  })

  if (!project) {
    notFound()
  }

  // Increment view count
  await prisma.project.update({
    where: { id: project.id },
    data: { viewCount: { increment: 1 } },
  })

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(project.createdAt))

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Projects
            </Link>
          </Button>
        </div>
      </div>

      {/* Project Header */}
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

      {/* Main Content */}
      <div className="container py-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[250px_1fr]">
          {/* Sidebar with TOC - LEFT SIDE */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <TableOfContents content={project.markdownContent} />
            </div>
          </aside>

          {/* Markdown Content - RIGHT SIDE */}
          <article className="min-w-0">
            <MarkdownRenderer content={project.markdownContent} />
          </article>
        </div>
      </div>

      {/* AI Chat Widget */}
      <ChatWidget
        projectId={project.id}
        projectTitle={project.title}
        markdownContent={project.markdownContent}
        imageUrls={project.imageUrls}
      />
    </div>
  )
}
