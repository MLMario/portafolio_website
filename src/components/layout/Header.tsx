'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { Github, Linkedin, Mail } from 'lucide-react'

export function Header() {
  const pathname = usePathname()

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Projects', href: '/projects' },
    { name: 'About', href: '/#about' },
    { name: 'Contact', href: '/#contact' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo/Name */}
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <span className="text-xl font-bold">{siteConfig.author.name}</span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Social Links */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={siteConfig.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href={siteConfig.links.email} aria-label="Email">
              <Mail className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
