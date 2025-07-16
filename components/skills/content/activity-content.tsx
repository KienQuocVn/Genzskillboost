"use client"

import { useState, useEffect } from "react"
import { Activity, Heart, MessageCircle, UserPlus, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface ActivityItem {
  id: string
  type: "like" | "comment" | "follow" | "view" | "project_created"
  title: string
  description: string
  user: {
    id: string
    fullName: string
    username: string
    avatarUrl?: string
  }
  createdAt: string
  data: any
}

export function ActivityContent() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/activities")
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />
      case "view":
        return <Eye className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-purple-500" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "like":
        return "bg-red-50 border-red-200"
      case "comment":
        return "bg-blue-50 border-blue-200"
      case "follow":
        return "bg-green-50 border-green-200"
      case "view":
        return "bg-gray-50 border-gray-200"
      default:
        return "bg-purple-50 border-purple-200"
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Activity className="h-6 w-6 text-genz-green" />
        <h2 className="text-2xl font-bold">Hoạt động gần đây</h2>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Chưa có hoạt động nào</p>
          </div>
        ) : (
          activities.map((activity) => (
            <Card key={activity.id} className={`hover:shadow-md transition-shadow ${getActivityColor(activity.type)}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{activity.user.fullName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{activity.user.fullName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {activity.type === "like" && "đã thích"}
                        {activity.type === "comment" && "đã bình luận"}
                        {activity.type === "follow" && "đã theo dõi"}
                        {activity.type === "view" && "đã xem"}
                        {activity.type === "project_created" && "đã tạo dự án"}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium mb-1">{activity.title}</p>
                    <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
