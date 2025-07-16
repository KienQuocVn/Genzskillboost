export interface User {
  id: string
  email: string
  username: string
  fullName: string
  avatarUrl?: string
  bio?: string
  skills: string[]
  location?: string
  socialLinks?: {
    website?: string
    linkedin?: string
    github?: string
    facebook?: string
  }
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  userId: string
  title: string
  description: string
  images: string[]
  tags: string[]
  category: ProjectCategory
  status: ProjectStatus
  viewsCount: number
  likesCount: number
  commentsCount: number
  createdAt: string
  updatedAt: string
  user?: User
}

export interface Video {
  id: string
  userId: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  likesCount: number
  commentsCount: number
  viewsCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
  user?: User
}

export interface Comment {
  id: string
  userId: string
  contentId: string
  contentType: "project" | "video"
  content: string
  likesCount: number
  createdAt: string
  updatedAt: string
  user?: User
}

export type ProjectCategory =
  | "web-development"
  | "mobile-development"
  | "design"
  | "marketing"
  | "content-creation"
  | "business"
  | "other"

export type ProjectStatus = "active" | "completed" | "draft"

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
