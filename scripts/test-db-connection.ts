import { config } from 'dotenv'
config({ path: '.env.local' })

import { prisma } from '../src/lib/prisma'

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...\n')

    // Parse connection URL
    const url = process.env.DATABASE_URL || ''
    const maskedUrl = url.replace(/:[^:@]+@/, ':****@')
    console.log('DATABASE_URL:', maskedUrl)

    // Detect connection type
    const port = url.includes(':5432') ? '5432 (Direct/Session)' : url.includes(':6543') ? '6543 (Transaction Pooler)' : 'Unknown'
    const host = url.match(/@([^:]+):/)?.[1] || 'Unknown'
    const hasPooler = host.includes('.pooler.') ? '✅ Using Pooler' : '❌ Direct Connection'

    console.log('Connection Info:')
    console.log('  - Port:', port)
    console.log('  - Host:', host)
    console.log('  - Pooling:', hasPooler)

    // Check for pgbouncer parameters
    const hasPgBouncer = url.includes('pgbouncer=true')
    const hasConnectionLimit = url.includes('connection_limit=')
    const hasConnectTimeout = url.includes('connect_timeout=')

    console.log('\nConnection Parameters:')
    console.log('  - pgbouncer=true:', hasPgBouncer ? '✅' : '❌ (recommended for port 6543)')
    console.log('  - connection_limit:', hasConnectionLimit ? '✅' : '❌ (recommended: connection_limit=1)')
    console.log('  - connect_timeout:', hasConnectTimeout ? '✅' : '❌ (recommended: connect_timeout=10)')

    // Test connection with timing
    console.log('\n⏱️  Connecting to database...')
    const startConnect = Date.now()
    await prisma.$connect()
    const connectTime = Date.now() - startConnect
    console.log(`✅ Successfully connected in ${connectTime}ms`)

    // Test query with timing
    console.log('\n⏱️  Testing project query...')
    const startQuery = Date.now()
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
    const queryTime = Date.now() - startQuery

    console.log(`✅ Query completed in ${queryTime}ms`)
    console.log(`✅ Found ${projects.length} featured project(s)`)

    if (projects.length > 0) {
      console.log('\nProjects:')
      projects.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} (${p.slug})`)
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ All tests passed!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ Database connection failed')
    console.error('='.repeat(60))

    if (error instanceof Error) {
      console.error('\nError Details:')
      console.error('  - Name:', error.name)
      console.error('  - Message:', error.message)

      // Provide specific troubleshooting hints
      if (error.message.includes('Can\'t reach database server')) {
        console.error('\n💡 Troubleshooting:')
        console.error('  - Check if the host/port is correct')
        console.error('  - Verify network connectivity to Supabase')
        console.error('  - For port 6543: Ensure using pooler host (e.g., aws-*.pooler.supabase.com)')
      } else if (error.message.includes('authentication failed')) {
        console.error('\n💡 Troubleshooting:')
        console.error('  - Verify the password is correct')
        console.error('  - Check username format (may need postgres.projectRef for pooler)')
      } else if (error.message.includes('prepared statement')) {
        console.error('\n💡 Troubleshooting:')
        console.error('  - Add pgbouncer=true to your connection string')
        console.error('  - Transaction mode (port 6543) doesn\'t support prepared statements')
      }
    } else {
      console.error('Error:', error)
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Disconnected from database')
  }
}

testConnection()
