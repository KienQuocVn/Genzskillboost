"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LazyProjectGrid } from "@/components/optimization/lazy-project-grid"
import { Button } from "@/components/ui/button"
import type { Project } from "@/types"

export function RecommendationsContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const response = await fetch("/api/recommendations/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Sparkles className="h-6 w-6 text-genz-purple" />
        <h2 className="text-2xl font-bold">Gợi ý dành cho bạn</h2>
      </div>

      {/* Featured Section */}
      <Card className="bg-gradient-to-r from-genz-purple/10 to-genz-pink/10 border-genz-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-genz-purple" />
            <span>Dự án nổi bật hôm nay</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Khám phá những dự án được cộng đồng yêu thích nhất</p>
          <Button
            variant="outline"
            className="border-genz-purple text-genz-purple hover:bg-genz-purple/10 bg-transparent"
          >
            Xem tất cả
          </Button>
        </CardContent>
      </Card>

      {/* Recommended Projects */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dự án được đề xuất</h3>
        <LazyProjectGrid projects={projects} loading={loading} />
      </div>
    </div>
  )
}
