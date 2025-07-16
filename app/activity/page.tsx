"use client"

import { useState, useEffect, useCallback } from "react"
import { Heart, MessageCircle, Upload, UserPlus, Eye, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { supabase } from "@/lib/supabase"

interface Activity {
  id: string
  type: "like" | "comment" | "upload" | "follow" | "view"
  created_at: string
  content?: {
    id: string
    type: "project" | "video"
    title: string
    thumbnail_url: string
  }
  target_user?: {
    id: string
    username: string
    avatar_url: string
  }
  metadata?: {
    comment_text?: string
    view_duration?: number
  }
}

const ITEMS_PER_PAGE = 20

export default function ActivityPage() {
  const { data: session } = useSession()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<"all" | "likes" | "comments" | "uploads" | "follows">("all")

  // Fetch user activities
  const fetchActivities = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      let query = supabase
        .from("user_activities")
        .select(`
          id,
          type,
          created_at,
          content_id,
          content_type,
          target_user_id,
          metadata,
          content:projects(id, title, thumbnail_url),
          content_video:videos(id, title, thumbnail_url),
          target_user:profiles(id, username, avatar_url)
        `)
        .eq("user_id", session.user.id)

      // Apply filter
      if (filter !== "all") {
        query = query.eq("type", filter.slice(0, -1)) // Remove 's' from filter
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to)

      if (error) throw error

      // Format activities
      // const formattedActivities: Activity[] = (data || []).map((activity) => ({
      //   id: activity.id,
      //   type: activity.type,
      //   created_at: activity.created_at,
      //   content:
      //     activity.content_type === "project"
      //       ? {
      //           id: activity.content?.id || activity.content_video?.id,
      //           type: "project",
      //           title: activity.content?.title || activity.content_video?.title,
      //           thumbnail_url: activity.content?.thumbnail_url || activity.content_video?.thumbnail_url,
      //         }
      //       : activity.content_type === "video"
      //         ? {
      //             id: activity.content_video?.id || activity.content?.id,
      //             type: "video",
      //             title: activity.content_video?.title || activity.content?.title,
      //             thumbnail_url: activity.content_video?.thumbnail_url || activity.content?.thumbnail_url,
      //           }
      //         : undefined,
      //   target_user: activity.target_user,
      //   metadata: activity.metadata,
      // }))

      // setActivities(formattedActivities)
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE))
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, currentPage, filter])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

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

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "like":
        return <Heart className="w-5 h-5 text-red-500" />
      case "comment":
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case "upload":
        return <Upload className="w-5 h-5 text-green-500" />
      case "follow":
        return <UserPlus className="w-5 h-5 text-purple-500" />
      case "view":
        return <Eye className="w-5 h-5 text-gray-500" />
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />
    }
  }

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case "like":
        return `Bạn đã thích ${activity.content?.type === "project" ? "dự án" : "video"}`
      case "comment":
        return `Bạn đã bình luận về ${activity.content?.type === "project" ? "dự án" : "video"}`
      case "upload":
        return `Bạn đã tải lên ${activity.content?.type === "project" ? "dự án" : "video"} mới`
      case "follow":
        return "Bạn đã theo dõi"
      case "view":
        return `Bạn đã xem ${activity.content?.type === "project" ? "dự án" : "video"}`
      default:
        return "Hoạt động"
    }
  }

  const ActivityItem = ({ activity }: { activity: Activity }) => (
    <div className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Activity Icon */}
      <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-900 dark:text-white">
              {getActivityText(activity)}
              {activity.target_user && (
                <span className="font-medium text-purple-600 dark:text-purple-400 ml-1">
                  {activity.target_user.username}
                </span>
              )}
              {activity.content && (
                <span className="font-medium text-gray-900 dark:text-white ml-1">"{activity.content.title}"</span>
              )}
            </p>

            {activity.metadata?.comment_text && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{activity.metadata.comment_text}"</p>
            )}

            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatTimeAgo(activity.created_at)}
            </p>
          </div>

          {/* Content Thumbnail */}
          {activity.content && (
            <Link
              href={`/${activity.content.type === "project" ? "projects" : "videos"}/${activity.content.id}`}
              className="flex-shrink-0 ml-4"
            >
              <Image
                src={activity.content.thumbnail_url || "/placeholder.svg?height=60&width=80"}
                alt={activity.content.title}
                width={80}
                height={60}
                className="rounded-lg object-cover hover:opacity-80 transition-opacity"
              />
            </Link>
          )}

          {/* User Avatar for follow activities */}
          {activity.target_user && activity.type === "follow" && (
            <Link href={`/profile/${activity.target_user.id}`} className="flex-shrink-0 ml-4">
              <Image
                src={activity.target_user.avatar_url || "/placeholder.svg?height=40&width=40"}
                alt={activity.target_user.username}
                width={40}
                height={40}
                className="rounded-full hover:opacity-80 transition-opacity"
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  )

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Đăng nhập để xem hoạt động</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Bạn cần đăng nhập để xem lịch sử hoạt động của mình</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hoạt động của bạn</h1>
          <p className="text-gray-600 dark:text-gray-400">Xem lại tất cả các hoạt động và tương tác của bạn</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Tất cả", icon: Calendar },
              { key: "likes", label: "Lượt thích", icon: Heart },
              { key: "comments", label: "Bình luận", icon: MessageCircle },
              { key: "uploads", label: "Tải lên", icon: Upload },
              { key: "follows", label: "Theo dõi", icon: UserPlus },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key as typeof filter)
                  setCurrentPage(1)
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Activities List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                  <div className="w-20 h-15 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <>
            <div className="space-y-4 mb-8">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Trang {currentPage} / {totalPages}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Trước</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            currentPage === page
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có hoạt động nào</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Bắt đầu tương tác với nội dung để xem hoạt động tại đây
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Khám phá nội dung
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
