// import { createClient } from "@supabase/supabase-js"

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// // Types for database tables
// export interface User {
//   id: string
//   email: string
//   username: string
//   full_name: string
//   avatar_url?: string
//   bio?: string
//   skills: string[]
//   location?: string
//   created_at: string
//   updated_at: string
// }

// export interface Project {
//   id: string
//   user_id: string
//   title: string
//   description: string
//   images: string[]
//   tags: string[]
//   category: string
//   status: "active" | "completed" | "draft"
//   created_at: string
//   updated_at: string
// }

// export interface Video {
//   id: string
//   user_id: string
//   title: string
//   description?: string
//   video_url: string
//   thumbnail_url: string
//   duration: number
//   likes_count: number
//   comments_count: number
//   views_count: number
//   tags: string[]
//   created_at: string
//   updated_at: string
// }

// export interface Comment {
//   id: string
//   user_id: string
//   content_id: string
//   content_type: "project" | "video"
//   content: string
//   created_at: string
//   updated_at: string
// }
