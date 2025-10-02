import { ProjectCard } from './ProjectCard'
import { prisma } from '@/lib/prisma'

export async function ProjectsList() {
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

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
        <h3 className="mb-2 text-xl font-semibold">No projects yet</h3>
        <p className="text-muted-foreground">
          Projects will appear here once added through the admin dashboard
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
