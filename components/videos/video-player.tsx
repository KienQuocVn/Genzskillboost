"use client"

import { useEffect, useRef } from "react"
import videojs from "video.js"
import "video.js/dist/video-js.css"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  src: string
  poster?: string
  isPlaying?: boolean
  isMuted?: boolean
  className?: string
  onReady?: (player: any) => void
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

export function VideoPlayer({
  src,
  poster,
  isPlaying = false,
  isMuted = true,
  className,
  onReady,
  onPlay,
  onPause,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    if (!videoRef.current) return

    // Initialize Video.js player
    const player = videojs(videoRef.current, {
      controls: false,
      responsive: true,
      fluid: false,
      preload: "metadata",
      poster: poster,
      sources: [
        {
          src: src,
          type: "video/mp4",
        },
      ],
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      html5: {
        vhs: {
          overrideNative: true,
        },
      },
    })

    playerRef.current = player

    // Event listeners
    player.on("ready", () => {
      player.muted(isMuted)
      onReady?.(player)
    })

    player.on("play", () => {
      onPlay?.()
    })

    player.on("pause", () => {
      onPause?.()
    })

    player.on("ended", () => {
      onEnded?.()
    })

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [src, poster, isMuted, onReady, onPlay, onPause, onEnded])

  // Control playback
  useEffect(() => {
    if (!playerRef.current) return

    if (isPlaying) {
      playerRef.current.play()
    } else {
      playerRef.current.pause()
    }
  }, [isPlaying])

  // Control mute
  useEffect(() => {
    if (!playerRef.current) return
    playerRef.current.muted(isMuted)
  }, [isMuted])

  return (
    <div className={cn("video-player-wrapper", className)}>
      <video ref={videoRef} className="video-js vjs-default-skin w-full h-full" playsInline webkit-playsinline="true" />
    </div>
  )
}
