// import { type NextRequest, NextResponse } from "next/server"
// import { supabase } from "@/lib/supabase"
// import { getServerSession } from "next-auth"
// import { authOptions } from "../../auth/[...nextauth]/route"
// import { sanitizeInput, preventSQLInjection, logRequest } from "@/middleware"

// export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     // Validate project ID format
//     if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
//       logRequest(request, 400, "Invalid project ID format")
//       return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
//     }

//     const { data: project, error } = await supabase
//       .from("projects")
//       .select(`
//         *,
//         users:user_id (
//           id,
//           username,
//           full_name,
//           avatar_url,
//           bio
//         )
//       `)
//       .eq("id", params.id)
//       .single()

//     if (error) {
//       logRequest(request, 500, `Database error: ${error.message}`)
//       return NextResponse.json({ error: error.message }, { status: 500 })
//     }

//     if (!project) {
//       logRequest(request, 404, `Project ${params.id} not found`)
//       return NextResponse.json({ error: "Project not found" }, { status: 404 })
//     }

//     // Increment view count
//     await supabase
//       .from("projects")
//       .update({ views_count: project.views_count + 1 })
//       .eq("id", params.id)

//     logRequest(request, 200, `Project ${params.id} retrieved successfully`)
//     return NextResponse.json(project)
//   } catch (error) {
//     logRequest(request, 500, `Internal server error: ${error}`)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }

// export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const session = await getServerSession(authOptions)
//     if (!session?.user?.id) {
//       logRequest(request, 401, "Unauthorized access attempt")
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const body = await request.json()

//     // Sanitize all string inputs
//     const sanitizedData = {
//       title: sanitizeInput(preventSQLInjection(body.title || "")),
//       description: sanitizeInput(preventSQLInjection(body.description || "")),
//       category: sanitizeInput(body.category || ""),
//       images: Array.isArray(body.images) ? body.images.map((img: string) => sanitizeInput(img)) : [],
//       tags: Array.isArray(body.tags) ? body.tags.map((tag: string) => sanitizeInput(preventSQLInjection(tag))) : [],
//       status: sanitizeInput(body.status || "draft"),
//     }

//     // Validate required fields
//     if (!sanitizedData.title || sanitizedData.title.length < 1) {
//       logRequest(request, 400, "Invalid title provided")
//       return NextResponse.json({ error: "Title is required" }, { status: 400 })
//     }

//     if (!sanitizedData.description || sanitizedData.description.length < 10) {
//       logRequest(request, 400, "Invalid description provided")
//       return NextResponse.json({ error: "Description must be at least 10 characters" }, { status: 400 })
//     }

//     // Validate project ID format
//     if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
//       logRequest(request, 400, "Invalid project ID format")
//       return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
//     }

//     // Check if user owns the project
//     const { data: existingProject } = await supabase.from("projects").select("user_id").eq("id", params.id).single()

//     if (!existingProject || existingProject.user_id !== session.user.id) {
//       logRequest(request, 403, `Forbidden access to project ${params.id}`)
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 })
//     }

//     const { data: project, error } = await supabase
//       .from("projects")
//       .update({
//         title: sanitizedData.title,
//         description: sanitizedData.description,
//         category: sanitizedData.category,
//         images: sanitizedData.images,
//         tags: sanitizedData.tags,
//         status: sanitizedData.status,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", params.id)
//       .select(`
//         *,
//         users:user_id (
//           id,
//           username,
//           full_name,
//           avatar_url
//         )
//       `)
//       .single()

//     if (error) {
//       logRequest(request, 500, `Database error: ${error.message}`)
//       return NextResponse.json({ error: error.message }, { status: 500 })
//     }

//     logRequest(request, 200, `Project ${params.id} updated successfully`)
//     return NextResponse.json(project)
//   } catch (error) {
//     logRequest(request, 500, `Internal server error: ${error}`)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }

// export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const session = await getServerSession(authOptions)
//     if (!session?.user?.id) {
//       logRequest(request, 401, "Unauthorized access attempt")
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     // Validate project ID format
//     if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
//       logRequest(request, 400, "Invalid project ID format")
//       return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
//     }

//     // Check if user owns the project
//     const { data: existingProject } = await supabase.from("projects").select("user_id").eq("id", params.id).single()

//     if (!existingProject || existingProject.user_id !== session.user.id) {
//       logRequest(request, 403, `Forbidden access to project ${params.id}`)
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 })
//     }

//     const { error } = await supabase.from("projects").delete().eq("id", params.id)

//     if (error) {
//       logRequest(request, 500, `Database error: ${error.message}`)
//       return NextResponse.json({ error: error.message }, { status: 500 })
//     }

//     logRequest(request, 200, `Project ${params.id} deleted successfully`)
//     return NextResponse.json({ message: "Project deleted successfully" })
//   } catch (error) {
//     logRequest(request, 500, `Internal server error: ${error}`)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }
