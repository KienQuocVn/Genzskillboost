"use client"

import { useState, useEffect } from "react"
import { Plus, MessageSquare, TrendingUp, Users, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectUpload } from "@/components/skills/project-upload"
import { MainLayout } from "@/components/layout/main-layout"
// import { supabase } from "@/lib/supabase"
// import { getCloudFrontUrl } from "@/lib/cloudfront"
// import type { Project, ForumThread } from "@/types"

// interface ProjectWithUser extends Project {
//   user: {
//     id: string
//     name: string
//     avatar_url?: string
//   }
//   _count: {
//     likes: number
//     comments: number
//   }
// }

// interface ThreadWithUser extends ForumThread {
//   user: {
//     id: string
//     name: string
//     avatar_url?: string
//   }
//   _count: {
//     replies: number
//   }
// }

export default function SkillsCommunityPage() {
  // const [projects, setProjects] = useState<ProjectWithUser[]>([])
  // const [threads, setThreads] = useState<ThreadWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("projects")
  const [showCreateProject, setShowCreateProject] = useState(false)

  // useEffect(() => {
  //   fetchData()
  // }, [])

  // const fetchData = async () => {
  //   try {
  //     setLoading(true)

  //     // Fetch projects with user data and counts
  //     const { data: projectsData, error: projectsError } = await supabase
  //       .from("projects")
  //       .select(`
  //         *,
  //         user:users(id, name, avatar_url),
  //         likes:project_likes(count),
  //         comments:project_comments(count)
  //       `)
  //       .order("created_at", { ascending: false })
  //       .limit(12)

  //     if (projectsError) throw projectsError

  //     // Fetch forum threads with user data and reply counts
  //     const { data: threadsData, error: threadsError } = await supabase
  //       .from("forum_threads")
  //       .select(`
  //         *,
  //         user:users(id, name, avatar_url),
  //         replies:forum_replies(count)
  //       `)
  //       .order("updated_at", { ascending: false })
  //       .limit(8)

  //     if (threadsError) throw threadsError

  //     // setProjects(projectsData || [])
  //     // setThreads(threadsData || [])
  //   } catch (error) {
  //     console.error("Error fetching data:", error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const filteredProjects = projects.filter(
  //   (project) =>
  //     project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     project.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  // )

  // const ProjectCard = ({ project }: { project: ProjectWithUser }) => (
  //   <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
  //     <div className="relative overflow-hidden rounded-t-lg">
  //       <img
  //         src={project.image_url ? getCloudFrontUrl(project.image_url) : "/placeholder.svg?height=200&width=300"}
  //         alt={project.title}
  //         className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
  //       />
  //       <div className="absolute top-2 right-2">
  //         <Badge variant="secondary" className="bg-genz-purple/90 text-white">
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

  //       <div className="flex flex-wrap gap-1 mb-3">
  //         {project.tags.slice(0, 3).map((tag, index) => (
  //           <Badge key={index} variant="outline" className="text-xs">
  //             {tag}
  //           </Badge>
  //         ))}
  //         {project.tags.length > 3 && (
  //           <Badge variant="outline" className="text-xs">
  //             +{project.tags.length - 3}
  //           </Badge>
  //         )}
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
  //             <TrendingUp className="h-4 w-4" />
  //             <span>{project._count.likes}</span>
  //           </span>
  //           <span className="flex items-center space-x-1">
  //             <MessageSquare className="h-4 w-4" />
  //             <span>{project._count.comments}</span>
  //           </span>
  //         </div>
  //       </div>
  //     </CardContent>
  //   </Card>
  // )

  // const ThreadCard = ({ thread }: { thread: ThreadWithUser }) => (
  //   <Card className="hover:shadow-md transition-shadow border-0 bg-white/60 backdrop-blur-sm">
  //     <CardContent className="p-4">
  //       <div className="flex items-start space-x-3">
  //         <Avatar className="h-8 w-8 mt-1">
  //           <AvatarImage src={thread.user.avatar_url || "/placeholder.svg"} />
  //           <AvatarFallback className="text-xs">{thread.user.name.charAt(0).toUpperCase()}</AvatarFallback>
  //         </Avatar>

  //         <div className="flex-1 min-w-0">
  //           <h4 className="font-medium line-clamp-1 hover:text-genz-purple transition-colors cursor-pointer">
  //             {thread.title}
  //           </h4>
  //           <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{thread.content}</p>

  //           <div className="flex items-center justify-between mt-3">
  //             <div className="flex items-center space-x-2 text-xs text-muted-foreground">
  //               <span>{thread.user.name}</span>
  //               <span>•</span>
  //               <span>{new Date(thread.created_at).toLocaleDateString("vi-VN")}</span>
  //             </div>

  //             <div className="flex items-center space-x-1 text-xs text-muted-foreground">
  //               <MessageSquare className="h-3 w-3" />
  //               <span>{thread._count.replies} phản hồi</span>
  //             </div>
  //           </div>
  //         </div>
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-genz-purple to-genz-pink bg-clip-text text-transparent">
                  Kỹ năng & Cộng đồng 🚀
                </h1>
                <p className="text-muted-foreground mt-1">Khám phá dự án sáng tạo và kết nối với cộng đồng Gen Z</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm dự án..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-genz-purple to-genz-pink hover:from-genz-purple/90 hover:to-genz-pink/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo dự án
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <ProjectUpload />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="projects" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Dự án</span>
              </TabsTrigger>
              <TabsTrigger value="forum" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Diễn đàn</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-r from-genz-purple/10 to-genz-purple/5 border-genz-purple/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-genz-purple/20 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-genz-purple" />
                      </div>
                      <div>
                        {/* <p className="text-2xl font-bold">{projects.length}</p> */}
                        <p className="text-sm text-muted-foreground">Dự án mới</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-genz-pink/10 to-genz-pink/5 border-genz-pink/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-genz-pink/20 rounded-lg">
                        <Users className="h-6 w-6 text-genz-pink" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">1.2K</p>
                        <p className="text-sm text-muted-foreground">Thành viên</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">856</p>
                        <p className="text-sm text-muted-foreground">Thảo luận</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Projects Grid */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Dự án nổi bật</h2>
                  <Button variant="outline" size="sm">
                    Xem tất cả
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
                    {/* {filteredProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))} */}
                  </div>
                )}

                {/* {!loading && filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium mb-2">Không tìm thấy dự án</h3>
                    <p className="text-muted-foreground">Thử tìm kiếm với từ khóa khác hoặc tạo dự án mới</p>
                  </div>
                )} */}
              </div>
            </TabsContent>

            <TabsContent value="forum" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Forum Threads */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Thảo luận gần đây</h2>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo chủ đề
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                              <div className="flex space-x-3">
                                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                                  <div className="h-3 bg-gray-200 rounded w-full" />
                                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      : threads.map((thread) => <ThreadCard key={thread.id} thread={thread} />)} */}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-genz-purple/10 to-genz-pink/10 border-0">
                    <CardHeader>
                      <CardTitle className="text-lg">Tham gia cộng đồng</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Kết nối với hàng nghìn bạn trẻ Gen Z, chia sẻ kinh nghiệm và học hỏi lẫn nhau.
                      </p>
                      <Button className="w-full bg-gradient-to-r from-genz-purple to-genz-pink">
                        <Users className="h-4 w-4 mr-2" />
                        Tham gia ngay
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Chủ đề hot</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        "Học lập trình từ đâu?",
                        "Kinh nghiệm thực tập",
                        "Startup ở tuổi 20",
                        "Kỹ năng mềm cần thiết",
                      ].map((topic, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 text-sm hover:text-genz-purple cursor-pointer"
                        >
                          <span className="text-genz-pink">#</span>
                          <span>{topic}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
