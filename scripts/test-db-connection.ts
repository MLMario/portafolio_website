import { config } from 'dotenv'
config({ path: '.env.local' })

import { prisma } from '../src/lib/prisma'

async function testConnection() {
  try {
    console.log('Testing database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))

    const url = process.env.DATABASE_URL || ''
    const port = url.includes(':5432') ? '5432 (Direct)' : url.includes(':6543') ? '6543 (PgBouncer)' : 'Unknown'
    console.log('Connection type:', port)

    // Test connection
    await prisma.$connect()
    console.log('✅ Successfully connected to database')

    // Test query
    console.log('\nTesting project query...')
    const projects = await prisma.project.findMany({
      where: {
        isPublished: true,
        isFeatured: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    })

    console.log(`✅ Found ${projects.length} featured projects`)
    projects.forEach((p) => {
      console.log(`  - ${p.title} (${p.slug})`)
    })

  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
