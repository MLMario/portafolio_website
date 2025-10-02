// Shared TypeScript types for the application

import { Project, User, ChatSession } from '@/generated/prisma'
import { ProjectCategory } from '@/config/site'

// Re-export Prisma types
export type { Project, User, ChatSession }

// Re-export category type for convenience
export type { ProjectCategory }

// Project with related data
export type ProjectWithSessions = Project & {
  chatSessions: ChatSession[]
}

// Simplified project type for list views
export type ProjectListItem = Pick<
  Project,
  'id' | 'title' | 'slug' | 'description' | 'thumbnail' | 'tags' | 'category' | 'createdAt' | 'viewCount'
>

// Form data for creating/editing projects
export type ProjectFormData = {
  title: string
  description: string
  tags: string[]
  category: ProjectCategory // Required, must be one of the valid categories
  thumbnail?: File
  gammaUrl: string
  markdownFile?: File
  images?: File[]
}

// Chat message type
export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Chat session with messages
export type ChatSessionWithMessages = ChatSession & {
  messages: ChatMessage[]
}

// API response types
export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

// Pagination types
export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter/Sort options for project list
export type ProjectFilters = {
  search?: string
  tags?: string[]
  category?: ProjectCategory // Filter by specific category
  sortBy?: 'date' | 'views' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// Supabase storage paths
export type StorageBucket = 'projects' | 'images' | 'thumbnails'

export type UploadedFile = {
  path: string
  url: string
  bucket: StorageBucket
}
