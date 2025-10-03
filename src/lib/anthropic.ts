import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Type for chat messages
export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Helper to create a chat completion with full context + vision
export async function createChatCompletion({
  projectTitle,
  markdownContent,
  images,
  chatHistory,
  userMessage,
}: {
  projectTitle: string
  markdownContent: string
  images: { base64: string; mediaType: string }[]
  chatHistory: ChatMessage[]
  userMessage: string
}) {
  // Build content array with cached markdown and images
  const content: Anthropic.MessageParam['content'] = [
    {
      type: 'text',
      text: `You are an AI assistant helping users understand a Data Science project.

Project: ${projectTitle}

Full Project Documentation:

${markdownContent}

You have access to all the charts and figures in this project. Reference them when explaining results, model performance, or data insights. Answer questions based solely on the provided documentation. If information isn't available, politely say so.`,
      cache_control: { type: 'ephemeral' }, // Cache for 5 minutes
    },
    // Add all images with caching
    ...images.map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.base64,
      },
      cache_control: { type: 'ephemeral' } as const,
    })),
  ]

  // Build messages array with chat history
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content,
    },
  ]

  // Add chat history
  chatHistory.forEach((msg) => {
    messages.push({
      role: msg.role,
      content: msg.content,
    })
  })

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  })

  // Create streaming response
  return anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages,
  })
}

// Helper to convert image buffer to base64
export function bufferToBase64(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return Buffer.from(binary, 'binary').toString('base64')
}
