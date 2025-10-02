import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getSupabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const body = await req.json()
  const { isPublished } = body

  try {
    // Verify authentication
    await requireAuth()

    const supabaseAdmin = getSupabaseAdmin()

    const { data: project, error } = await supabaseAdmin
      .from('Project')
      .update({
        isPublished,
        publishedAt: isPublished ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}
