import { Metadata } from 'next'
import { Suspense } from 'react'
import { ProjectsList } from '@/components/projects/ProjectsList'
import { ProjectsFilter } from '@/components/projects/ProjectsFilter'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Explore my data science projects, analyses, and technical implementations. Browse through portfolio of causal inference, forecasting, and analytics work.',
  openGraph: {
    title: 'Projects | Mario Garcia',
    description: 'Explore data science projects, analyses, and technical implementations',
    url: `${siteConfig.url}/projects`,
    type: 'website',
  },
  alternates: {
    canonical: `${siteConfig.url}/projects`,
  },
}

export default function ProjectsPage() {
  return (
    <div className="container py-12">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          All Projects
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Explore my portfolio of data science projects, analyses, tutorials, and software implementations
        </p>
      </div>

      <Suspense fallback={<ProjectsListSkeleton />}>
        <ProjectsFilter />
      </Suspense>
    </div>
  )
}

function ProjectsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
        <div className="flex gap-2">
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-video w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
