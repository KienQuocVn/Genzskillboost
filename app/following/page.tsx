"use client"

import { useState, useEffect, useCallback } from "react"
import { Heart, MessageCircle, Share2, Play, User, Clock, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { supabase } from "@/lib/supabase"
import { useSocket } from "@/hooks/use-socket"
// import type { User as UserType } from "@/types/database"

interface FollowingContent {
  id: string
  type: "project" | "video"
  title: string
  description: string
  thumbnail_url: string
  video_url?: string
  created_at: string
  // user: UserType
  stats: {
    views: number
    likes: number
    comments: number
  }
  isLiked: boolean
}

export default function FollowingPage() {
  const { data: session } = useSession()
  const [content, setContent] = useState<FollowingContent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const socket = useSocket()

  // Fetch following content
  const fetchFollowingContent = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setRefreshing(true)

      // Get users that current user follows
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", session.user.id)

      if (!following || following.length === 0) {
        setContent([])
        return
      }

      const followingIds = following.map((f) => f.following_id)

      // Fetch projects from followed users
      const { data: projects } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          created_at,
          views,
          user_id,
          user:profiles(id, username, avatar_url)
        `)
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(10)

      // Fetch videos from followed users
      const { data: videos } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          video_url,
          created_at,
          views,
          user_id,
          user:profiles(id, username, avatar_url)
        `)
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(10)

      // Get likes for current user
      const allContentIds = [...(projects?.map((p) => p.id) || []), ...(videos?.map((v) => v.id) || [])]

      const { data: userLikes } = await supabase
        .from("likes")
        .select("content_id, content_type")
        .eq("user_id", session.user.id)
        .in("content_id", allContentIds)

      const likedContent = new Set(userLikes?.map((like) => `${like.content_type}-${like.content_id}`) || [])

      // Combine and format content
      const allContent: FollowingContent[] = [
        ...(projects?.map((project) => ({
          id: project.id,
          type: "project" as const,
          title: project.title,
          description: project.description,
          thumbnail_url: project.thumbnail_url,
          created_at: project.created_at,
          user: project.user,
          stats: {
            views: project.views || 0,
            likes: 0, // TODO: Get actual likes count
            comments: 0, // TODO: Get actual comments count
          },
          isLiked: likedContent.has(`project-${project.id}`),
        })) || []),
        ...(videos?.map((video) => ({
          id: video.id,
          type: "video" as const,
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnail_url,
          video_url: video.video_url,
          created_at: video.created_at,
          user: video.user,
          stats: {
            views: video.views || 0,
            likes: 0, // TODO: Get actual likes count
            comments: 0, // TODO: Get actual comments count
          },
          isLiked: likedContent.has(`video-${video.id}`),
        })) || []),
      ]

      // Sort by creation date
      allContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setContent(allContent)
    } catch (error) {
      console.error("Error fetching following content:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchFollowingContent()
  }, [fetchFollowingContent])

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket || !session?.user?.id) return

    const handleNewContent = (data: any) => {
      // Add new content to the top of the list
      setContent((prev) => [data, ...prev])
    }

    const handleContentUpdate = (data: any) => {
      // Update existing content
      setContent((prev) =>
        prev.map((item) => (item.id === data.id && item.type === data.type ? { ...item, ...data } : item)),
      )
    }

    socket.on("new_content", handleNewContent)
    socket.on("content_updated", handleContentUpdate)

    return () => {
      socket.off("new_content", handleNewContent)
      socket.off("content_updated", handleContentUpdate)
    }
  }, [socket, session?.user?.id])

  const handleLike = async (contentId: string, contentType: "project" | "video") => {
    if (!session?.user?.id) return

    try {
      const item = content.find((c) => c.id === contentId && c.type === contentType)
      if (!item) return

      if (item.isLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", session.user.id)
          .eq("content_id", contentId)
          .eq("content_type", contentType)
      } else {
        // Like
        await supabase.from("likes").insert({
          user_id: session.user.id,
          content_id: contentId,
          content_type: contentType,
        })
      }

      // Update local state
      setContent((prev) =>
        prev.map((item) =>
          item.id === contentId && item.type === contentType
            ? {
                ...item,
                isLiked: !item.isLiked,
                stats: {
                  ...item.stats,
                  likes: item.isLiked ? item.stats.likes - 1 : item.stats.likes + 1,
                },
              }
            : item,
        ),
      )

      // Emit socket event for real-time updates
      if (socket) {
        socket.emit("content_liked", {
          contentId,
          contentType,
          userId: session.user.id,
          liked: !item.isLiked,
        })
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Vừa xong"
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} giờ trước`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} ngày trước`

    return date.toLocaleDateString("vi-VN")
  }

  const ContentItem = ({ item }: { item: FollowingContent }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* User Header */}
      <div className="flex items-center space-x-3 p-4 pb-2">
        {/* <Image
          src={item.user?.avatar_url || "/placeholder.svg?height=40&width=40"}
          alt={item.user?.username || "User"}
          width={40}
          height={40}
          className="rounded-full"
        /> */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {/* <h4 className="font-semibold text-gray-900 dark:text-white">{item.user?.username}</h4> */}
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                item.type === "project"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  : "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300"
              }`}
            >
              {item.type === "project" ? "Dự án mới" : "Video mới"}
            </span>
          </div>
          <p className="text-sm text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimeAgo(item.created_at)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
      </div>

      {/* Media */}
      <div className="relative aspect-video mx-4 mb-4 rounded-lg overflow-hidden">
        <Image
          src={item.thumbnail_url || "/placeholder.svg?height=200&width=300"}
          alt={item.title}
          fill
          className="object-cover"
        />
        {item.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors">
              <Play className="w-6 h-6 ml-1" />
            </button>
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex items-center space-x-2 text-white text-xs">
          <div className="flex items-center space-x-1 bg-black/50 rounded px-2 py-1">
            <TrendingUp className="w-3 h-3" />
            <span>{item.stats.views}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => handleLike(item.id, item.type)}
            className={`flex items-center space-x-2 transition-colors ${
              item.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            }`}
          >
            <Heart className={`w-5 h-5 ${item.isLiked ? "fill-current" : ""}`} />
            <span className="text-sm">{item.stats.likes}</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{item.stats.comments}</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-sm">Chia sẻ</span>
          </button>
        </div>

        <Link
          href={`/${item.type === "project" ? "projects" : "videos"}/${item.id}`}
          className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  )

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Đăng nhập để xem nội dung</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Bạn cần đăng nhập để xem nội dung từ những người bạn theo dõi
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Đang theo dõi</h1>
              <p className="text-gray-600 dark:text-gray-400">Nội dung mới nhất từ những người bạn theo dõi</p>
            </div>
            <button
              onClick={fetchFollowingContent}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <TrendingUp className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Content Timeline */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : content.length > 0 ? (
          <div className="space-y-6">
            {content.map((item) => (
              <ContentItem key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <User className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có nội dung mới</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Theo dõi thêm người dùng để xem nội dung của họ tại đây
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Khám phá người dùng
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
