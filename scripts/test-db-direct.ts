import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '../src/generated/prisma'

async function testConnection() {
  // Test both connection types
  const connections = [
    {
      name: 'PgBouncer (port 6543)',
      url: process.env.DATABASE_URL,
    },
    {
      name: 'Direct (port 5432)', 
      url: process.env.DATABASE_URL?.replace(':6543', ':5432').replace('?pgbouncer=true&connection_limit=1', ''),
    }
  ]

  for (const conn of connections) {
    console.log(`\n=== Testing ${conn.name} ===`)
    console.log('URL:', conn.url?.replace(/:[^:@]+@/, ':****@'))
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: conn.url,
        },
      },
    })

    try {
      await prisma.$connect()
      console.log('✅ Connection successful')

      const projects = await prisma.project.findMany({
        where: {
          isPublished: true,
          isFeatured: true,
        },
        select: {
          id: true,
          title: true,
        },
      })

      console.log(`✅ Query successful: Found ${projects.length} projects`)
    } catch (error: any) {
      console.error('❌ Connection failed:', error.message)
    } finally {
      await prisma.$disconnect()
    }
  }
}

testConnection()
