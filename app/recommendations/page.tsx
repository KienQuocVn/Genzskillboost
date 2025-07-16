"use client"

import { useState, useEffect } from "react"
import { Sparkles, TrendingUp, Users, Play, Heart, MessageCircle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainLayout } from "@/components/layout/main-layout"
import { supabase } from "@/lib/supabase"
// import { getCloudFrontUrl } from "@/lib/cloudfront"
import type { Project, Video } from "@/types"

// interface RecommendedProject extends Project {
//   user: {
//     id: string
//     name: string
//     avatar_url?: string
//   }
//   _count: {
//     likes: number
//     comments: number
//   }
//   similarity_score: number
//   recommendation_reason: string
// }

// interface RecommendedVideo extends Video {
//   user: {
//     id: string
//     name: string
//     avatar_url?: string
//   }
//   _count: {
//     likes: number
//     comments: number
//     views: number
//   }
//   similarity_score: number
//   recommendation_reason: string
// }

export default function RecommendationsPage() {
  // const [recommendedProjects, setRecommendedProjects] = useState<RecommendedProject[]>([])
  // const [recommendedVideos, setRecommendedVideos] = useState<RecommendedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("projects")

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)

      // Fetch recommended projects based on user preferences
      const { data: projectsData, error: projectsError } = await supabase.rpc("get_recommended_projects", {
        user_id: "current-user-id",
        limit: 12,
      })

      if (projectsError) throw projectsError

      // Fetch recommended videos based on user preferences
      const { data: videosData, error: videosError } = await supabase.rpc("get_recommended_videos", {
        user_id: "current-user-id",
        limit: 12,
      })

      if (videosError) throw videosError

      // setRecommendedProjects(projectsData || [])
      // setRecommendedVideos(videosData || [])
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      // Fallback to regular content if recommendation system fails
      fetchFallbackContent()
    } finally {
      setLoading(false)
    }
  }

  const fetchFallbackContent = async () => {
    try {
      // Fetch popular projects as fallback
      const { data: projectsData } = await supabase
        .from("projects")
        .select(`
          *,
          user:users(id, name, avatar_url),
          likes:project_likes(count),
          comments:project_comments(count)
        `)
        .order("like_count", { ascending: false })
        .limit(12)

      // Fetch popular videos as fallback
      const { data: videosData } = await supabase
        .from("videos")
        .select(`
          *,
          user:users(id, name, avatar_url),
          likes:video_likes(count),
          comments:video_comments(count),
          views:video_views(count)
        `)
        .order("view_count", { ascending: false })
        .limit(12)

      // Add mock recommendation data
      const projectsWithRecommendation = (projectsData || []).map((project) => ({
        ...project,
        similarity_score: Math.random() * 0.4 + 0.6, // 0.6-1.0
        recommendation_reason: getRandomRecommendationReason("project"),
      }))

      const videosWithRecommendation = (videosData || []).map((video) => ({
        ...video,
        similarity_score: Math.random() * 0.4 + 0.6, // 0.6-1.0
        recommendation_reason: getRandomRecommendationReason("video"),
      }))

      // setRecommendedProjects(projectsWithRecommendation)
      // setRecommendedVideos(videosWithRecommendation)
    } catch (error) {
      console.error("Error fetching fallback content:", error)
    }
  }

  const getRandomRecommendationReason = (type: "project" | "video") => {
    const projectReasons = [
      "Dựa trên sở thích lập trình của bạn",
      "Tương tự dự án bạn đã thích",
      "Phù hợp với kỹ năng của bạn",
      "Được bạn bè đề xuất",
      "Xu hướng trong cộng đồng",
    ]

    const videoReasons = [
      "Dựa trên video bạn đã xem",
      "Tương tự nội dung bạn yêu thích",
      "Từ creator bạn theo dõi",
      "Phổ biến trong nhóm tuổi của bạn",
      "Xu hướng mới nhất",
    ]

    const reasons = type === "project" ? projectReasons : videoReasons
    return reasons[Math.floor(Math.random() * reasons.length)]
  }

  // const ProjectRecommendationCard = ({ project }: { project: RecommendedProject }) => (
  //   <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
  //     <div className="relative overflow-hidden rounded-t-lg">
  //       <img
  //         src={project.image_url ? getCloudFrontUrl(project.image_url) : "/placeholder.svg?height=200&width=300"}
  //         alt={project.title}
  //         className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
  //       />
  //       <div className="absolute top-2 left-2">
  //         <Badge className="bg-genz-purple/90 text-white text-xs">
  //           {Math.round(project.similarity_score * 100)}% phù hợp
  //         </Badge>
  //       </div>
  //       <div className="absolute top-2 right-2">
  //         <Badge variant="secondary" className="bg-white/90 text-genz-purple text-xs">
  //           {project.category}
  //         </Badge>
  //       </div>
  //     </div>

  //     <CardContent className="p-4">
  //       <div className="flex items-start justify-between mb-2">
  //         <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-genz-purple transition-colors">
  //           {project.title}
  //         </h3>
  //       </div>

  //       <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{project.description}</p>

  //       <div className="flex items-center space-x-1 mb-3">
  //         <Sparkles className="h-3 w-3 text-genz-pink" />
  //         <span className="text-xs text-genz-pink font-medium">{project.recommendation_reason}</span>
  //       </div>

  //       <div className="flex flex-wrap gap-1 mb-3">
  //         {project.tags.slice(0, 3).map((tag, index) => (
  //           <Badge key={index} variant="outline" className="text-xs">
  //             {tag}
  //           </Badge>
  //         ))}
  //       </div>

  //       <div className="flex items-center justify-between">
  //         <div className="flex items-center space-x-2">
  //           <Avatar className="h-6 w-6">
  //             <AvatarImage src={project.user.avatar_url || "/placeholder.svg"} />
  //             <AvatarFallback className="text-xs">{project.user.name.charAt(0).toUpperCase()}</AvatarFallback>
  //           </Avatar>
  //           <span className="text-sm text-muted-foreground">{project.user.name}</span>
  //         </div>

  //         <div className="flex items-center space-x-3 text-sm text-muted-foreground">
  //           <span className="flex items-center space-x-1">
  //             <Heart className="h-4 w-4" />
  //             <span>{project._count.likes}</span>
  //           </span>
  //           <span className="flex items-center space-x-1">
  //             <MessageCircle className="h-4 w-4" />
  //             <span>{project._count.comments}</span>
  //           </span>
  //         </div>
  //       </div>

  //       <Button className="w-full mt-4 bg-gradient-to-r from-genz-purple to-genz-pink hover:from-genz-purple/90 hover:to-genz-pink/90">
  //         Xem chi tiết
  //       </Button>
  //     </CardContent>
  //   </Card>
  // )

  // const VideoRecommendationCard = ({ video }: { video: RecommendedVideo }) => (
  //   <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
  //     <div className="relative overflow-hidden rounded-t-lg">
  //       <div className="relative w-full h-48 bg-black">
  //         <img
  //           src={video.thumbnail_url ? getCloudFrontUrl(video.thumbnail_url) : "/placeholder.svg?height=200&width=300"}
  //           alt={video.title}
  //           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
  //         />
  //         <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
  //           <Button
  //             size="lg"
  //             className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 rounded-full w-12 h-12 p-0"
  //           >
  //             <Play className="h-6 w-6 text-white ml-0.5" />
  //           </Button>
  //         </div>
  //       </div>

  //       <div className="absolute top-2 left-2">
  //         <Badge className="bg-genz-pink/90 text-white text-xs">
  //           {Math.round(video.similarity_score * 100)}% phù hợp
  //         </Badge>
  //       </div>
  //       <div className="absolute bottom-2 right-2">
  //         <Badge variant="secondary" className="bg-black/60 text-white text-xs">
  //           {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
  //         </Badge>
  //       </div>
  //     </div>

  //     <CardContent className="p-4">
  //       <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-genz-purple transition-colors mb-2">
  //         {video.title}
  //       </h3>

  //       {video.description && <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{video.description}</p>}

  //       <div className="flex items-center space-x-1 mb-3">
  //         <Sparkles className="h-3 w-3 text-genz-pink" />
  //         <span className="text-xs text-genz-pink font-medium">{video.recommendation_reason}</span>
  //       </div>

  //       <div className="flex items-center justify-between mb-3">
  //         <div className="flex items-center space-x-2">
  //           <Avatar className="h-6 w-6">
  //             <AvatarImage src={video.user.avatar_url || "/placeholder.svg"} />
  //             <AvatarFallback className="text-xs">{video.user.name.charAt(0).toUpperCase()}</AvatarFallback>
  //           </Avatar>
  //           <span className="text-sm text-muted-foreground">{video.user.name}</span>
  //         </div>

  //         <Badge variant="outline" className="text-xs">
  //           {video.category}
  //         </Badge>
  //       </div>

  //       <div className="flex items-center justify-between text-sm text-muted-foreground">
  //         <div className="flex items-center space-x-3">
  //           <span className="flex items-center space-x-1">
  //             <Eye className="h-4 w-4" />
  //             <span>{video._count.views.toLocaleString()}</span>
  //           </span>
  //           <span className="flex items-center space-x-1">
  //             <Heart className="h-4 w-4" />
  //             <span>{video._count.likes}</span>
  //           </span>
  //         </div>

  //         <Button
  //           size="sm"
  //           variant="outline"
  //           className="border-genz-purple text-genz-purple hover:bg-genz-purple/10 bg-transparent"
  //         >
  //           Xem ngay
  //         </Button>
  //       </div>
  //     </CardContent>
  //   </Card>
  // )

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-genz-purple/5 via-white to-genz-pink/5">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-genz-purple to-genz-pink bg-clip-text text-transparent flex items-center">
                  <Sparkles className="h-8 w-8 mr-3 text-genz-purple" />
                  Gợi ý dành cho bạn ✨
                </h1>
                <p className="text-muted-foreground mt-1">
                  Nội dung được cá nhân hóa dựa trên sở thích và hoạt động của bạn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-genz-purple/10 to-genz-purple/5 border-genz-purple/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-genz-purple/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-genz-purple" />
                  </div>
                  <div>
                    {/* <p className="text-2xl font-bold">{recommendedProjects.length}</p> */}
                    <p className="text-sm text-muted-foreground">Dự án đề xuất</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-genz-pink/10 to-genz-pink/5 border-genz-pink/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-genz-pink/20 rounded-lg">
                    <Play className="h-6 w-6 text-genz-pink" />
                  </div>
                  <div>
                    {/* <p className="text-2xl font-bold">{recommendedVideos.length}</p> */}
                    <p className="text-sm text-muted-foreground">Video đề xuất</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">95%</p>
                    <p className="text-sm text-muted-foreground">Độ chính xác</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="projects">Dự án</TabsTrigger>
              <TabsTrigger value="videos">Video</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Dự án được đề xuất cho bạn</h2>
                <Button variant="outline" size="sm">
                  Làm mới gợi ý
                </Button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg" />
                      <CardContent className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* {recommendedProjects.map((project) => (
                    <ProjectRecommendationCard key={project.id} project={project} />
                  ))} */}
                </div>
              )}

              {/* {!loading && recommendedProjects.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium mb-2">Chưa có gợi ý</h3>
                  <p className="text-muted-foreground">
                    Hãy tương tác với một số dự án để chúng tôi hiểu sở thích của bạn
                  </p>
                </div>
              )} */}
            </TabsContent>

            <TabsContent value="videos" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Video được đề xuất cho bạn</h2>
                <Button variant="outline" size="sm">
                  Làm mới gợi ý
                </Button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg" />
                      <CardContent className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* {recommendedVideos.map((video) => (
                    <VideoRecommendationCard key={video.id} video={video} />
                  ))} */}
                </div>
              )}

              {/* {!loading && recommendedVideos.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-lg font-medium mb-2">Chưa có gợi ý video</h3>
                  <p className="text-muted-foreground">Hãy xem một số video để chúng tôi hiểu sở thích của bạn</p>
                </div>
              )} */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
