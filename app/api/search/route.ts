import { type NextRequest, NextResponse } from "next/server"
import { Client } from "@elastic/elasticsearch"

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || "elastic",
    password: process.env.ELASTICSEARCH_PASSWORD || "changeme",
  },
})

interface SearchFilters {
  categories?: string[]
  tags?: string[]
  contentType?: ("projects" | "videos" | "users")[]
  dateRange?: {
    from?: string
    to?: string
  }
  sortBy?: "relevance" | "newest" | "oldest" | "most-liked" | "most-viewed"
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const filters: SearchFilters = {
      categories: searchParams.get("categories")?.split(",") || [],
      tags: searchParams.get("tags")?.split(",") || [],
      contentType: (searchParams.get("type")?.split(",") as ("projects" | "videos" | "users")[]) || [
        "projects",
        "videos",
        "users",
      ],
      sortBy: (searchParams.get("sort") as SearchFilters["sortBy"]) || "relevance",
    }

    const results = await performElasticsearchQuery(query, filters, page, limit)

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}

async function performElasticsearchQuery(query: string, filters: SearchFilters, page: number, limit: number) {
  const from = (page - 1) * limit

  // Build Elasticsearch query
  const searchBody: any = {
    query: {
      bool: {
        must: [],
        filter: [],
      },
    },
    sort: [],
    from,
    size: limit,
    highlight: {
      fields: {
        title: {},
        description: {},
        content: {},
      },
    },
    aggs: {
      content_types: {
        terms: { field: "content_type" },
      },
      categories: {
        terms: { field: "category.keyword" },
      },
      tags: {
        terms: { field: "tags.keyword", size: 20 },
      },
    },
  }

  // Add text search
  if (query.trim()) {
    searchBody.query.bool.must.push({
      multi_match: {
        query: query,
        fields: ["title^3", "description^2", "content", "tags^2", "user.full_name", "user.username"],
        type: "best_fields",
        fuzziness: "AUTO",
      },
    })
  } else {
    searchBody.query.bool.must.push({
      match_all: {},
    })
  }

  // Add content type filter
  if (filters.contentType && filters.contentType.length > 0) {
    searchBody.query.bool.filter.push({
      terms: { content_type: filters.contentType },
    })
  }

  // Add category filter
  if (filters.categories && filters.categories.length > 0) {
    searchBody.query.bool.filter.push({
      terms: { "category.keyword": filters.categories },
    })
  }

  // Add tags filter
  if (filters.tags && filters.tags.length > 0) {
    searchBody.query.bool.filter.push({
      terms: { "tags.keyword": filters.tags },
    })
  }

  // Add date range filter
  if (filters.dateRange) {
    const dateFilter: any = {
      range: {
        created_at: {},
      },
    }
    if (filters.dateRange.from) dateFilter.range.created_at.gte = filters.dateRange.from
    if (filters.dateRange.to) dateFilter.range.created_at.lte = filters.dateRange.to
    searchBody.query.bool.filter.push(dateFilter)
  }

  // Add sorting
  switch (filters.sortBy) {
    case "newest":
      searchBody.sort.push({ created_at: { order: "desc" } })
      break
    case "oldest":
      searchBody.sort.push({ created_at: { order: "asc" } })
      break
    case "most-liked":
      searchBody.sort.push({ likes_count: { order: "desc" } })
      break
    case "most-viewed":
      searchBody.sort.push({ views_count: { order: "desc" } })
      break
    case "relevance":
    default:
      searchBody.sort.push("_score")
      break
  }

  // try {
    // const response = await client.search({
    //   index: "genzskillboost_*",
    //   body: searchBody,
    // })

    // const hits = response.body.hits.hits
    // const aggregations = response.body.aggregations

    // Group results by content type
    // const results = {
    //   projects: [],
    //   videos: [],
    //   users: [],
    // }

    // for (const hit of hits) {
    //   const source = hit._source
    //   const contentType = source.content_type

      // if (contentType === "project") {
      //   results.projects.push({
      //     id: source.id,
      //     title: source.title,
      //     description: source.description,
      //     images: source.images,
      //     tags: source.tags,
      //     category: source.category,
      //     user: source.user,
      //     likesCount: source.likes_count,
      //     viewsCount: source.views_count,
      //     commentsCount: source.comments_count,
      //     createdAt: source.created_at,
      //     highlight: hit.highlight,
      //     score: hit._score,
      //   })
      // } else if (contentType === "video") {
      //   results.videos.push({
      //     id: source.id,
      //     title: source.title,
      //     description: source.description,
      //     thumbnailUrl: source.thumbnail_url,
      //     videoUrl: source.video_url,
      //     duration: source.duration,
      //     tags: source.tags,
      //     user: source.user,
      //     likesCount: source.likes_count,
      //     viewsCount: source.views_count,
      //     commentsCount: source.comments_count,
      //     createdAt: source.created_at,
      //     highlight: hit.highlight,
      //     score: hit._score,
      //   })
      // } else if (contentType === "user") {
      //   results.users.push({
      //     id: source.id,
      //     username: source.username,
      //     fullName: source.full_name,
      //     avatarUrl: source.avatar_url,
      //     bio: source.bio,
      //     skills: source.skills,
      //     location: source.location,
      //     projectsCount: source.projects_count,
      //     videosCount: source.videos_count,
      //     followersCount: source.followers_count,
      //     highlight: hit.highlight,
      //     score: hit._score,
      //   })
      // }
    // }

  //   return {
  //     results,
  //     total: response.body.hits.total.value,
  //     aggregations: {
  //       contentTypes: aggregations.content_types.buckets,
  //       categories: aggregations.categories.buckets,
  //       tags: aggregations.tags.buckets,
  //     },
  //     pagination: {
  //       page,
  //       limit,
  //       total: response.body.hits.total.value,
  //       totalPages: Math.ceil(response.body.hits.total.value / limit),
  //     },
  //   }
  // } catch (error) {
  //   console.error("Elasticsearch query error:", error)
  //   throw error
  // }
}

// Function to index content in Elasticsearch
export async function indexContent(contentType: "project" | "video" | "user", data: any) {
  try {
    const index = `genzskillboost_${contentType}s`

    await client.index({
      index,
      id: data.id,
      body: {
        ...data,
        content_type: contentType,
        indexed_at: new Date().toISOString(),
      },
    })

    console.log(`Indexed ${contentType} ${data.id}`)
  } catch (error) {
    console.error(`Error indexing ${contentType}:`, error)
  }
}

// Function to delete content from Elasticsearch
export async function deleteFromIndex(contentType: "project" | "video" | "user", id: string) {
  try {
    const index = `genzskillboost_${contentType}s`

    await client.delete({
      index,
      id,
    })

    console.log(`Deleted ${contentType} ${id} from index`)
  } catch (error) {
    console.error(`Error deleting ${contentType} from index:`, error)
  }
}
