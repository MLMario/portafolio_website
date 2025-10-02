// Image processing utilities for converting images to base64 for Claude

export interface ProcessedImage {
  base64: string
  mediaType: string
  size: number
}

// Load image from URL and convert to base64
export async function loadImageAsBase64(url: string): Promise<ProcessedImage> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    // Determine media type from response headers or URL extension
    const contentType = response.headers.get('content-type') || detectMediaType(url)

    return {
      base64,
      mediaType: contentType,
      size: arrayBuffer.byteLength,
    }
  } catch (error) {
    console.error(`Error loading image ${url}:`, error)
    throw error
  }
}

// Load multiple images in parallel
export async function loadImagesAsBase64(urls: string[]): Promise<ProcessedImage[]> {
  return Promise.all(urls.map((url) => loadImageAsBase64(url)))
}

// Detect media type from URL extension
function detectMediaType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase()

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }

  return mimeTypes[extension || ''] || 'image/jpeg'
}

// Convert File object to base64 (for uploads)
export async function fileToBase64(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] // Remove data:image/...;base64, prefix

      resolve({
        base64,
        mediaType: file.type,
        size: file.size,
      })
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Check if image is within size limits (Claude has 5MB limit per image)
export function isImageSizeValid(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return size <= maxSizeBytes
}

// Compress or resize image if needed (browser environment)
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          file.type,
          quality
        )
      }

      img.onerror = reject
      img.src = e.target?.result as string
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
