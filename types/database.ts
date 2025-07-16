export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          skills: string[]
          location: string | null
          social_links: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          skills?: string[]
          location?: string | null
          social_links?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          skills?: string[]
          location?: string | null
          social_links?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          images: string[]
          tags: string[]
          category: string
          status: "active" | "completed" | "draft"
          views_count: number
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          images?: string[]
          tags?: string[]
          category: string
          status?: "active" | "completed" | "draft"
          views_count?: number
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          images?: string[]
          tags?: string[]
          category?: string
          status?: "active" | "completed" | "draft"
          views_count?: number
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          video_url: string
          thumbnail_url: string
          duration: number
          tags: string[]
          likes_count: number
          comments_count: number
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          video_url: string
          thumbnail_url: string
          duration: number
          tags?: string[]
          likes_count?: number
          comments_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          video_url?: string
          thumbnail_url?: string
          duration?: number
          tags?: string[]
          likes_count?: number
          comments_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          content_id: string
          content_type: "project" | "video" | "thread"
          content: string
          likes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          content_type: "project" | "video" | "thread"
          content: string
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          content_type?: "project" | "video" | "thread"
          content?: string
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      forum_threads: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          category: string
          tags: string[]
          is_pinned: boolean
          likes_count: number
          comments_count: number
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          category: string
          tags?: string[]
          is_pinned?: boolean
          likes_count?: number
          comments_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          category?: string
          tags?: string[]
          is_pinned?: boolean
          likes_count?: number
          comments_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          content_id: string
          content_type: "project" | "video" | "comment" | "thread"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          content_type: "project" | "video" | "comment" | "thread"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          content_type?: "project" | "video" | "comment" | "thread"
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Record<string, any>
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Record<string, any>
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Record<string, any>
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
