// Verification script to test database and service connections
// Run with: npx tsx scripts/verify-setup.ts

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

import { prisma } from '../src/lib/prisma'
import { supabase, supabaseAdmin } from '../src/lib/supabase'
import { anthropic } from '../src/lib/anthropic'

async function verifySetup() {
  console.log('🔍 Verifying Portfolio Website Setup...\n')

  let allPassed = true

  // 1. Test Prisma Database Connection
  console.log('1️⃣ Testing Prisma Database Connection...')
  try {
    await prisma.$connect()
    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    console.log('   ✅ Prisma connected successfully')
    console.log(`   📊 Current stats: ${userCount} users, ${projectCount} projects\n`)
  } catch (error) {
    console.error('   ❌ Prisma connection failed:', error)
    allPassed = false
  }

  // 2. Test Supabase Connection
  console.log('2️⃣ Testing Supabase Connection...')
  try {
    const { data, error } = await supabase.from('Project').select('count').single()
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows, which is ok
    console.log('   ✅ Supabase connected successfully\n')
  } catch (error) {
    console.error('   ❌ Supabase connection failed:', error)
    allPassed = false
  }

  // 3. Test Supabase Storage Buckets
  console.log('3️⃣ Testing Supabase Storage Buckets...')
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()
    if (error) throw error

    const requiredBuckets = ['projects', 'images', 'thumbnails']
    const existingBuckets = buckets.map((b) => b.name)

    requiredBuckets.forEach((bucket) => {
      if (existingBuckets.includes(bucket)) {
        console.log(`   ✅ Bucket '${bucket}' exists`)
      } else {
        console.log(`   ❌ Bucket '${bucket}' is missing`)
        allPassed = false
      }
    })
    console.log()
  } catch (error) {
    console.error('   ❌ Storage bucket check failed:', error)
    allPassed = false
  }

  // 4. Test Anthropic API
  console.log('4️⃣ Testing Anthropic API...')
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Say "API connection successful" and nothing else.',
        },
      ],
    })

    const response = message.content[0]
    if (response.type === 'text') {
      console.log(`   ✅ Anthropic API connected successfully`)
      console.log(`   💬 Response: "${response.text}"\n`)
    }
  } catch (error) {
    console.error('   ❌ Anthropic API failed:', error)
    allPassed = false
  }

  // 5. Verify Environment Variables
  console.log('5️⃣ Verifying Environment Variables...')
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
  ]

  requiredEnvVars.forEach((envVar) => {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar} is set`)
    } else {
      console.log(`   ❌ ${envVar} is missing`)
      allPassed = false
    }
  })
  console.log()

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (allPassed) {
    console.log('✨ All checks passed! Your setup is ready.')
    console.log('📦 Phase 1: Foundation - COMPLETE')
    console.log('\n🚀 Ready to start Phase 2: Public Interface')
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above.')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  await prisma.$disconnect()
  process.exit(allPassed ? 0 : 1)
}

verifySetup().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
