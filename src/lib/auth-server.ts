import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Get authenticated Supabase server client
 * Use this in server components and API routes
 */
export async function getServerSession() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

/**
 * Verify user is authenticated (for API routes)
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  return session
}
