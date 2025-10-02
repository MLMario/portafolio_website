import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Eye } from 'lucide-react'
import { categoryLabels } from '@/config/site'

interface ProjectCardProps {
  project: {
    id: string
    title: string
    slug: string
    description: string
    thumbnail: string | null
    tags: string[]
    category: string
    viewCount: number
    createdAt: Date | string
  }
  onTagClick?: (tag: string) => void
  selectedTags?: string[]
}

export function ProjectCard({ project, onTagClick, selectedTags = [] }: ProjectCardProps) {
  return (
    <Card className="group flex flex-col transition-all hover:shadow-lg">
      {/* Thumbnail */}
      <Link href={`/projects/${project.slug}`} className="block">
        {project.thumbnail ? (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
            <img
              src={project.thumbnail}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="aspect-video w-full rounded-t-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary/20">{project.title[0]}</span>
          </div>
        )}
      </Link>

      <CardHeader>
        {/* Category Badge */}
        <Badge variant="outline" className="mb-2 w-fit">
          {categoryLabels[project.category as keyof typeof categoryLabels]}
        </Badge>

        {/* Title */}
        <CardTitle className="line-clamp-2 transition-colors group-hover:text-primary">
          <Link href={`/projects/${project.slug}`}>{project.title}</Link>
        </CardTitle>

        {/* Description */}
        <CardDescription className="line-clamp-3">{project.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map((tag) => {
            const isSelected = selectedTags.includes(tag)
            return (
              <Badge
                key={tag}
                variant={isSelected ? "default" : "secondary"}
                className={`text-xs ${onTagClick ? 'cursor-pointer transition-colors hover:bg-primary/90' : ''}`}
                onClick={(e) => {
                  if (onTagClick) {
                    e.preventDefault()
                    onTagClick(tag)
                  }
                }}
              >
                {tag}
              </Badge>
            )
          })}
          {project.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{project.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0">
        {/* View Count */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span>{project.viewCount}</span>
        </div>

        {/* View Button */}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/projects/${project.slug}`}>
            View
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
