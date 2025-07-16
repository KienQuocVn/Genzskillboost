"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, Grid, List, Eye, Heart, MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
// import { supabase } from "@/lib/supabase"
import { useDebounce } from "@/hooks/use-debounce"
// import type { User } from "@/types/database"

interface ExploreContent {
  id: string
  type: "project" | "video"
  title: string
  description: string
  thumbnail_url: string
  created_at: string
  // user: User
  stats: {
    views: number
    likes: number
    comments: number
  }
}

interface FilterOptions {
  type: "all" | "projects" | "videos"
  sortBy: "latest" | "trending" | "popular"
  category: string
}

export default function ExplorePage() {
  const [content, setContent] = useState<ExploreContent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    sortBy: "latest",
    category: "all",
  })
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [categories, setCategories] = useState<string[]>([])

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch categories
  // useEffect(() => {
  //   const fetchCategories = async () => {
  //     try {
  //       const { data: projectCategories } = await supabase
  //         .from("projects")
  //         .select("category")
  //         .not("category", "is", null)

  //       const { data: videoCategories } = await supabase.from("videos").select("category").not("category", "is", null)

  //       // const allCategories = [
  //       //   ...new Set([
  //       //     ...(projectCategories?.map((p) => p.category) || []),
  //       //     ...(videoCategories?.map((v) => v.category) || []),
  //       //   ]),
  //       // ]

  //       // setCategories(allCategories)
  //     } catch (error) {
  //       console.error("Error fetching categories:", error)
  //     }
  //   }

  //   fetchCategories()
  // }, [])

  // Fetch content based on filters and search
  // const fetchContent = useCallback(async () => {
  //   setLoading(true)
  //   try {
  //     let projectsQuery = supabase.from("projects").select(`
  //         id,
  //         title,
  //         description,
  //         thumbnail_url,
  //         created_at,
  //         category,
  //         views,
  //         likes,
  //         user:profiles(id, username, avatar_url)
  //       `)

  //     let videosQuery = supabase.from("videos").select(`
  //         id,
  //         title,
  //         description,
  //         thumbnail_url,
  //         created_at,
  //         category,
  //         views,
  //         likes,
  //         user:profiles(id, username, avatar_url)
  //       `)

  //     // Apply search filter
  //     if (debouncedSearchQuery) {
  //       projectsQuery = projectsQuery.or(
  //         `title.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`,
  //       )
  //       videosQuery = videosQuery.or(
  //         `title.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`,
  //       )
  //     }

  //     // Apply category filter
  //     if (filters.category !== "all") {
  //       projectsQuery = projectsQuery.eq("category", filters.category)
  //       videosQuery = videosQuery.eq("category", filters.category)
  //     }

  //     // Apply sorting
  //     switch (filters.sortBy) {
  //       case "latest":
  //         projectsQuery = projectsQuery.order("created_at", { ascending: false })
  //         videosQuery = videosQuery.order("created_at", { ascending: false })
  //         break
  //       case "trending":
  //         projectsQuery = projectsQuery.order("views", { ascending: false })
  //         videosQuery = videosQuery.order("views", { ascending: false })
  //         break
  //       case "popular":
  //         projectsQuery = projectsQuery.order("likes", { ascending: false })
  //         videosQuery = videosQuery.order("likes", { ascending: false })
  //         break
  //     }

  //     // Limit results
  //     projectsQuery = projectsQuery.limit(20)
  //     videosQuery = videosQuery.limit(20)

  //     const promises = []

  //     if (filters.type === "all" || filters.type === "projects") {
  //       promises.push(projectsQuery)
  //     }

  //     if (filters.type === "all" || filters.type === "videos") {
  //       promises.push(videosQuery)
  //     }

  //     const results = await Promise.all(promises)

  //     let allContent: ExploreContent[] = []

  //     if (filters.type === "all") {
  //       const [projectsResult, videosResult] = results

  //       const projects =
  //         projectsResult.data?.map((project) => ({
  //           id: project.id,
  //           type: "project" as const,
  //           title: project.title,
  //           description: project.description,
  //           thumbnail_url: project.thumbnail_url,
  //           created_at: project.created_at,
  //           user: project.user,
  //           stats: {
  //             views: project.views || 0,
  //             likes: project.likes || 0,
  //             comments: 0, // TODO: Add comments count
  //           },
  //         })) || []

  //       const videos =
  //         videosResult.data?.map((video) => ({
  //           id: video.id,
  //           type: "video" as const,
  //           title: video.title,
  //           description: video.description,
  //           thumbnail_url: video.thumbnail_url,
  //           created_at: video.created_at,
  //           user: video.user,
  //           stats: {
  //             views: video.views || 0,
  //             likes: video.likes || 0,
  //             comments: 0, // TODO: Add comments count
  //           },
  //         })) || []

  //       allContent = [...projects, ...videos]
  //     } else if (filters.type === "projects") {
  //       const [projectsResult] = results
  //       allContent =
  //         projectsResult.data?.map((project) => ({
  //           id: project.id,
  //           type: "project" as const,
  //           title: project.title,
  //           description: project.description,
  //           thumbnail_url: project.thumbnail_url,
  //           created_at: project.created_at,
  //           user: project.user,
  //           stats: {
  //             views: project.views || 0,
  //             likes: project.likes || 0,
  //             comments: 0,
  //           },
  //         })) || []
  //     } else {
  //       const [videosResult] = results
  //       allContent =
  //         videosResult.data?.map((video) => ({
  //           id: video.id,
  //           type: "video" as const,
  //           title: video.title,
  //           description: video.description,
  //           thumbnail_url: video.thumbnail_url,
  //           created_at: video.created_at,
  //           user: video.user,
  //           stats: {
  //             views: video.views || 0,
  //             likes: video.likes || 0,
  //             comments: 0,
  //           },
  //         })) || []
  //     }

  //     // Sort mixed content by date if needed
  //     if (filters.type === "all") {
  //       allContent.sort((a, b) => {
  //         switch (filters.sortBy) {
  //           case "latest":
  //             return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  //           case "trending":
  //           case "popular":
  //             return b.stats.views - a.stats.views
  //           default:
  //             return 0
  //         }
  //       })
  //     }

  //     setContent(allContent)
  //   } catch (error) {
  //     console.error("Error fetching content:", error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }, [debouncedSearchQuery, filters])

  // useEffect(() => {
  //   fetchContent()
  // }, [fetchContent])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Vừa xong"
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} ngày trước`
    return date.toLocaleDateString("vi-VN")
  }

  const ContentCard = ({ item }: { item: ExploreContent }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="relative aspect-video">
        <Image
          src={item.thumbnail_url || "/placeholder.svg?height=200&width=300"}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              item.type === "project"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                : "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300"
            }`}
          >
            {item.type === "project" ? "Dự án" : "Video"}
          </span>
        </div>
        <div className="absolute bottom-2 right-2 flex items-center space-x-2 text-white text-xs">
          <div className="flex items-center space-x-1 bg-black/50 rounded px-2 py-1">
            <Eye className="w-3 h-3" />
            <span>{item.stats.views}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          {/* <Image
            src={item.user?.avatar_url || "/placeholder.svg?height=24&width=24"}
            alt={item.user?.username || "User"}
            width={24}
            height={24}
            className="rounded-full"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">{item.user?.username}</span> */}
          <span className="text-xs text-gray-500">{formatTimeAgo(item.created_at)}</span>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{item.title}</h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{item.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{item.stats.likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{item.stats.comments}</span>
            </div>
          </div>

          <Link
            href={`/${item.type === "project" ? "projects" : "videos"}/${item.id}`}
            className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            Xem thêm
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Khám phá</h1>
          <p className="text-gray-600 dark:text-gray-400">Tìm hiểu những dự án và video mới nhất từ cộng đồng</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm dự án, video..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Content Type Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filters.type}
                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as FilterOptions["type"] }))}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tất cả</option>
                <option value="projects">Dự án</option>
                <option value="videos">Video</option>
              </select>
            </div>

            {/* Sort Filter */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as FilterOptions["sortBy"] }))}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="latest">Mới nhất</option>
              <option value="trending">Thịnh hành</option>
              <option value="popular">Phổ biến</option>
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300" : "text-gray-500"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300" : "text-gray-500"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : content.length > 0 ? (
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 lg:grid-cols-2"
            }`}
          >
            {content.map((item) => (
              <ContentCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy kết quả</h3>
            <p className="text-gray-600 dark:text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          </div>
        )}
      </div>
    </div>
  )
}
