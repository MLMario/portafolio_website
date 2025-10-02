'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, FolderKanban, LogOut, Home } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { siteConfig } from '@/config/site'

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Don't show nav on login page
  if (pathname === '/admin/login') {
    return null
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const navItems = [
    {
      label: 'Projects',
      href: '/admin/projects',
      icon: FolderKanban,
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/projects" className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-semibold">Admin Dashboard</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)

              return (
                <Button
                  key={item.href}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              View Site
            </Link>
          </Button>

          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
