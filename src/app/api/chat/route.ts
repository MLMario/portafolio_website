import { NextRequest } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { MessageParam } from '@anthropic-ai/sdk/resources'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequestBody {
  projectId: string
  projectTitle: string
  markdownContent: string
  imageUrls: string[]
  messages: ChatMessage[]
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json()
    const { projectTitle, markdownContent, imageUrls, messages } = body

    // Convert images to base64 if needed (for vision support)
    const imageContent = await Promise.all(
      imageUrls.slice(0, 5).map(async (url) => {
        try {
          // If it's a Supabase URL or external URL, fetch and convert to base64
          const response = await fetch(url)
          const buffer = await response.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          const contentType = response.headers.get('content-type') || 'image/png'

          return {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64,
            },
          }
        } catch (error) {
          console.error('Error fetching image:', url, error)
          return null
        }
      })
    )

    const validImages = imageContent.filter((img): img is NonNullable<typeof img> => img !== null)

    // Build system message with project context (text only - images in first user message)
    const systemMessage = `You are an AI assistant helping users understand a data science project titled "${projectTitle}".

Here is the full project documentation in markdown format:

${markdownContent}

The project includes ${validImages.length} visualization(s) and charts that support the analysis.

Your role is to:
- Answer questions about the project's methodology, findings, and implementation
- Explain charts, figures, and visualizations when asked (you can see the actual images provided to you)
- Provide insights into the data analysis techniques used
- Help users understand complex concepts in simple terms
- Reference specific sections of the documentation when relevant

Answer in less than 300 words unless user is asking for a detailed explanation or implying that it needs more information. If you're not sure about something, say so.`

    // Add images to the first user message for vision support
    const firstMessage = messages[0]
    const anthropicMessages: MessageParam[] = []

    if (firstMessage && validImages.length > 0) {
      // First message with images and text
      anthropicMessages.push({
        role: 'user',
        content: [
          ...validImages.map((img) => ({
            type: 'image' as const,
            source: img.source,
          })),
          {
            type: 'text' as const,
            text: firstMessage.content,
          },
        ],
      })

      // Add remaining messages
      messages.slice(1).forEach((msg) => {
        anthropicMessages.push({
          role: msg.role,
          content: msg.content,
        })
      })
    } else {
      // No images, convert messages normally
      messages.forEach((msg) => {
        anthropicMessages.push({
          role: msg.role,
          content: msg.content,
        })
      })
    }

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemMessage,
      messages: anthropicMessages,
    })

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            const data = JSON.stringify(event)
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
