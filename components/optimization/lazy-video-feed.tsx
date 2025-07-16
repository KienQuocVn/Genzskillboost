"use client"

import { lazy, Suspense } from "react"
import { VideoSkeleton } from "@/components/videos/video-skeleton"

// Lazy load the VideoFeed component
const VideoFeed = lazy(() => import("@/components/videos/video-feed").then((module) => ({ default: module.VideoFeed })))

interface LazyVideoFeedProps {
  initialVideos?: any[]
  feedType?: "for-you" | "following" | "trending"
}

export function LazyVideoFeed(props: LazyVideoFeedProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-md mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <VideoSkeleton key={i} />
          ))}
        </div>
      }
    >
      <VideoFeed {...props} />
    </Suspense>
  )
}
