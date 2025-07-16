"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { User, Edit, Settings, Camera, MapPin, Calendar, LinkIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LazyProjectGrid } from "@/components/optimization/lazy-project-grid"
import { formatDate } from "@/lib/utils"
import type { User as UserType, Project } from "@/types"

export function ProfileContent() {
  const { data: session } = useSession()
  const [user, setUser] = useState<UserType | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({
    projectsCount: 0,
    followersCount: 0,
    followingCount: 0,
    totalViews: 0,
    totalLikes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const [userRes, projectsRes, statsRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch(`/api/projects?userId=${session?.user?.id}`),
        fetch("/api/user/stats"),
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Không thể tải thông tin hồ sơ</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">{user.fullName[0]}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-transparent"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <h2 className="text-2xl font-bold">{user.fullName}</h2>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>

                {user.bio && <p className="text-sm max-w-md">{user.bio}</p>}

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  {user.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Tham gia {formatDate(user.createdAt)}</span>
                  </div>
                </div>

                {user.socialLinks && Object.keys(user.socialLinks).length > 0 && (
                  <div className="flex items-center space-x-2">
                    {user.socialLinks.website && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="h-4 w-4 mr-1" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-genz-purple">{stats.projectsCount}</div>
            <div className="text-sm text-muted-foreground">Dự án</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-genz-pink">{stats.followersCount}</div>
            <div className="text-sm text-muted-foreground">Người theo dõi</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-genz-cyan">{stats.followingCount}</div>
            <div className="text-sm text-muted-foreground">Đang theo dõi</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-genz-yellow">{stats.totalViews}</div>
            <div className="text-sm text-muted-foreground">Lượt xem</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-genz-green">{stats.totalLikes}</div>
            <div className="text-sm text-muted-foreground">Lượt thích</div>
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kỹ năng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-genz-purple/10 text-genz-purple">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Dự án ({stats.projectsCount})</TabsTrigger>
          <TabsTrigger value="liked">Đã thích</TabsTrigger>
          <TabsTrigger value="saved">Đã lưu</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <LazyProjectGrid projects={projects} loading={false} />
        </TabsContent>

        <TabsContent value="liked">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chức năng đang phát triển</p>
          </div>
        </TabsContent>

        <TabsContent value="saved">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chức năng đang phát triển</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
