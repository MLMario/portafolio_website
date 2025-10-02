import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple middleware - actual auth check happens on client side with Supabase
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
