'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { List } from 'lucide-react'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract ONLY H1 and H2 headings from markdown (# and ##)
    // But exclude code blocks (anything between ``` markers)

    // First, remove all code blocks
    const codeBlockRegex = /```[\s\S]*?```/g
    const contentWithoutCodeBlocks = content.replace(codeBlockRegex, '')

    // Now extract headings from the cleaned content
    const headingRegex = /^(#{1,2})\s+(.+)$/gm
    const matches = Array.from(contentWithoutCodeBlocks.matchAll(headingRegex))

    const extractedHeadings: Heading[] = matches.map((match, index) => {
      const level = match[1].length
      const text = match[2].trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      return { id, text, level }
    })

    setHeadings(extractedHeadings)
  }, [content])

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean)

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i]
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top < 150) {
            setActiveId(element.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  if (headings.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <List className="h-4 w-4" />
          Table of Contents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`block rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
              activeId === heading.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'
            }`}
            style={{
              paddingLeft: `${(heading.level - 1) * 0.75 + 0.5}rem`,
            }}
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById(heading.id)
              if (element) {
                const top = element.getBoundingClientRect().top + window.pageYOffset - 100
                window.scrollTo({ top, behavior: 'smooth' })
              }
            }}
          >
            {heading.text}
          </a>
        ))}
      </CardContent>
    </Card>
  )
}
