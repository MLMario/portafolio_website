import { config } from 'dotenv'
config({ path: '.env.local' })

import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

async function addTestProject() {
  const markdownFilePath = process.argv[2]

  if (!markdownFilePath) {
    console.error('Usage: npx tsx scripts/add-test-project.ts <path-to-markdown-file>')
    console.error('Example: npx tsx scripts/add-test-project.ts ./my-project.md')
    process.exit(1)
  }

  try {
    // Read markdown file
    const markdownContent = fs.readFileSync(markdownFilePath, 'utf-8')

    // Extract images from markdown (simple regex for ![alt](url) pattern)
    const imageRegex = /!\[.*?\]\((.*?)\)/g
    const imageUrls: string[] = []
    let match

    while ((match = imageRegex.exec(markdownContent)) !== null) {
      imageUrls.push(match[1])
    }

    console.log('📄 Markdown file loaded')
    console.log('📸 Found', imageUrls.length, 'images in markdown')

    // Create project
    const project = await prisma.project.create({
      data: {
        title: 'Test Project - Sample Analysis',
        slug: 'test-project-sample-analysis',
        description: 'This is a test project to demonstrate the portfolio functionality with markdown rendering, charts, and AI chat capabilities.',
        category: 'analysis',
        tags: ['Python', 'Data Analysis', 'Machine Learning', 'Visualization'],
        thumbnail: null, // You can add a thumbnail URL if you have one
        gammaUrl: 'https://gamma.app/embed/example', // Replace with actual Gamma URL
        markdownFileUrl: '', // We're storing content directly
        markdownContent: markdownContent,
        imageUrls: imageUrls,
        isPublished: true,
        publishedAt: new Date(),
      },
    })

    console.log('✅ Test project created successfully!')
    console.log('\nProject Details:')
    console.log('- ID:', project.id)
    console.log('- Title:', project.title)
    console.log('- Slug:', project.slug)
    console.log('- Images:', imageUrls.length)
    console.log('\nView at:')
    console.log('- Summary: http://localhost:3001/projects/' + project.slug)
    console.log('- Details: http://localhost:3001/projects/' + project.slug + '/details')
    console.log('- Admin: http://localhost:3001/admin/projects')
  } catch (error) {
    console.error('❌ Error creating test project:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addTestProject()
