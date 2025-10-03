import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Github, Linkedin, Mail } from 'lucide-react'

export function ContactSection() {
  return (
    <section id="contact" className="container py-20">
      <div className="w-full max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Get In Touch
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Interested in collaboration or have a question? Feel free to reach out!
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Email */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Email</CardTitle>
              <CardDescription>Drop me a line</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full" asChild>
                <Link href={siteConfig.links.email}>
                  Send Email
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* GitHub */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Github className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>GitHub</CardTitle>
              <CardDescription>Check out my code</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full" asChild>
                <Link
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit GitHub
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* LinkedIn */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Linkedin className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>LinkedIn</CardTitle>
              <CardDescription>Let&apos;s connect</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full" asChild>
                <Link
                  href={siteConfig.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Connect
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Direct Email Link */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-muted-foreground">Or email me directly at:</p>
          <Link
            href={siteConfig.links.email}
            className="text-xl font-semibold text-primary hover:underline"
          >
            {siteConfig.author.email}
          </Link>
        </div>
      </div>
    </section>
  )
}
