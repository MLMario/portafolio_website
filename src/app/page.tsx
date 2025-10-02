import { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'
import { SkillsSection } from '@/components/home/SkillsSection'
import { FeaturedProjects } from '@/components/home/FeaturedProjects'
import { ContactSection } from '@/components/home/ContactSection'
import { Separator } from '@/components/ui/separator'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Home',
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    type: 'website',
  },
  alternates: {
    canonical: siteConfig.url,
  },
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection />

      <Separator />

      {/* Skills Section */}
      <SkillsSection />

      <Separator />

      {/* Featured Projects Section */}
      <FeaturedProjects />

      <Separator />

      {/* Contact Section */}
      <ContactSection />
    </div>
  )
}
