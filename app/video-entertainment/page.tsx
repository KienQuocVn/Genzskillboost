"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, Heart, MessageCircle, Share, TrendingUp, Clock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainLayout } from "@/components/layout/main-layout"
import { supabase } from "@/lib/supabase"
// import { getCloudFrontUrl } from "@/lib/cloudfront"
import type { Video } from "@/types"

// interface VideoWithUser extends Video {
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
// }

export default function VideoEntertainmentPage() {
  // const [videos, setVideos] = useState<VideoWithUser[]>([])
  // const [trendingVideos, setTrendingVideos] = useState<VideoWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("feed")
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  useEffect(() => {
    fetchVideos()
    fetchTrendingVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          *,
          user:users(id, name, avatar_url),
          likes:video_likes(count),
          comments:video_comments(count),
          views:video_views(count)
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      // setVideos(data || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
    }
  }

  const fetchTrendingVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          *,
          user:users(id, name, avatar_url),
          likes:video_likes(count),
          comments:video_comments(count),
          views:video_views(count)
        `)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("view_count", { ascending: false })
        .limit(5)

      if (error) throw error
      // setTrendingVideos(data || [])
    } catch (error) {
      console.error("Error fetching trending videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoPlay = useCallback((videoId: string) => {
    // Pause all other videos
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (id !== videoId && video) {
        video.pause()
      }
    })
    setPlayingVideo(videoId)
  }, [])

  const handleVideoToggle = useCallback(
    (videoId: string) => {
      const video = videoRefs.current[videoId]
      if (!video) return

      if (video.paused) {
        handleVideoPlay(videoId)
        video.play()
      } else {
        video.pause()
        setPlayingVideo(null)
      }
    },
    [handleVideoPlay],
  )

  const handleLike = async (videoId: string) => {
    try {
      const { error } = await supabase.from("video_likes").upsert({ video_id: videoId, user_id: "current-user-id" })

      if (error) throw error
      // Refresh video data
      fetchVideos()
    } catch (error) {
      console.error("Error liking video:", error)
    }
  }

  // const VideoCard = ({ video, isCompact = false }: { video: VideoWithUser; isCompact?: boolean }) => (
  //   <Card
  //     className={`group overflow-hidden border-0 bg-black/90 text-white ${isCompact ? "h-32" : "h-[600px]"} relative`}
  //   >
  //     <div className="relative w-full h-full">
  //       <video
  //         ref={(el) => {
  //           if (el) videoRefs.current[video.id] = el
  //         }}
  //         className="w-full h-full object-cover"
  //         poster={video.thumbnail_url ? getCloudFrontUrl(video.thumbnail_url) : "/placeholder.svg?height=600&width=400"}
  //         loop
  //         muted
  //         playsInline
  //         onPlay={() => setPlayingVideo(video.id)}
  //         onPause={() => setPlayingVideo(null)}
  //       >
  //         <source src={getCloudFrontUrl(video.video_url)} type="video/mp4" />
  //       </video>

  //       {/* Play/Pause Overlay */}
  //       <div
  //         className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
  //         onClick={() => handleVideoToggle(video.id)}
  //       >
  //         <Button size="lg" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 rounded-full w-16 h-16">
  //           {playingVideo === video.id ? (
  //             <Pause className="h-8 w-8 text-white" />
  //           ) : (
  //             <Play className="h-8 w-8 text-white ml-1" />
  //           )}
  //         </Button>
  //       </div>

  //       {/* Video Info Overlay */}
  //       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
  //         <div className="flex items-end justify-between">
  //           <div className="flex-1 min-w-0 mr-4">
  //             <div className="flex items-center space-x-2 mb-2">
  //               <Avatar className="h-8 w-8 border-2 border-white/20">
  //                 <AvatarImage src={video.user.avatar_url || "/placeholder.svg"} />
  //                 <AvatarFallback className="bg-genz-purple text-white text-xs">
  //                   {video.user.name.charAt(0).toUpperCase()}
  //                 </AvatarFallback>
  //               </Avatar>
  //               <span className="text-sm font-medium">{video.user.name}</span>
  //               <Badge variant="secondary" className="bg-white/20 text-white text-xs">
  //                 {video.category}
  //               </Badge>
  //             </div>

  //             <h3 className="font-semibold text-lg line-clamp-2 mb-1">{video.title}</h3>

  //             {video.description && <p className="text-sm text-white/80 line-clamp-2 mb-2">{video.description}</p>}

  //             <div className="flex items-center space-x-4 text-xs text-white/60">
  //               <span className="flex items-center space-x-1">
  //                 <Eye className="h-3 w-3" />
  //                 <span>{video._count.views.toLocaleString()}</span>
  //               </span>
  //               <span className="flex items-center space-x-1">
  //                 <Clock className="h-3 w-3" />
  //                 <span>
  //                   {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
  //                 </span>
  //               </span>
  //             </div>
  //           </div>

  //           {/* Action Buttons */}
  //           <div className="flex flex-col space-y-3">
  //             <Button
  //               size="sm"
  //               variant="ghost"
  //               className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-0 rounded-full w-12 h-12 p-0"
  //               onClick={() => handleLike(video.id)}
  //             >
  //               <Heart className="h-5 w-5 text-white" />
  //             </Button>
  //             <span className="text-xs text-center text-white/80">{video._count.likes}</span>

  //             <Button
  //               size="sm"
  //               variant="ghost"
  //               className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-0 rounded-full w-12 h-12 p-0"
  //             >
  //               <MessageCircle className="h-5 w-5 text-white" />
  //             </Button>
  //             <span className="text-xs text-center text-white/80">{video._count.comments}</span>

  //             <Button
  //               size="sm"
  //               variant="ghost"
  //               className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-0 rounded-full w-12 h-12 p-0"
  //             >
  //               <Share className="h-5 w-5 text-white" />
  //             </Button>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </Card>
  // )

  // const TrendingVideoCard = ({ video, rank }: { video: VideoWithUser; rank: number }) => (
  //   <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
  //     <CardContent className="p-4">
  //       <div className="flex items-center space-x-3">
  //         <div className="flex-shrink-0">
  //           <div className="relative">
  //             <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
  //               <img
  //                 src={
  //                   video.thumbnail_url ? getCloudFrontUrl(video.thumbnail_url) : "/placeholder.svg?height=64&width=64"
  //                 }
  //                 alt={video.title}
  //                 className="w-full h-full object-cover"
  //               />
  //             </div>
  //             <div className="absolute -top-2 -left-2 bg-gradient-to-r from-genz-purple to-genz-pink text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
  //               {rank}
  //             </div>
  //           </div>
  //         </div>

  //         <div className="flex-1 min-w-0">
  //           <h4 className="font-medium line-clamp-1 group-hover:text-genz-purple transition-colors">{video.title}</h4>
  //           <div className="flex items-center space-x-2 mt-1">
  //             <Avatar className="h-4 w-4">
  //               <AvatarImage src={video.user.avatar_url || "/placeholder.svg"} />
  //               <AvatarFallback className="text-xs">{video.user.name.charAt(0).toUpperCase()}</AvatarFallback>
  //             </Avatar>
  //             <span className="text-xs text-muted-foreground">{video.user.name}</span>
  //           </div>

  //           <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
  //             <span className="flex items-center space-x-1">
  //               <Eye className="h-3 w-3" />
  //               <span>{video._count.views.toLocaleString()}</span>
  //             </span>
  //             <span className="flex items-center space-x-1">
  //               <Heart className="h-3 w-3" />
  //               <span>{video._count.likes}</span>
  //             </span>
  //           </div>
  //         </div>
  //       </div>
  //     </CardContent>
  //   </Card>
  // )

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-black/5 via-white to-genz-purple/5">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-genz-purple to-genz-pink bg-clip-text text-transparent">
                  Video giải trí 🎬
                </h1>
                <p className="text-muted-foreground mt-1">Khám phá video ngắn sáng tạo từ cộng đồng Gen Z</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="feed">Dành cho bạn</TabsTrigger>
              <TabsTrigger value="trending">Xu hướng</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Feed */}
                <div className="lg:col-span-2">
                  {loading ? (
                    <div className="space-y-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[600px] bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* {videos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))} */}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-genz-purple/10 to-genz-pink/10 border-0">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-genz-purple" />
                        Top trending hôm nay
                      </h3>
                      <div className="space-y-3">
                        {/* {trendingVideos.slice(0, 3).map((video, index) => (
                          <TrendingVideoCard key={video.id} video={video} rank={index + 1} />
                        ))} */}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Thống kê</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Video hôm nay</span>
                          <span className="font-medium">1.2K</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Lượt xem</span>
                          <span className="font-medium">2.5M</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Người tạo</span>
                          <span className="font-medium">856</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trending" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-genz-purple" />
                  Video xu hướng 24h qua
                </h2>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* {trendingVideos.map((video, index) => (
                      <div key={video.id} className="relative">
                        <VideoCard video={video} isCompact />
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-genz-purple to-genz-pink text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </div>
                      </div>
                    ))} */}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
