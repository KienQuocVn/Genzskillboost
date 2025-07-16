"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, X, Play, Pause, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { uploadToS3 } from "@/lib/aws-s3"

const videoSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(100, "Tiêu đề không được quá 100 ký tự"),
  description: z.string().max(500, "Mô tả không được quá 500 ký tự").optional(),
  tags: z.array(z.string()).max(10, "Không được quá 10 tags"),
})

type VideoFormData = z.infer<typeof videoSchema>

interface UploadProgress {
  video: number
  thumbnail: number
  metadata: number
}

export function VideoUpload() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTag, setCurrentTag] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ video: 0, thumbnail: 0, metadata: 0 })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  // Add resumable upload state
  const [resumableUploadId, setResumableUploadId] = useState<string | null>(null)
  const [uploadPaused, setUploadPaused] = useState(false)
  // Add thumbnail generation options
  const [thumbnailOptions, setThumbnailOptions] = useState<string[]>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      tags: [],
    },
  })

  const watchedTags = watch("tags")

  // Enhanced video validation
  const validateVideo = (video: HTMLVideoElement): boolean => {
    const duration = video.duration

    if (duration < 15) {
      toast({
        title: "Lỗi",
        description: "Video phải có độ dài ít nhất 15 giây",
        variant: "destructive",
      })
      return false
    }

    if (duration > 60) {
      toast({
        title: "Lỗi",
        description: "Video không được dài quá 60 giây",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Add resumable upload function
  const resumableVideoUpload = async (file: File, fileName: string): Promise<string> => {
    try {
      // Check for existing upload session
      let uploadId = resumableUploadId

      if (!uploadId) {
        const initResponse = await fetch("/api/upload/resumable/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            fileSize: file.size,
            fileType: file.type,
          }),
        })

        const { uploadId: newUploadId } = await initResponse.json()
        uploadId = newUploadId
        setResumableUploadId(uploadId)
      }

      // Upload with resume capability
      const CHUNK_SIZE = 1024 * 1024 // 1MB chunks for video
      let uploadedBytes = 0

      // Check existing progress
      const statusResponse = await fetch(`/api/upload/resumable/status/${uploadId}`)
      const { uploadedBytes: existingBytes } = await statusResponse.json()
      uploadedBytes = existingBytes || 0

      while (uploadedBytes < file.size && !uploadPaused) {
        const chunk = file.slice(uploadedBytes, uploadedBytes + CHUNK_SIZE)

        const uploadResponse = await fetch("/api/upload/resumable/chunk", {
          method: "POST",
          // headers: {
          //   "Content-Type": "application/octet-stream",
          //   "X-Upload-Id": uploadId,
          //   "X-Chunk-Start": uploadedBytes.toString(),
          //   "X-Chunk-Size": chunk.size.toString(),
          // },
          body: chunk,
        })

        if (!uploadResponse.ok) {
          throw new Error("Chunk upload failed")
        }

        uploadedBytes += chunk.size
        const progress = (uploadedBytes / file.size) * 100
        setUploadProgress((prev) => ({ ...prev, video: progress }))
      }

      if (uploadPaused) {
        throw new Error("Upload paused")
      }

      // Finalize upload
      const finalizeResponse = await fetch(`/api/upload/resumable/finalize/${uploadId}`, {
        method: "POST",
      })

      const { url } = await finalizeResponse.json()
      setResumableUploadId(null)

      return url
    } catch (error) {
      console.error("Resumable upload error:", error)
      throw error
    }
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file video hợp lệ",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "File video không được vượt quá 100MB",
        variant: "destructive",
      })
      return
    }

    setSelectedVideo(file)
    const url = URL.createObjectURL(file)
    setVideoPreview(url)

    // Get video duration and validate
    const video = document.createElement("video")
    video.src = url
    video.onloadedmetadata = () => {
      const duration = video.duration
      setVideoDuration(duration)

      if (!validateVideo(video)) {
        setSelectedVideo(null)
        setVideoPreview(null)
        URL.revokeObjectURL(url)
        return
      }

      // Generate thumbnail
      generateMultipleThumbnails(video)
    }
  }

  const generateMultipleThumbnails = (video: HTMLVideoElement) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const thumbnails: string[] = []
    const timePoints = [0.1, 0.3, 0.5, 0.7, 0.9] // Generate at different time points

    let currentIndex = 0

    const generateNext = () => {
      if (currentIndex >= timePoints.length) {
        setThumbnailOptions(thumbnails)
        setSelectedThumbnail(thumbnails[2]) // Default to middle thumbnail
        return
      }

      video.currentTime = video.duration * timePoints[currentIndex]

      video.onseeked = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const thumbnailUrl = URL.createObjectURL(blob)
              thumbnails.push(thumbnailUrl)
              currentIndex++
              generateNext()
            }
          },
          "image/jpeg",
          0.8,
        )
      }
    }

    generateNext()
  }

  const generateThumbnail = (video: HTMLVideoElement) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    video.currentTime = video.duration / 2 // Middle of video

    video.onseeked = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob)
            setThumbnailPreview(thumbnailUrl)
          }
        },
        "image/jpeg",
        0.8,
      )
    }
  }

  const handlePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const addTag = () => {
    if (currentTag.trim() && !watchedTags.includes(currentTag.trim())) {
      const newTags = [...watchedTags, currentTag.trim()]
      setValue("tags", newTags)
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter((tag) => tag !== tagToRemove)
    setValue("tags", newTags)
  }

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    if (selectedThumbnail) URL.revokeObjectURL(selectedThumbnail)
    thumbnailOptions.forEach(URL.revokeObjectURL)

    setSelectedVideo(null)
    setVideoPreview(null)
    setThumbnailPreview(null)
    setThumbnailOptions([])
    setSelectedThumbnail("")
    setIsPlaying(false)
    setVideoDuration(0)
  }

  const onSubmit = async (data: VideoFormData) => {
    if (!selectedVideo || !selectedThumbnail) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn video để tải lên",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress({ video: 0, thumbnail: 0, metadata: 0 })

    try {
      // Upload video to S3
      setUploadProgress((prev) => ({ ...prev, video: 10 }))
      const videoFileName = `videos/${Date.now()}-${selectedVideo.name}`
      //const videoUrl = await uploadToS3(selectedVideo, videoFileName)
      const videoUrl = await resumableVideoUpload(selectedVideo, videoFileName)
      setUploadProgress((prev) => ({ ...prev, video: 100 }))

      // Upload thumbnail to S3
      setUploadProgress((prev) => ({ ...prev, thumbnail: 10 }))
      const thumbnailBlob = await fetch(selectedThumbnail).then((r) => r.blob())
      const thumbnailFileName = `thumbnails/${Date.now()}-thumbnail.jpg`
      const thumbnailUrl = await uploadToS3(thumbnailBlob as File, thumbnailFileName)
      setUploadProgress((prev) => ({ ...prev, thumbnail: 100 }))

      // Save video metadata
      setUploadProgress((prev) => ({ ...prev, metadata: 10 }))
      const videoData = {
        title: data.title,
        description: data.description || "",
        videoUrl,
        thumbnailUrl,
        duration: Math.round(videoDuration),
        tags: data.tags,
      }

      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(videoData),
      })

      if (!response.ok) {
        throw new Error("Không thể tải video lên")
      }

      setUploadProgress((prev) => ({ ...prev, metadata: 100 }))
      setShowSuccessModal(true)

      // Reset form
      reset()
      removeVideo()

      toast({
        title: "Thành công!",
        description: "Video đã được tải lên thành công",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải video. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadPaused(false)
    }
  }

  const totalProgress = (uploadProgress.video + uploadProgress.thumbnail + uploadProgress.metadata) / 3

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-genz-pink to-genz-purple bg-clip-text text-transparent">
            Tải video lên 🎬
          </CardTitle>
          <p className="text-muted-foreground">Chia sẻ khoảnh khắc thú vị với cộng đồng Gen Z</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Video Upload */}
            <div className="space-y-4">
              <Label>Video (15-60 giây, tối đa 100MB) *</Label>

              {!selectedVideo ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <Label htmlFor="video-upload" className="cursor-pointer">
                        <span className="text-genz-pink hover:text-genz-pink/80 font-medium">Chọn video</span>
                      </Label>
                      <Input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoSelect}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">MP4, MOV, AVI được hỗ trợ</p>
                  </div>
                </div>
              ) : (
                <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-xs mx-auto">
                  <video
                    ref={videoRef}
                    src={videoPreview || ""}
                    className="w-full h-full object-cover"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />

                  {/* Video Controls */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handlePlayPause}
                      className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full h-12 w-12"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
                    </Button>
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                    <span className="text-white text-xs">{Math.round(videoDuration)}s</span>
                  </div>
                </div>
              )}
            </div>

            {selectedVideo && (
              <>
                {thumbnailOptions.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium mb-2 block">Chọn ảnh thumbnail:</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {thumbnailOptions.map((thumbnail, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedThumbnail(thumbnail)}
                          className={`aspect-video rounded border-2 overflow-hidden ${
                            selectedThumbnail === thumbnail ? "border-genz-pink" : "border-muted"
                          }`}
                        >
                          <img
                            src={thumbnail || "/placeholder.svg"}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Video Info */}

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề *</Label>
                  <Input
                    id="title"
                    placeholder="Mô tả ngắn gọn về video của bạn..."
                    {...register("title")}
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả (tùy chọn)</Label>
                  <Textarea
                    id="description"
                    placeholder="Chia sẻ thêm về video này..."
                    rows={3}
                    {...register("description")}
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Hashtags</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="VD: dance, funny, trending"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Thêm
                    </Button>
                  </div>

                  {/* Display Tags */}
                  {watchedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchedTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-genz-pink/10 text-genz-pink">
                          #{tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0 text-genz-pink hover:text-genz-pink/80"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {errors.tags && <p className="text-sm text-destructive">{errors.tags.message}</p>}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Đang tải video...</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{Math.round(totalProgress)}%</span>
                        {resumableUploadId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadPaused(!uploadPaused)}
                          >
                            {uploadPaused ? "Tiếp tục" : "Tạm dừng"}
                          </Button>
                        )}
                      </div>
                    </div>
                    <Progress value={totalProgress} className="h-2" />

                    {/* Enhanced progress details */}
                    <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <div
                          className={`w-2 h-2 rounded-full ${uploadProgress.video === 100 ? "bg-green-500" : uploadProgress.video > 0 ? "bg-blue-500" : "bg-muted"}`}
                        />
                        <span>Video ({Math.round(uploadProgress.video)}%)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div
                          className={`w-2 h-2 rounded-full ${uploadProgress.thumbnail === 100 ? "bg-green-500" : uploadProgress.thumbnail > 0 ? "bg-blue-500" : "bg-muted"}`}
                        />
                        <span>Thumbnail ({Math.round(uploadProgress.thumbnail)}%)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div
                          className={`w-2 h-2 rounded-full ${uploadProgress.metadata === 100 ? "bg-green-500" : uploadProgress.metadata > 0 ? "bg-blue-500" : "bg-muted"}`}
                        />
                        <span>Metadata ({Math.round(uploadProgress.metadata)}%)</span>
                      </div>
                    </div>

                    {uploadPaused && (
                      <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        ⏸️ Upload đã tạm dừng. Bạn có thể tiếp tục bất cứ lúc nào.
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => reset()}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isUploading} className="bg-genz-pink hover:bg-genz-pink/90">
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      "Đăng video"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Hidden Canvas for Thumbnail Generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-genz-pink">
              <CheckCircle className="h-5 w-5" />
              <span>Video đã được đăng!</span>
            </DialogTitle>
            <DialogDescription>
              Video của bạn đã được tải lên thành công và sẽ xuất hiện trong feed của cộng đồng.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowSuccessModal(false)}>
              Đóng
            </Button>
            <Button onClick={() => (window.location.href = "/videos")}>Xem video</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
