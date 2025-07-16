import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Create rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true,
})

// Input sanitization function
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim()
}

// SQL injection prevention
export function preventSQLInjection(input: string): string {
  const sqlKeywords = [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "CREATE",
    "ALTER",
    "EXEC",
    "EXECUTE",
    "UNION",
    "SCRIPT",
    "--",
    ";",
    "/*",
    "*/",
    "xp_",
  ]

  let sanitized = input
  sqlKeywords.forEach((keyword) => {
    const regex = new RegExp(keyword, "gi")
    sanitized = sanitized.replace(regex, "")
  })

  return sanitized
}

// Logging function
export function logRequest(req: NextRequest, status: number, message?: string) {
  const log = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("user-agent"),
    ip: req.ip || req.headers.get("x-forwarded-for"),
    status,
    message,
  }

  console.log("API_LOG:", JSON.stringify(log))

  // In production, send to logging service
  if (process.env.NODE_ENV === "production") {
    // Send to logging service like DataDog, LogRocket, etc.
  }
}

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.ip ?? "127.0.0.1"
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip)

    if (!success) {
      logRequest(request, 429, "Rate limit exceeded")
      return new NextResponse("Rate limit exceeded", { status: 429 })
    }

    // Add rate limit headers
    const response = NextResponse.next()
    response.headers.set("X-RateLimit-Limit", limit.toString())
    response.headers.set("X-RateLimit-Remaining", remaining.toString())
    response.headers.set("X-RateLimit-Reset", new Date(reset).toISOString())

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
