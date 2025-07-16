"use client"

import { useState } from "react"
import { Heart, MessageCircle, Share, Play, Volume2, VolumeX } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "./video-player"
import { formatNumber, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Video } from "@/types"

interface VideoCardProps {
  video: Video
  isActive: boolean
  onLike: () => void
  onShare: () => void
  onComment: () => void
}

export function VideoCard({ video, isActive, onLike, onShare, onComment }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden aspect-[9/16] max-h-[80vh]">
      {/* Video Player */}
      <div
        className="relative w-full h-full cursor-pointer"
        onClick={handlePlayPause}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <VideoPlayer
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          isPlaying={isActive && isPlaying}
          isMuted={isMuted}
          className="w-full h-full object-cover"
        />

        {/* Play/Pause Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity",
            showControls || !isPlaying ? "opacity-100" : "opacity-0",
          )}
        >
          {!isPlaying && (
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          )}
        </div>

        {/* Video Controls */}
        <div className={cn("absolute top-4 right-4 transition-opacity", showControls ? "opacity-100" : "opacity-0")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleMuteToggle()
            }}
            className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Video Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
        <div className="flex items-end justify-between">
          {/* Left Side - Video Info */}
          <div className="flex-1 mr-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={video.user?.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-genz-purple text-white">
                  {video.user?.fullName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold text-sm">{video.user?.fullName}</p>
                <p className="text-white/70 text-xs">@{video.user?.username}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                Theo dõi
              </Button>
            </div>

            {/* Video Title & Description */}
            <div className="space-y-1">
              <h3 className="text-white font-semibold text-sm line-clamp-2">{video.title}</h3>
              {video.description && <p className="text-white/80 text-xs line-clamp-2">{video.description}</p>}
            </div>

            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {video.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-genz-cyan text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Video Stats */}
            <div className="flex items-center space-x-4 mt-2 text-white/70 text-xs">
              <span>{formatNumber(video.viewsCount)} lượt xem</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex flex-col space-y-4">
            {/* Like Button */}
            <div className="flex flex-col items-center">
              {/* <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onLike()
                }}
                className={cn(
                  "bg-black/20 backdrop-blur-sm hover:bg-black/40 rounded-full h-12 w-12",
                  video.isLiked ? "text-red-500" : "text-white",
                )}
              >
                <Heart className={cn("h-6 w-6", video.isLiked && "fill-current")} />
              </Button> */}
              <span className="text-white text-xs mt-1">{formatNumber(video.likesCount)}</span>
            </div>

            {/* Comment Button */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onComment()
                }}
                className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 rounded-full h-12 w-12"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs mt-1">{formatNumber(video.commentsCount)}</span>
            </div>

            {/* Share Button */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onShare()
                }}
                className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 rounded-full h-12 w-12"
              >
                <Share className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs mt-1">Chia sẻ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
