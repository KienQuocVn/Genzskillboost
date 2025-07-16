"use client"

import { lazy, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"

// Lazy load the ProjectGrid component
// const ProjectGrid = lazy(() =>
//   import("@/components/skills/project-grid").then((module) => ({ default: module.ProjectGrid })),
// )

interface LazyProjectGridProps {
  projects?: any[]
  loading?: boolean
}

function ProjectGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="aspect-video bg-muted rounded-t-lg"></div>
          <CardContent className="p-4">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
            <div className="flex space-x-2">
              <div className="h-6 w-16 bg-muted rounded"></div>
              <div className="h-6 w-20 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function LazyProjectGrid(props: LazyProjectGridProps) {
  return (
    <Suspense fallback={<ProjectGridSkeleton />}>
      {/* <ProjectGrid {...props} /> */}
    </Suspense>
  )
}
