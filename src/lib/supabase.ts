import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Supabase client for browser/client-side usage with cookie-based auth
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Supabase admin client for server-side usage (has elevated permissions)
// Use this for admin operations like bypassing RLS policies
// IMPORTANT: Only use in server-side code (API routes, server components)
export function getSupabaseAdmin() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Type-safe storage helpers
export const storage = {
  // Upload file to Supabase Storage (uses admin client to bypass RLS)
  async uploadFile(bucket: string, path: string, file: File) {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error
    return data
  },

  // Get public URL for a file
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  },

  // Delete file from storage (uses admin client to bypass RLS)
  async deleteFile(bucket: string, path: string) {
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  },

  // Download file as blob
  async downloadFile(bucket: string, path: string) {
    const { data, error} = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) throw error
    return data
  },

  // List all files in a folder
  async listFiles(bucket: string, folder: string) {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(folder, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) throw error
    return data || []
  },

  // Copy file from one path to another (download + re-upload)
  async copyFile(bucket: string, fromPath: string, toPath: string) {
    const supabaseAdmin = getSupabaseAdmin()

    // Download the file
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(bucket)
      .download(fromPath)

    if (downloadError) throw downloadError

    // Upload to new path with upsert
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(toPath, fileData, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) throw uploadError
  },

  // Delete folder recursively
  async deleteFolder(bucket: string, folder: string) {
    const supabaseAdmin = getSupabaseAdmin()

    // List all files in folder
    const files = await this.listFiles(bucket, folder)

    if (files.length === 0) return

    // Delete all files
    const filePaths = files.map(file => `${folder}/${file.name}`)
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove(filePaths)

    if (error) throw error
  }
}
