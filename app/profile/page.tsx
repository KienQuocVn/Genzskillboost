"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Camera, Edit3, Save, X, Loader2, MapPin, Calendar, LinkIcon, Github, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { uploadToS3 } from "@/lib/aws-s3"
// import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"

const profileSchema = z.object({
  fullName: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(50, "Tên không được quá 50 ký tự"),
  username: z
    .string()
    .min(3, "Username phải có ít nhất 3 ký tự")
    .max(20, "Username không được quá 20 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ được chứa chữ cái, số và dấu gạch dưới"),
  bio: z.string().max(500, "Bio không được quá 500 ký tự").optional(),
  location: z.string().max(100, "Địa điểm không được quá 100 ký tự").optional(),
  website: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  githubUrl: z.string().url("URL GitHub không hợp lệ").optional().or(z.literal("")),
  linkedinUrl: z.string().url("URL LinkedIn không hợp lệ").optional().or(z.literal("")),
  twitterUrl: z.string().url("URL Twitter không hợp lệ").optional().or(z.literal("")),
  skills: z.array(z.string()).max(20, "Không được quá 20 kỹ năng"),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface UserProfile {
  id: string
  email: string
  fullName: string
  username: string
  bio?: string
  location?: string
  website?: string
  githubUrl?: string
  linkedinUrl?: string
  twitterUrl?: string
  avatarUrl?: string
  skills: string[]
  createdAt: string
  projectsCount: number
  videosCount: number
  followersCount: number
  followingCount: number
}

interface UserProject {
  id: string
  title: string
  description: string
  category: string
  images: string[]
  likesCount: number
  commentsCount: number
  viewsCount: number
  createdAt: string
}

interface UserVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  duration: number
  likesCount: number
  commentsCount: number
  viewsCount: number
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userProjects, setUserProjects] = useState<UserProject[]>([])
  const [userVideos, setUserVideos] = useState<UserVideo[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [currentSkill, setCurrentSkill] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      skills: [],
    },
  })

  const watchedSkills = watch("skills")

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Fetch user profile data
  // useEffect(() => {
  //   if (session?.user?.id) {
  //     fetchUserProfile()
  //     fetchUserContent()
  //   }
  // }, [session])

  // const fetchUserProfile = async () => {
  //   if (!session?.user?.id) return

  //   try {
  //     const { data: userData, error } = await supabase
  //       .from("users")
  //       .select(`
  //         *,
  //         projects:projects(count),
  //         videos:videos(count),
  //         followers:follows!follows_following_id_fkey(count),
  //         following:follows!follows_follower_id_fkey(count)
  //       `)
  //       .eq("id", session.user.id)
  //       .single()

  //     if (error) throw error

  //     const profileData: UserProfile = {
  //       id: userData.id,
  //       email: userData.email,
  //       fullName: userData.full_name,
  //       username: userData.username,
  //       bio: userData.bio,
  //       location: userData.location,
  //       website: userData.website,
  //       githubUrl: userData.github_url,
  //       linkedinUrl: userData.linkedin_url,
  //       twitterUrl: userData.twitter_url,
  //       avatarUrl: userData.avatar_url,
  //       skills: userData.skills || [],
  //       createdAt: userData.created_at,
  //       projectsCount: userData.projects[0]?.count || 0,
  //       videosCount: userData.videos[0]?.count || 0,
  //       followersCount: userData.followers[0]?.count || 0,
  //       followingCount: userData.following[0]?.count || 0,
  //     }

  //     setProfile(profileData)

  //     // Set form values
  //     reset({
  //       fullName: profileData.fullName,
  //       username: profileData.username,
  //       bio: profileData.bio || "",
  //       location: profileData.location || "",
  //       website: profileData.website || "",
  //       githubUrl: profileData.githubUrl || "",
  //       linkedinUrl: profileData.linkedinUrl || "",
  //       twitterUrl: profileData.twitterUrl || "",
  //       skills: profileData.skills,
  //     })
  //   } catch (error) {
  //     console.error("Error fetching profile:", error)
  //     toast({
  //       title: "Lỗi",
  //       description: "Không thể tải thông tin hồ sơ",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // const fetchUserContent = async () => {
  //   if (!session?.user?.id) return

  //   try {
  //     // Fetch user projects
  //     const { data: projects, error: projectsError } = await supabase
  //       .from("projects")
  //       .select("*")
  //       .eq("user_id", session.user.id)
  //       .order("created_at", { ascending: false })
  //       .limit(6)

  //     if (projectsError) throw projectsError
  //     setUserProjects(projects || [])

  //     // Fetch user videos
  //     const { data: videos, error: videosError } = await supabase
  //       .from("videos")
  //       .select("*")
  //       .eq("user_id", session.user.id)
  //       .order("created_at", { ascending: false })
  //       .limit(6)

  //     if (videosError) throw videosError
  //     setUserVideos(videos || [])
  //   } catch (error) {
  //     console.error("Error fetching user content:", error)
  //   }
  // }

  // const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0]
  //   if (!file || !session?.user?.id) return

  //   // Validate file type
  //   if (!file.type.startsWith("image/")) {
  //     toast({
  //       title: "Lỗi",
  //       description: "Vui lòng chọn file hình ảnh hợp lệ",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   // Validate file size (max 5MB)
  //   if (file.size > 5 * 1024 * 1024) {
  //     toast({
  //       title: "Lỗi",
  //       description: "File ảnh không được vượt quá 5MB",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   setIsUploadingAvatar(true)

  //   try {
  //     // Upload to S3
  //     const fileName = `avatars/${session.user.id}-${Date.now()}.${file.name.split(".").pop()}`
  //     const avatarUrl = await uploadToS3(file, fileName)

  //     // Update database
  //     const { error } = await supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", session.user.id)

  //     if (error) throw error

  //     // Update local state
  //     setProfile((prev) => (prev ? { ...prev, avatarUrl } : null))

  //     toast({
  //       title: "Thành công!",
  //       description: "Ảnh đại diện đã được cập nhật",
  //     })
  //   } catch (error) {
  //     console.error("Error uploading avatar:", error)
  //     toast({
  //       title: "Lỗi",
  //       description: "Không thể tải ảnh lên. Vui lòng thử lại.",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setIsUploadingAvatar(false)
  //   }
  // }

  const addSkill = () => {
    if (currentSkill.trim() && !watchedSkills.includes(currentSkill.trim())) {
      const newSkills = [...watchedSkills, currentSkill.trim()]
      setValue("skills", newSkills)
      setCurrentSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    const newSkills = watchedSkills.filter((skill) => skill !== skillToRemove)
    setValue("skills", newSkills)
  }

  // const onSubmit = async (data: ProfileFormData) => {
  //   if (!session?.user?.id) return

  //   setSaving(true)

  //   try {
  //     // Check if username is already taken (excluding current user)
  //     const { data: existingUser } = await supabase
  //       .from("users")
  //       .select("id")
  //       .eq("username", data.username)
  //       .neq("id", session.user.id)
  //       .single()

  //     if (existingUser) {
  //       toast({
  //         title: "Lỗi",
  //         description: "Username này đã được sử dụng",
  //         variant: "destructive",
  //       })
  //       return
  //     }

  //     // Update profile
  //     const { error } = await supabase
  //       .from("users")
  //       .update({
  //         full_name: data.fullName,
  //         username: data.username,
  //         bio: data.bio || null,
  //         location: data.location || null,
  //         website: data.website || null,
  //         github_url: data.githubUrl || null,
  //         linkedin_url: data.linkedinUrl || null,
  //         twitter_url: data.twitterUrl || null,
  //         skills: data.skills,
  //       })
  //       .eq("id", session.user.id)

  //     if (error) throw error

  //     // Update local state
  //     setProfile((prev) =>
  //       prev
  //         ? {
  //             ...prev,
  //             fullName: data.fullName,
  //             username: data.username,
  //             bio: data.bio,
  //             location: data.location,
  //             website: data.website,
  //             githubUrl: data.githubUrl,
  //             linkedinUrl: data.linkedinUrl,
  //             twitterUrl: data.twitterUrl,
  //             skills: data.skills,
  //           }
  //         : null,
  //     )

  //     setIsEditing(false)
  //     setShowSuccessModal(true)

  //     toast({
  //       title: "Thành công!",
  //       description: "Hồ sơ đã được cập nhật",
  //     })
  //   } catch (error) {
  //     console.error("Error updating profile:", error)
  //     toast({
  //       title: "Lỗi",
  //       description: "Không thể cập nhật hồ sơ. Vui lòng thử lại.",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setSaving(false)
  //   }
  // }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy hồ sơ</h2>
          <p className="text-muted-foreground">Vui lòng thử lại sau</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profile.avatarUrl || ""} alt={profile.fullName} />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-genz-purple to-genz-pink text-white">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </Button>

                  {/* <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  /> */}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-genz-purple to-genz-pink bg-clip-text text-transparent">
                      {profile.fullName}
                    </h1>
                    <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => setIsEditing(!isEditing)}
                      className={!isEditing ? "bg-genz-purple hover:bg-genz-purple/90" : ""}
                    >
                      {isEditing ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Hủy
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-muted-foreground mb-2">@{profile.username}</p>

                  {profile.bio && <p className="text-sm mb-4">{profile.bio}</p>}

                  {/* Profile Details */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    {profile.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {profile.location}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Tham gia {formatDate(profile.createdAt)}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center space-x-4 mb-4">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-genz-purple hover:text-genz-purple/80"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </a>
                    )}
                    {profile.githubUrl && (
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-genz-purple hover:text-genz-purple/80"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-genz-purple hover:text-genz-purple/80"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {profile.twitterUrl && (
                      <a
                        href={profile.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-genz-purple hover:text-genz-purple/80"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="font-semibold">{profile.projectsCount}</span>
                      <span className="text-muted-foreground ml-1">Dự án</span>
                    </div>
                    <div>
                      <span className="font-semibold">{profile.videosCount}</span>
                      <span className="text-muted-foreground ml-1">Video</span>
                    </div>
                    <div>
                      <span className="font-semibold">{profile.followersCount}</span>
                      <span className="text-muted-foreground ml-1">Người theo dõi</span>
                    </div>
                    <div>
                      <span className="font-semibold">{profile.followingCount}</span>
                      <span className="text-muted-foreground ml-1">Đang theo dõi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {profile.skills.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Kỹ năng</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-genz-purple/10 text-genz-purple">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Form */}
          {isEditing && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Chỉnh sửa hồ sơ</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                //  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Họ và tên *</Label>
                      <Input
                        id="fullName"
                        {...register("fullName")}
                        className={errors.fullName ? "border-destructive" : ""}
                      />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        {...register("username")}
                        className={errors.username ? "border-destructive" : ""}
                      />
                      {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Giới thiệu</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      {...register("bio")}
                      className={errors.bio ? "border-destructive" : ""}
                    />
                    {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Địa điểm</Label>
                    <Input
                      id="location"
                      {...register("location")}
                      className={errors.location ? "border-destructive" : ""}
                    />
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        {...register("website")}
                        className={errors.website ? "border-destructive" : ""}
                      />
                      {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="githubUrl">GitHub URL</Label>
                      <Input
                        id="githubUrl"
                        type="url"
                        {...register("githubUrl")}
                        className={errors.githubUrl ? "border-destructive" : ""}
                      />
                      {errors.githubUrl && <p className="text-sm text-destructive">{errors.githubUrl.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        {...register("linkedinUrl")}
                        className={errors.linkedinUrl ? "border-destructive" : ""}
                      />
                      {errors.linkedinUrl && <p className="text-sm text-destructive">{errors.linkedinUrl.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitterUrl">Twitter URL</Label>
                      <Input
                        id="twitterUrl"
                        type="url"
                        {...register("twitterUrl")}
                        className={errors.twitterUrl ? "border-destructive" : ""}
                      />
                      {errors.twitterUrl && <p className="text-sm text-destructive">{errors.twitterUrl.message}</p>}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <Label>Kỹ năng</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="VD: React, TypeScript, Design"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" onClick={addSkill} variant="outline">
                        Thêm
                      </Button>
                    </div>

                    {/* Display Skills */}
                    {watchedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {watchedSkills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-genz-purple/10 text-genz-purple">
                            {skill}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-1 h-auto p-0 text-genz-purple hover:text-genz-purple/80"
                              onClick={() => removeSkill(skill)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {errors.skills && <p className="text-sm text-destructive">{errors.skills.message}</p>}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" disabled={isSaving} className="bg-genz-purple hover:bg-genz-purple/90">
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Content Tabs */}
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects">Dự án ({profile.projectsCount})</TabsTrigger>
              <TabsTrigger value="videos">Video ({profile.videosCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-6">
              {userProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userProjects.map((project) => (
                    <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-muted">
                        {project.images[0] && (
                          <img
                            src={project.images[0] || "/placeholder.svg"}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-1">{project.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{project.likesCount} lượt thích</span>
                          <span>{project.viewsCount} lượt xem</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Chưa có dự án nào</p>
                  <Button
                    onClick={() => router.push("/skills/upload")}
                    className="bg-genz-purple hover:bg-genz-purple/90"
                  >
                    Tạo dự án đầu tiên
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="videos" className="mt-6">
              {userVideos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {userVideos.map((video) => (
                    <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-[9/16] bg-muted relative">
                        <img
                          src={video.thumbnailUrl || "/placeholder.svg"}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded px-1 py-0.5">
                          <span className="text-white text-xs">{video.duration}s</span>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm mb-1 line-clamp-2">{video.title}</h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{video.likesCount} ❤️</span>
                          <span>{video.viewsCount} 👁️</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Chưa có video nào</p>
                  <Button onClick={() => router.push("/videos/upload")} className="bg-genz-pink hover:bg-genz-pink/90">
                    Tạo video đầu tiên
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-genz-purple">🎉 Cập nhật thành công!</DialogTitle>
            <DialogDescription>Hồ sơ của bạn đã được cập nhật thành công.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessModal(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
