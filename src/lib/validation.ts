// Validation utilities for form data and API requests

import { projectCategories, ProjectCategory } from '@/config/site'

/**
 * Check if a value is a valid project category
 */
export function isValidCategory(value: unknown): value is ProjectCategory {
  return (
    typeof value === 'string' &&
    projectCategories.includes(value as ProjectCategory)
  )
}

/**
 * Validate and sanitize a category value
 * @returns Valid category or default 'other'
 */
export function sanitizeCategory(value: unknown): ProjectCategory {
  if (isValidCategory(value)) {
    return value
  }
  return 'other'
}

/**
 * Validate project category, throwing error if invalid
 */
export function validateCategory(value: unknown): ProjectCategory {
  if (!isValidCategory(value)) {
    throw new Error(
      `Invalid category: "${value}". Must be one of: ${projectCategories.join(', ')}`
    )
  }
  return value
}

/**
 * Validate that tags is a non-empty array of strings
 */
export function validateTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    throw new Error('Tags must be an array')
  }

  if (tags.length === 0) {
    throw new Error('At least one tag is required')
  }

  if (!tags.every((tag) => typeof tag === 'string' && tag.trim().length > 0)) {
    throw new Error('All tags must be non-empty strings')
  }

  // Remove duplicates and trim
  return Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase())))
}

/**
 * Validate slug format (lowercase, alphanumeric with hyphens)
 */
export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}

/**
 * Sanitize and validate a project slug
 */
export function sanitizeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate Gamma presentation URL
 */
export function validateGammaUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false
  }

  // Basic check - can be more specific if needed
  return url.includes('gamma.app') || url.startsWith('http')
}
