import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables first
config({ path: '.env.local' })

async function addTestProjectWithImages() {
  const markdownFilePath = process.argv[2]
  const imagesDir = process.argv[3]

  if (!markdownFilePath || !imagesDir) {
    console.error('Usage: npx tsx scripts/add-test-project-with-images.ts <path-to-markdown-file> <path-to-images-directory>')
    console.error('Example: npx tsx scripts/add-test-project-with-images.ts ./test_markdown/tutorial.md ./test_markdown/images')
    process.exit(1)
  }

  try {
    // Read markdown file
    console.log('📄 Reading markdown file...')
    let markdownContent = fs.readFileSync(markdownFilePath, 'utf-8')

    // Get all image files from the images directory
    console.log('📸 Scanning images directory...')
    const imageFiles = fs.readdirSync(imagesDir).filter(file =>
      file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.gif')
    )
    console.log(`Found ${imageFiles.length} images:`, imageFiles.join(', '))

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials')
      process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Upload images and collect URLs
    console.log('\n📤 Uploading images to Supabase Storage...')
    const uploadedImageUrls: string[] = []

    for (const imageFile of imageFiles) {
      const imagePath = path.join(imagesDir, imageFile)
      const fileBuffer = fs.readFileSync(imagePath)

      // Upload to Supabase Storage (bucket: 'projects')
      const fileName = `test-project/${Date.now()}-${imageFile}`

      const { data, error } = await supabase.storage
        .from('projects')
        .upload(fileName, fileBuffer, {
          contentType: `image/${path.extname(imageFile).slice(1)}`,
          upsert: false
        })

      if (error) {
        console.error(`❌ Error uploading ${imageFile}:`, error.message)
        // Create bucket if it doesn't exist
        if (error.message.includes('not found')) {
          console.log('Creating "projects" bucket...')
          const { error: bucketError } = await supabase.storage.createBucket('projects', {
            public: true,
            fileSizeLimit: 52428800, // 50MB
          })
          if (bucketError && !bucketError.message.includes('already exists')) {
            console.error('Error creating bucket:', bucketError)
          } else {
            // Retry upload
            const { data: retryData, error: retryError } = await supabase.storage
              .from('projects')
              .upload(fileName, fileBuffer, {
                contentType: `image/${path.extname(imageFile).slice(1)}`,
                upsert: false
              })

            if (retryError) {
              console.error(`❌ Retry failed for ${imageFile}:`, retryError.message)
              continue
            }
          }
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('projects')
        .getPublicUrl(fileName)

      console.log(`✅ Uploaded: ${imageFile} -> ${publicUrl}`)
      uploadedImageUrls.push(publicUrl)

      // Replace relative path in markdown with public URL
      const relativeRef = imageFile
      markdownContent = markdownContent.replace(
        new RegExp(`!\\[([^\\]]*)\\]\\(${relativeRef}\\)`, 'g'),
        `![$1](${publicUrl})`
      )
    }

    // Extract final image URLs from markdown
    const imageRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g
    const finalImageUrls: string[] = []
    let match

    while ((match = imageRegex.exec(markdownContent)) !== null) {
      finalImageUrls.push(match[1])
    }

    console.log(`\n📝 Updated markdown with ${finalImageUrls.length} image URLs`)

    // Create project
    console.log('\n💾 Creating project in database...')
    const project = await prisma.project.create({
      data: {
        title: 'When Randomization Goes Wrong: Cookie-Level vs User-Level Analysis',
        slug: 'cookie-level-vs-user-level-randomization',
        description: 'A comprehensive tutorial on why cookie-level randomization can lead to flawed A/B test results, and how to properly analyze experiments at the user level.',
        category: 'tutorial',
        tags: ['Python', 'A/B Testing', 'Statistics', 'Data Analysis', 'Causal Inference'],
        thumbnail: finalImageUrls[0] || null,
        gammaUrl: 'https://gamma.app/docs/AB-Testing-Cookie-vs-User-Level-Analysis-example',
        markdownFileUrl: '',
        markdownContent: markdownContent,
        imageUrls: finalImageUrls,
        isPublished: true,
        publishedAt: new Date(),
      },
    })

    console.log('\n✅ Test project created successfully!')
    console.log('\n📊 Project Details:')
    console.log('- ID:', project.id)
    console.log('- Title:', project.title)
    console.log('- Slug:', project.slug)
    console.log('- Images:', finalImageUrls.length)
    console.log('\n🌐 View at:')
    console.log('- Summary: http://localhost:3001/projects/' + project.slug)
    console.log('- Details: http://localhost:3001/projects/' + project.slug + '/details')
    console.log('- Admin: http://localhost:3001/admin/projects')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addTestProjectWithImages()
