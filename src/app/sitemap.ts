import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { siteConfig } from '@/config/site'

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic'
// Cache the sitemap for 1 hour
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all published projects
  let projects: { slug: string; updatedAt: Date }[] = []

  try {
    projects = await prisma.project.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        updatedAt: true,
      },
    })
  } catch (error) {
    console.error('Failed to fetch projects for sitemap:', error)
    // Return empty array if database is unavailable - graceful degradation
    projects = []
  }

  // Static routes
  const routes = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 1.0,
    },
    {
      url: `${siteConfig.url}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
  ]

  // Project routes
  const projectRoutes = projects.map((project) => ({
    url: `${siteConfig.url}/projects/${project.slug}`,
    lastModified: project.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...routes, ...projectRoutes]
}
