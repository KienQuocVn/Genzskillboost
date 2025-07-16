"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Play, Eye, Heart, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNumber, formatDate } from "@/lib/utils"
import type { Video } from "@/types"

interface TrendingVideosProps {
  timeframe?: "24h" | "7d" | "30d"
  limit?: number
}

export function TrendingVideos({ timeframe = "24h", limit = 12 }: TrendingVideosProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTimeframe, setActiveTimeframe] = useState(timeframe)

  useEffect(() => {
    fetchTrendingVideos(activeTimeframe)
  }, [activeTimeframe])

  const fetchTrendingVideos = async (period: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/videos/trending?period=${period}&limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos)
      }
    } catch (error) {
      console.error("Error fetching trending videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoClick = (videoId: string) => {
    window.location.href = `/videos/${videoId}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-genz-pink" />
          <h2 className="text-2xl font-bold">Xu hướng</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-[9/16] bg-muted rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-genz-pink" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-genz-pink to-genz-purple bg-clip-text text-transparent">
            Xu hướng 🔥
          </h2>
        </div>

        {/* Time Filter */}
        <Tabs value={activeTimeframe} 
        // onValueChange={setActiveTimeframe}
        >
          <TabsList>
            <TabsTrigger value="24h">24 giờ</TabsTrigger>
            <TabsTrigger value="7d">7 ngày</TabsTrigger>
            <TabsTrigger value="30d">30 ngày</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Trending Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video, index) => (
          <TrendingVideoCard key={video.id} video={video} rank={index + 1} onClick={() => handleVideoClick(video.id)} />
        ))}
      </div>

      {/* Empty State */}
      {videos.length === 0 && !loading && (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Chưa có video xu hướng nào</p>
        </div>
      )}
    </div>
  )
}

interface TrendingVideoCardProps {
  video: Video
  rank: number
  onClick: () => void
}

function TrendingVideoCard({ video, rank, onClick }: TrendingVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-[9/16] overflow-hidden">
        <img
          src={video.thumbnailUrl || "/placeholder.svg"}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Rank Badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="secondary"
            className={`font-bold text-white ${
              rank <= 3
                ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                : rank <= 10
                  ? "bg-gradient-to-r from-gray-400 to-gray-600"
                  : "bg-black/50"
            }`}
          >
            #{rank}
          </Badge>
        </div>

        {/* Play Button Overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
          <span className="text-white text-xs">{video.duration}s</span>
        </div>

        {/* Stats Overlay */}
        <div className="absolute bottom-2 left-2 flex items-center space-x-2 text-white text-xs">
          <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
            <Eye className="h-3 w-3" />
            <span>{formatNumber(video.viewsCount)}</span>
          </div>
          <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
            <Heart className="h-3 w-3" />
            <span>{formatNumber(video.likesCount)}</span>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-genz-pink transition-colors">
            {video.title}
          </h3>

          {/* User Info */}
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={video.user?.avatarUrl || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">{video.user?.fullName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{video.user?.fullName}</p>
            </div>
          </div>

          {/* Tags */}
          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {video.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {video.tags.length > 2 && <span className="text-xs text-muted-foreground">+{video.tags.length - 2}</span>}
            </div>
          )}

          {/* Time */}
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(video.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
