"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { LazyVideoFeed } from "@/components/optimization/lazy-video-feed"
import { TrendingVideos } from "@/components/videos/trending-videos"
import { VideoUpload } from "@/components/videos/video-upload"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { MainLayout } from "@/components/layout/main-layout"

export default function VideosPage() {
  const [activeTab, setActiveTab] = useState("for-you")
  const [showUpload, setShowUpload] = useState(false)

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-genz-pink to-genz-purple bg-clip-text text-transparent">
            Video giải trí 🎬
          </h1>

          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button className="bg-genz-pink hover:bg-genz-pink/90">
                <Plus className="h-4 w-4 mr-2" />
                Tạo video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <VideoUpload />
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
              <TabsTrigger value="for-you">Dành cho bạn</TabsTrigger>
              <TabsTrigger value="following">Đang theo dõi</TabsTrigger>
              <TabsTrigger value="trending">Xu hướng</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="for-you" className="h-full overflow-y-auto p-4">
                <LazyVideoFeed feedType="for-you" />
              </TabsContent>

              <TabsContent value="following" className="h-full overflow-y-auto p-4">
                <LazyVideoFeed feedType="following" />
              </TabsContent>

              <TabsContent value="trending" className="h-full overflow-y-auto p-4">
                <TrendingVideos />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
