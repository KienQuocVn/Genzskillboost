"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, X, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { uploadToS3 } from "@/lib/aws-s3"
import type { ProjectCategory } from "@/types"
import { Progress } from "@/components/ui/progress"

const projectSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(100, "Tiêu đề không được quá 100 ký tự"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự").max(1000, "Mô tả không được quá 1000 ký tự"),
  category: z.string().min(1, "Vui lòng chọn danh mục"),
  tags: z.array(z.string()).min(1, "Vui lòng thêm ít nhất 1 tag").max(10, "Không được quá 10 tags"),
})

type ProjectFormData = z.infer<typeof projectSchema>

const categories: { value: ProjectCategory; label: string }[] = [
  { value: "web-development", label: "Phát triển Web" },
  { value: "mobile-development", label: "Phát triển Mobile" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
  { value: "content-creation", label: "Sáng tạo nội dung" },
  { value: "business", label: "Kinh doanh" },
  { value: "other", label: "Khác" },
]

export function ProjectUpload() {
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const { toast } = useToast()
  // Add new state for chunked upload
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isChunkedUpload, setIsChunkedUpload] = useState(false)
  // Add validation state
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      tags: [],
    },
  })

  const watchedTags = watch("tags")

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      toast({
        title: "Lỗi",
        description: "Chỉ được tải lên tối đa 5 hình ảnh",
        variant: "destructive",
      })
      return
    }

    const newImages = [...images, ...files]
    setImages(newImages)

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setImagePreviews([...imagePreviews, ...newPreviews])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index])

    setImages(newImages)
    setImagePreviews(newPreviews)
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

  // Add real-time validation function
  const validateField = (field: string, value: any) => {
    const errors: { [key: string]: string } = {}

    switch (field) {
      case "title":
        if (!value || value.length < 1) errors.title = "Tiêu đề là bắt buộc"
        else if (value.length > 100) errors.title = "Tiêu đề không được quá 100 ký tự"
        break
      case "description":
        if (value && value.length > 1000) errors.description = "Mô tả không được quá 1000 ký tự"
        else if (!value || value.length < 10) errors.description = "Mô tả phải có ít nhất 10 ký tự"
        break
      case "images":
        if (!value || value.length === 0) errors.images = "Vui lòng tải lên ít nhất 1 hình ảnh"
        else if (value.length > 5) errors.images = "Chỉ được tải lên tối đa 5 hình ảnh"
        break
    }

    setValidationErrors((prev) => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  // Replace the existing uploadToS3 call with chunked upload function:
  const uploadFileInChunks = async (file: File, fileName: string): Promise<string> => {
    const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    if (file.size > 50 * 1024 * 1024) {
      // Files larger than 50MB use chunked upload
      setIsChunkedUpload(true)

      // Initialize multipart upload
      const initResponse = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, fileType: file.type }),
      })

      const { uploadId, key } = await initResponse.json()
      const parts = []

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        const partResponse = await fetch("/api/upload/part", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadId,
            key,
            partNumber: i + 1,
            chunk: await chunk.arrayBuffer(),
          }),
        })

        const { etag } = await partResponse.json()
        parts.push({ ETag: etag, PartNumber: i + 1 })

        // Update progress
        const progress = ((i + 1) / totalChunks) * 100
        setUploadProgress((prev) => ({ ...prev, [fileName]: progress }))
      }

      // Complete multipart upload
      const completeResponse = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, key, parts }),
      })

      const { location } = await completeResponse.json()
      return location
    } else {
      // Use regular upload for smaller files
      return await uploadToS3(file, fileName)
    }
  }

  const onSubmit = async (data: ProjectFormData) => {
    if (images.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng tải lên ít nhất 1 hình ảnh",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Upload images to S3
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const fileName = `projects/${Date.now()}-${image.name}`
          return await uploadFileInChunks(image, fileName)
        }),
      )

      // Submit project data
      const projectData = {
        ...data,
        images: imageUrls,
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        throw new Error("Không thể tạo dự án")
      }

      setShowSuccessModal(true)
      reset()
      setImages([])
      setImagePreviews([])
      setUploadProgress({})

      toast({
        title: "Thành công!",
        description: "Dự án đã được tạo thành công",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo dự án. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-genz-purple to-genz-pink bg-clip-text text-transparent">
            Đăng dự án mới 🚀
          </CardTitle>
          <p className="text-muted-foreground">Chia sẻ dự án của bạn với cộng đồng Gen Z Việt Nam</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề dự án *</Label>
              <Input
                id="title"
                placeholder="VD: Website bán hàng online với React"
                {...register("title")}
                onBlur={(e) => validateField("title", e.target.value)}
                className={errors.title || validationErrors.title ? "border-destructive" : ""}
              />
              {(errors.title || validationErrors.title) && (
                <p className="text-sm text-destructive">{errors.title?.message || validationErrors.title}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Danh mục *</Label>
              <Select onValueChange={(value) => setValue("category", value)}>
                <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder="Chọn danh mục dự án" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả dự án *</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chi tiết về dự án, công nghệ sử dụng, tính năng chính..."
                rows={4}
                {...register("description")}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Hình ảnh dự án * (Tối đa 5 ảnh)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Label htmlFor="images" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-genz-purple hover:text-genz-purple/80">
                        Chọn hình ảnh
                      </span>
                    </Label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">PNG, JPG, GIF tối đa 10MB mỗi file</p>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {isUploading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {isChunkedUpload ? "Đang tải lên (phân mảnh)..." : "Đang tải lên..."}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Object.keys(uploadProgress).length > 0
                      ? `${Math.round(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / Object.keys(uploadProgress).length)}%`
                      : "0%"}
                  </span>
                </div>

                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="truncate">{fileName}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags * (Từ khóa liên quan)</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="VD: React, TypeScript, E-commerce"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Display Tags */}
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-genz-purple/10 text-genz-purple">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-auto p-0 text-genz-purple hover:text-genz-purple/80"
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

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => reset()}>
                Hủy
              </Button>
              <Button type="submit" disabled={isUploading} className="bg-genz-purple hover:bg-genz-purple/90">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng...
                  </>
                ) : (
                  "Đăng dự án"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-genz-purple">🎉 Thành công!</DialogTitle>
            <DialogDescription>
              Dự án của bạn đã được đăng thành công và sẽ xuất hiện trong feed của cộng đồng.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessModal(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
