"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useInView } from "react-intersection-observer"
import { VideoCard } from "./video-card"
import { VideoSkeleton } from "./video-skeleton"
import { useToast } from "@/hooks/use-toast"
import type { Video } from "@/types"

interface VideoFeedProps {
  initialVideos?: Video[]
  feedType?: "for-you" | "following" | "trending"
}

export function VideoFeed({ initialVideos = [], feedType = "for-you" }: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const { toast } = useToast()

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px",
  })

  const videoRefs = useRef<(HTMLDivElement | null)[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Fetch more videos
  const fetchVideos = useCallback(
    async (pageNum: number) => {
      if (loading) return

      setLoading(true)
      try {
        const response = await fetch(`/api/videos?page=${pageNum}&limit=10&type=${feedType}`)
        if (!response.ok) throw new Error("Failed to fetch videos")

        const data = await response.json()
        const newVideos = data.videos

        if (newVideos.length === 0) {
          setHasMore(false)
        } else {
          setVideos((prev) => (pageNum === 1 ? newVideos : [...prev, ...newVideos]))
          setPage(pageNum + 1)
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải video. Vui lòng thử lại.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [loading, feedType, toast],
  )

  // Load more when scrolling
  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchVideos(page)
    }
  }, [inView, hasMore, loading, page, fetchVideos])

  // Video intersection observer for auto-play
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number.parseInt(entry.target.getAttribute("data-index") || "0")
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setCurrentVideoIndex(index)
          }
        })
      },
      {
        threshold: 0.5,
        rootMargin: "-10% 0px -10% 0px",
      },
    )

    videoRefs.current.forEach((ref) => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref)
      }
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [videos])

  // Handle video interactions
  const handleLike = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId ? { ...video, likesCount: data.likesCount, isLiked: data.isLiked } : video,
          ),
        )
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thực hiện hành động này",
        variant: "destructive",
      })
    }
  }

  const handleShare = async (video: Video) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description || "",
          url: `${window.location.origin}/videos/${video.id}`,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/videos/${video.id}`)
      toast({
        title: "Đã sao chép",
        description: "Link video đã được sao chép vào clipboard",
      })
    }
  }

  const handleComment = (videoId: string) => {
    // Navigate to video detail page or open comment modal
    window.location.href = `/videos/${videoId}`
  }

  if (videos.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="text-6xl mb-4">📱</div>
        <h3 className="text-xl font-semibold mb-2">Chưa có video nào</h3>
        <p className="text-muted-foreground mb-4">Hãy là người đầu tiên chia sẻ video thú vị!</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Video Feed */}
      <div className="space-y-4">
        {/* {videos.map((video, index) => (
          <div key={video.id} ref={(el) => (videoRefs.current[index] = el)} data-index={index} className="relative">
            <VideoCard
              video={video}
              isActive={index === currentVideoIndex}
              onLike={() => handleLike(video.id)}
              onShare={() => handleShare(video)}
              onComment={() => handleComment(video.id)}
            />
          </div>
        ))} */}

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <VideoSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        {hasMore && <div ref={loadMoreRef} className="h-10" />}

        {/* End of Feed */}
        {!hasMore && videos.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>🎉 Bạn đã xem hết video rồi!</p>
            <p className="text-sm mt-1">Hãy quay lại sau để xem thêm nội dung mới</p>
          </div>
        )}
      </div>
    </div>
  )
}
