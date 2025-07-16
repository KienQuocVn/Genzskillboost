import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, filters } = body

    let supabaseQuery = supabase.from("projects").select(`
        *,
        users:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)

    // Apply text search
    if (query && query.trim()) {
      supabaseQuery = supabaseQuery.textSearch("title,description", query)
    }

    // Apply category filters
    if (filters.categories && filters.categories.length > 0) {
      supabaseQuery = supabaseQuery.in("category", filters.categories)
    }

    // Apply tag filters
    if (filters.tags && filters.tags.length > 0) {
      supabaseQuery = supabaseQuery.overlaps("tags", filters.tags)
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "newest":
        supabaseQuery = supabaseQuery.order("created_at", { ascending: false })
        break
      case "oldest":
        supabaseQuery = supabaseQuery.order("created_at", { ascending: true })
        break
      case "most-liked":
        supabaseQuery = supabaseQuery.order("likes_count", { ascending: false })
        break
      case "most-viewed":
        supabaseQuery = supabaseQuery.order("views_count", { ascending: false })
        break
      default:
        supabaseQuery = supabaseQuery.order("created_at", { ascending: false })
    }

    const { data: projects, error } = await supabaseQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ projects })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
