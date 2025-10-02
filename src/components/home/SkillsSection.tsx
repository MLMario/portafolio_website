import { skills } from '@/config/site'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Code, TrendingUp, Users } from 'lucide-react'

const skillIcons = {
  'Data Science & Modeling': Code,
  'Methodologies & Frameworks': TrendingUp,
  'Leadership & Strategy': Users,
}

export function SkillsSection() {
  return (
    <section id="skills" className="container py-20">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Skills & Expertise
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Combining technical expertise with strategic thinking to deliver
            data-driven solutions
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {Object.entries(skills).map(([category, items]) => {
            const Icon = skillIcons[category as keyof typeof skillIcons]

            return (
              <Card key={category} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {items.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
