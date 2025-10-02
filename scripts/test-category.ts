// Test script to verify category field implementation
// Run with: npx tsx scripts/test-category.ts

import { config } from 'dotenv'
config({ path: '.env.local' })

import { prisma } from '../src/lib/prisma'
import { projectCategories } from '../src/config/site'
import { validateCategory, sanitizeCategory, isValidCategory } from '../src/lib/validation'

async function testCategoryImplementation() {
  console.log('🧪 Testing Category Implementation...\n')

  let allPassed = true

  // Test 1: Validate category type checking
  console.log('1️⃣ Testing category validation...')
  try {
    const validTests = [
      { input: 'article', expected: true },
      { input: 'analysis', expected: true },
      { input: 'tutorial', expected: true },
      { input: 'software_implementation', expected: true },
      { input: 'other', expected: true },
      { input: 'invalid', expected: false },
      { input: 'Machine Learning', expected: false },
      { input: '', expected: false },
      { input: null, expected: false },
    ]

    validTests.forEach((test) => {
      const result = isValidCategory(test.input)
      if (result === test.expected) {
        console.log(`   ✅ isValidCategory("${test.input}") = ${result}`)
      } else {
        console.log(`   ❌ isValidCategory("${test.input}") = ${result}, expected ${test.expected}`)
        allPassed = false
      }
    })
    console.log()
  } catch (error) {
    console.error('   ❌ Validation test failed:', error)
    allPassed = false
  }

  // Test 2: Test sanitization
  console.log('2️⃣ Testing category sanitization...')
  try {
    const sanitizeTests = [
      { input: 'article', expected: 'article' },
      { input: 'invalid', expected: 'other' },
      { input: null, expected: 'other' },
      { input: '', expected: 'other' },
    ]

    sanitizeTests.forEach((test) => {
      const result = sanitizeCategory(test.input)
      if (result === test.expected) {
        console.log(`   ✅ sanitizeCategory("${test.input}") = "${result}"`)
      } else {
        console.log(
          `   ❌ sanitizeCategory("${test.input}") = "${result}", expected "${test.expected}"`
        )
        allPassed = false
      }
    })
    console.log()
  } catch (error) {
    console.error('   ❌ Sanitization test failed:', error)
    allPassed = false
  }

  // Test 3: Test database schema
  console.log('3️⃣ Testing database schema...')
  try {
    // Try to create a project with valid category
    const testProject = await prisma.project.create({
      data: {
        title: 'Test Project',
        slug: 'test-project-' + Date.now(),
        description: 'Test description',
        category: 'analysis',
        tags: ['test'],
        gammaUrl: 'https://gamma.app/test',
        markdownFileUrl: 'https://test.com/file.md',
        markdownContent: '# Test',
        imageUrls: [],
      },
    })
    console.log(`   ✅ Created project with category "${testProject.category}"`)

    // Clean up
    await prisma.project.delete({ where: { id: testProject.id } })
    console.log('   ✅ Test project deleted')
    console.log()
  } catch (error) {
    console.error('   ❌ Database test failed:', error)
    allPassed = false
  }

  // Test 4: Test invalid category (should fail with check constraint)
  console.log('4️⃣ Testing invalid category rejection...')
  try {
    // This should fail due to check constraint
    const invalidProject = await prisma.project.create({
      data: {
        title: 'Invalid Project',
        slug: 'invalid-project-' + Date.now(),
        description: 'Test description',
        category: 'Machine Learning', // Invalid!
        tags: ['test'],
        gammaUrl: 'https://gamma.app/test',
        markdownFileUrl: 'https://test.com/file.md',
        markdownContent: '# Test',
        imageUrls: [],
      },
    })

    console.log('   ❌ Invalid category was accepted (should have been rejected)')
    // Clean up if it somehow got created
    await prisma.project.delete({ where: { id: invalidProject.id } })
    allPassed = false
  } catch (error: any) {
    if (error.message?.includes('check constraint') || error.code === 'P2010') {
      console.log('   ✅ Invalid category correctly rejected by database')
    } else {
      console.log('   ⚠️  Failed with unexpected error:', error.message)
    }
    console.log()
  }

  // Test 5: Check default value
  console.log('5️⃣ Testing default category value...')
  try {
    const rawResult: any = await prisma.$queryRaw`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_name = 'Project' AND column_name = 'category'
    `

    const defaultValue = rawResult[0]?.column_default
    if (defaultValue?.includes('other')) {
      console.log(`   ✅ Default value is set correctly: ${defaultValue}`)
    } else {
      console.log(`   ❌ Default value is incorrect: ${defaultValue}`)
      allPassed = false
    }
    console.log()
  } catch (error) {
    console.error('   ❌ Default value check failed:', error)
    allPassed = false
  }

  // Test 6: Verify category is required (NOT NULL)
  console.log('6️⃣ Testing category is required...')
  try {
    const rawResult: any = await prisma.$queryRaw`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Project' AND column_name = 'category'
    `

    const isNullable = rawResult[0]?.is_nullable
    if (isNullable === 'NO') {
      console.log('   ✅ Category is required (NOT NULL)')
    } else {
      console.log(`   ❌ Category is nullable: ${isNullable}`)
      allPassed = false
    }
    console.log()
  } catch (error) {
    console.error('   ❌ NOT NULL check failed:', error)
    allPassed = false
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (allPassed) {
    console.log('✨ All category tests passed!')
    console.log('\n📋 Valid categories:', projectCategories.join(', '))
    console.log('📦 Category field is properly configured')
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  await prisma.$disconnect()
  process.exit(allPassed ? 0 : 1)
}

testCategoryImplementation().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
