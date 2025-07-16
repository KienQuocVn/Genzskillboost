"use client"

import { useState, useEffect } from "react"
import { Users, UserPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LazyProjectGrid } from "@/components/optimization/lazy-project-grid"
import type { Project, User } from "@/types"

export function FollowingContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const [followingUsers, setFollowingUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFollowingContent()
  }, [])

  const fetchFollowingContent = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        fetch("/api/projects?type=following"),
        fetch("/api/users/following"),
      ])

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setFollowingUsers(usersData.users)
      }
    } catch (error) {
      console.error("Error fetching following content:", error)
    } finally {
      setLoading(false)
    }
  }

  if (followingUsers.length === 0 && !loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Chưa theo dõi ai</h3>
          <p className="text-muted-foreground mb-4">Hãy tìm và theo dõi những người có cùng sở thích với bạn</p>
          <Button onClick={() => (window.location.href = "/explore")}>Khám phá người dùng</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6 text-genz-cyan" />
        <h2 className="text-2xl font-bold">Đang theo dõi</h2>
      </div>

      {/* Following Users */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Người bạn đang theo dõi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {followingUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Avatar className="h-12 w-12 mx-auto mb-2">
                  <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>{user.fullName[0]}</AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm truncate">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dự án mới từ người bạn theo dõi</h3>
        <LazyProjectGrid projects={projects} loading={loading} />
      </div>
    </div>
  )
}
