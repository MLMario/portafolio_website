import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { categoryLabels } from '@/config/site'

export async function FeaturedProjects() {
  // Fetch featured projects
  const projects = await prisma.project.findMany({
    where: {
      isPublished: true,
      isFeatured: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnail: true,
      tags: true,
      category: true,
      createdAt: true,
    },
  })

  if (projects.length === 0) {
    return (
      <section id="projects" className="container py-20">
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Featured Projects
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Explore my latest work in data science and analytics
            </p>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
            <h3 className="mb-2 text-xl font-semibold">No featured projects yet</h3>
            <p className="text-muted-foreground">
              Mark projects as featured in the admin dashboard to display them here
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="projects" className="container py-20">
      <div className="w-full max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Featured Projects
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Explore my latest work in data science and analytics
          </p>
        </div>

        {/* Projects Horizontal Scroll */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {projects.map((project) => (
              <Card key={project.id} className="flex min-w-[320px] max-w-[320px] flex-col transition-shadow hover:shadow-lg snap-start sm:min-w-[350px] sm:max-w-[350px]">
              {/* Thumbnail */}
              {project.thumbnail && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              )}

              <CardHeader>
                {/* Category Badge */}
                <Badge variant="outline" className="mb-2 w-fit">
                  {categoryLabels[project.category as keyof typeof categoryLabels]}
                </Badge>

                {/* Title */}
                <CardTitle className="line-clamp-2">{project.title}</CardTitle>

                {/* Description */}
                <CardDescription className="line-clamp-3">
                  {project.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {project.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href={`/projects/${project.slug}`}>
                    View Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* View All Projects CTA */}
        <div className="mt-12 text-center">
          <Button size="lg" variant="outline" asChild>
            <Link href="/projects">
              View All Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
