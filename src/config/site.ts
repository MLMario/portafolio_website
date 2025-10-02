// Site-wide configuration

export const siteConfig = {
  name: 'Mario Garcia - Data Scientist',
  description: 'Data Science Portfolio - Advanced Analytics, Causal Inference, and Strategic Insights',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  author: {
    name: 'Mario Garcia',
    title: 'Data Scientist',
    bio: 'Data Scientist with a long track record of influencing executive-level strategy by applying advanced analytics to complex digital marketplace challenges. Proven ability to merge strategic business acumen with deep technical expertise in causal inference, experimentation, and forecasting, consistently delivering data-driven insights that enhance efficiency.',
    email: 'mariogj1987@gmail.com',
    github: 'https://github.com/MLMario',
    linkedin: 'https://www.linkedin.com/in/magj87/',
  },
  links: {
    github: 'https://github.com/MLMario',
    linkedin: 'https://www.linkedin.com/in/magj87/',
    email: 'mailto:mariogj1987@gmail.com',
  },
}

// Skills and expertise areas
export const skills = {
  'Data Science & Modeling': [
    'Python',
    'R',
    'SQL',
    'Predictive Modeling',
    'Forecasting',
    'Causal Inference',
    'Pricing & Optimization',
  ],
  'Methodologies & Frameworks': [
    'Causal Analysis',
    'A/B Testing',
    'Switchback Experiments',
    'Difference-in-Differences',
    'Budget Optimization',
  ],
  'Leadership & Strategy': [
    'Cross-Functional Leadership',
    'Product Strategy',
    'Roadmapping',
    'Executive Reporting',
    'Dashboard Development',
  ],
} as const

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
