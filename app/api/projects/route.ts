import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const category = searchParams.get("category")
    const userId = searchParams.get("userId")
    const sortBy = searchParams.get("sortBy") || "created_at"
    const order = searchParams.get("order") || "desc"

    let query = supabase.from("projects").select(`
        *,
        users:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: order === "asc" })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: projects, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      projects,
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, images, tags } = body

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: session.user.id,
        title,
        description,
        category,
        images: images || [],
        tags: tags || [],
        status: "active",
      })
      .select(`
        *,
        users:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
