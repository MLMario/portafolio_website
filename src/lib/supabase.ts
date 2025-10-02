import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Supabase client for browser/client-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Supabase admin client for server-side usage (has elevated permissions)
// Use this for admin operations like bypassing RLS policies
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Type-safe storage helpers
export const storage = {
  // Upload file to Supabase Storage
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
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

  // Delete file from storage
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  },

  // Download file as blob
  async downloadFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) throw error
    return data
  }
}
