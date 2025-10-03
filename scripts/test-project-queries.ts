/**
 * Comprehensive test script for prisma.project.findMany() queries
 * Tests all scenarios used in the application
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { prisma } from '../src/lib/prisma'

async function testProjectQueries() {
  console.log('🧪 Testing Prisma Project Queries\n')
  console.log('='.repeat(60))
  
  try {
    // Connect to database
    await prisma.$connect()
    console.log('✅ Database connected\n')

    // Test 1: Featured Projects (used in homepage)
    console.log('📌 Test 1: Featured Projects Query')
    console.log('-'.repeat(60))
    const featuredStart = Date.now()
    const featuredProjects = await prisma.project.findMany({
      where: {
        isPublished: true,
        isFeatured: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        tags: true,
        category: true,
        createdAt: true,
      },
    })
    const featuredTime = Date.now() - featuredStart
    console.log(`✅ Found ${featuredProjects.length} featured project(s) in ${featuredTime}ms`)
    featuredProjects.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title}`)
      console.log(`      - slug: ${p.slug}`)
      console.log(`      - category: ${p.category}`)
      console.log(`      - tags: ${p.tags.join(', ')}`)
    })
    console.log()

    // Test 2: All Published Projects
    console.log('📌 Test 2: All Published Projects')
    console.log('-'.repeat(60))
    const publishedStart = Date.now()
    const publishedProjects = await prisma.project.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        isPublished: true,
        isFeatured: true,
      },
    })
    const publishedTime = Date.now() - publishedStart
    console.log(`✅ Found ${publishedProjects.length} published project(s) in ${publishedTime}ms`)
    publishedProjects.forEach((p, i) => {
      const badges = []
      if (p.isFeatured) badges.push('⭐ Featured')
      if (p.isPublished) badges.push('📢 Published')
      console.log(`   ${i + 1}. ${p.title} ${badges.join(' ')}`)
    })
    console.log()

    // Test 3: Single Project by Slug
    if (publishedProjects.length > 0) {
      const testSlug = publishedProjects[0].slug
      console.log('📌 Test 3: Single Project by Slug')
      console.log('-'.repeat(60))
      const singleStart = Date.now()
      const singleProject = await prisma.project.findUnique({
        where: { slug: testSlug },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          markdownContent: true,
          imageUrls: true,
          category: true,
          tags: true,
          viewCount: true,
        },
      })
      const singleTime = Date.now() - singleStart
      if (singleProject) {
        console.log(`✅ Found project by slug "${testSlug}" in ${singleTime}ms`)
        console.log(`   - Title: ${singleProject.title}`)
        console.log(`   - Images: ${singleProject.imageUrls.length}`)
        console.log(`   - Markdown length: ${singleProject.markdownContent.length} chars`)
        console.log(`   - View count: ${singleProject.viewCount}`)
      } else {
        console.log(`❌ Project not found by slug "${testSlug}"`)
      }
      console.log()
    }

    // Test 4: Project Count by Category
    console.log('📌 Test 4: Projects by Category')
    console.log('-'.repeat(60))
    const categories = ['article', 'analysis', 'tutorial', 'software_implementation', 'other']
    for (const category of categories) {
      const count = await prisma.project.count({
        where: {
          isPublished: true,
          category: category,
        },
      })
      if (count > 0) {
        console.log(`   ${category}: ${count} project(s)`)
      }
    }
    console.log()

    // Test 5: Empty Result (unpublished featured)
    console.log('📌 Test 5: Edge Case - Unpublished Featured Projects')
    console.log('-'.repeat(60))
    const unpublishedFeatured = await prisma.project.findMany({
      where: {
        isPublished: false,
        isFeatured: true,
      },
    })
    console.log(`✅ Found ${unpublishedFeatured.length} unpublished featured project(s)`)
    console.log()

    // Test 6: Total Database Stats
    console.log('📌 Test 6: Database Statistics')
    console.log('-'.repeat(60))
    const totalProjects = await prisma.project.count()
    const publishedCount = await prisma.project.count({ where: { isPublished: true } })
    const featuredCount = await prisma.project.count({ where: { isFeatured: true } })
    const unpublishedCount = await prisma.project.count({ where: { isPublished: false } })
    
    console.log(`   Total projects: ${totalProjects}`)
    console.log(`   Published: ${publishedCount}`)
    console.log(`   Featured: ${featuredCount}`)
    console.log(`   Unpublished: ${unpublishedCount}`)
    console.log()

    // Summary
    console.log('='.repeat(60))
    console.log('✅ All tests completed successfully!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Test failed:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('Database disconnected')
  }
}

testProjectQueries()
