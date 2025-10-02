// Markdown utilities for parsing and processing markdown files

// Extract image references from markdown content
export function extractImageReferences(markdown: string): string[] {
  const imageRegex = /!\[.*?\]\((.*?)\)/g
  const images: string[] = []
  let match

  while ((match = imageRegex.exec(markdown)) !== null) {
    images.push(match[1])
  }

  return images
}

// Convert relative image paths to Supabase Storage URLs
export function convertImagePaths(
  markdown: string,
  imageUrlMap: Record<string, string>
): string {
  let updatedMarkdown = markdown

  Object.entries(imageUrlMap).forEach(([originalPath, supabaseUrl]) => {
    const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${escapeRegex(originalPath)}\\)`, 'g')
    updatedMarkdown = updatedMarkdown.replace(regex, `![$1](${supabaseUrl})`)
  })

  return updatedMarkdown
}

// Escape special regex characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Extract table of contents from markdown headings
export interface TocItem {
  id: string
  level: number
  text: string
}

export function extractTableOfContents(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: TocItem[] = []
  let match

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = generateSlug(text)

    toc.push({ id, level, text })
  }

  return toc
}

// Estimate token count for markdown content (rough approximation)
// 1 token ≈ 4 characters on average
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

// Check if markdown content fits in context window
export function fitsInContextWindow(
  markdownContent: string,
  imageCount: number,
  maxTokens: number = 150000
): boolean {
  // Approximate: 1 image ≈ 1000 tokens
  const textTokens = estimateTokenCount(markdownContent)
  const imageTokens = imageCount * 1000
  const totalTokens = textTokens + imageTokens

  return totalTokens < maxTokens
}

// Extract code blocks from markdown
export function extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const codeBlocks: Array<{ language: string; code: string }> = []
  let match

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    })
  }

  return codeBlocks
}

// Strip markdown formatting to get plain text
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // Remove links but keep text
    .replace(/#{1,6}\s+/g, '') // Remove headings
    .replace(/\*\*|__/g, '') // Remove bold
    .replace(/\*|_/g, '') // Remove italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove code
    .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
    .trim()
}
