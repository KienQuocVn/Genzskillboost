import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const type = searchParams.get("type") || "for-you" // for-you, following, trending
    const userId = searchParams.get("userId")

    let query = supabase.from("videos").select(`
        *,
        users:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)

    // Apply filters based on type
    switch (type) {
      case "trending":
        query = query.eq("is_trending", true).order("trending_score", { ascending: false })
        break
      case "following":
        // TODO: Filter by followed users
        query = query.order("created_at", { ascending: false })
        break
      case "for-you":
      default:
        query = query.order("created_at", { ascending: false })
        break
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: videos, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      videos,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// export async function POST(request: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions)
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" },
