import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mail } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-20">
      <div className="w-full max-w-4xl text-center">
        {/* Greeting */}
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Hello, I'm
        </p>

        {/* Name */}
        <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          {siteConfig.author.name}
        </h1>

        {/* Title */}
        <h2 className="mb-8 text-2xl font-semibold text-muted-foreground sm:text-3xl">
          {siteConfig.author.title}
        </h2>

        {/* Bio */}
        <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {siteConfig.author.bio}
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/projects">
              View Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#contact">
              <Mail className="mr-2 h-4 w-4" />
              Get in Touch
            </Link>
          </Button>
        </div>

        {/* Scroll indicator */}
        <div className="mt-20 animate-bounce">
          <svg
            className="mx-auto h-6 w-6 text-muted-foreground"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>
    </section>
  )
}
