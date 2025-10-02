// Site-wide configuration

export const siteConfig = {
  name: 'Data Science Portfolio',
  description: 'Showcase of Data Science projects with interactive AI chat',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  author: {
    name: 'Your Name', // TODO: Update with your name
    email: 'your.email@example.com', // TODO: Update with your email
    github: 'https://github.com/yourusername', // TODO: Update with your GitHub
    linkedin: 'https://linkedin.com/in/yourprofile', // TODO: Update with your LinkedIn
  },
  links: {
    github: 'https://github.com/yourusername/portfolio',
    twitter: 'https://twitter.com/yourusername',
  },
}

// Project category enum - these are the only allowed values
export const projectCategories = [
  'article',
  'analysis',
  'tutorial',
  'software_implementation',
  'other',
] as const

export type ProjectCategory = (typeof projectCategories)[number]

// Human-readable labels for categories
export const categoryLabels: Record<ProjectCategory, string> = {
  article: 'Article',
  analysis: 'Analysis',
  tutorial: 'Tutorial',
  software_implementation: 'Software Implementation',
  other: 'Other',
}

// Pagination defaults
export const pagination = {
  defaultPageSize: 12,
  maxPageSize: 50,
}

// File upload limits
export const uploadLimits = {
  maxFileSize: 10 * 1024 * 1024, // 10MB for markdown files
  maxImageSize: 5 * 1024 * 1024, // 5MB per image
  maxImagesPerProject: 20,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedMarkdownTypes: ['text/markdown', 'text/plain'],
}

// AI Chat configuration
export const chatConfig = {
  maxMessagesInHistory: 10, // Keep last 10 messages for context
  maxTokensPerResponse: 4096,
  suggestedQuestions: [
    'What is the main objective of this project?',
    'What models were used and why?',
    'What were the key findings?',
    'How did the model perform?',
    'What data preprocessing was done?',
  ],
}
